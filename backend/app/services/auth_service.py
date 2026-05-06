import random
import string
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from fastapi import HTTPException, status

from app.models.user import User, OtpSession
from app.models.wallet import Wallet
from app.utils.zalo import get_user_id_by_phone, send_otp_message
from app.utils.security import create_access_token, create_refresh_token
from app.config import settings


async def register_user(db: AsyncSession, phone: str, full_name: str) -> User:
    existing = await db.scalar(select(User).where(User.phone == phone))
    if existing:
        raise HTTPException(status_code=409, detail="Số điện thoại đã được đăng ký")

    user = User(phone=phone, full_name=full_name)
    db.add(user)
    await db.flush()

    wallet = Wallet(user_id=user.id)
    db.add(wallet)
    await db.commit()
    await db.refresh(user)
    return user


async def request_otp(db: AsyncSession, phone: str) -> bool:
    user = await db.scalar(select(User).where(User.phone == phone))
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="Số điện thoại chưa được đăng ký")

    # Rate limit: max 3 OTPs per phone per 10 minutes
    ten_min_ago = datetime.now(timezone.utc) - timedelta(minutes=10)
    count = await db.scalar(
        select(OtpSession).where(
            and_(OtpSession.phone == phone, OtpSession.created_at >= ten_min_ago)
        ).with_only_columns(OtpSession.id)
    )
    # Simple count via len — acceptable for small scale
    recent = await db.execute(
        select(OtpSession.id).where(
            and_(OtpSession.phone == phone, OtpSession.created_at >= ten_min_ago)
        )
    )
    if len(recent.fetchall()) >= 3:
        raise HTTPException(status_code=429, detail="Quá nhiều yêu cầu OTP. Thử lại sau 10 phút.")

    otp_code = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    otp_session = OtpSession(phone=phone, otp_code=otp_code, expires_at=expires_at)
    db.add(otp_session)
    await db.commit()

    # Resolve Zalo UID and send OTP
    zalo_uid = user.zalo_uid or await get_user_id_by_phone(phone)
    if zalo_uid and not user.zalo_uid:
        user.zalo_uid = zalo_uid
        await db.commit()

    await send_otp_message(zalo_uid or "", otp_code, phone)
    return True


async def verify_otp(db: AsyncSession, phone: str, otp_code: str) -> tuple[str, str]:
    now = datetime.now(timezone.utc)
    otp = await db.scalar(
        select(OtpSession).where(
            and_(
                OtpSession.phone == phone,
                OtpSession.otp_code == otp_code,
                OtpSession.used == False,
                OtpSession.expires_at > now,
            )
        ).order_by(OtpSession.created_at.desc())
    )
    if not otp:
        raise HTTPException(status_code=400, detail="OTP không hợp lệ hoặc đã hết hạn")

    otp.used = True
    await db.commit()

    user = await db.scalar(select(User).where(User.phone == phone))
    if not user or not user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản bị vô hiệu hóa")

    token_data = {"sub": str(user.id), "phone": user.phone, "is_admin": user.is_admin}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    return access_token, refresh_token
