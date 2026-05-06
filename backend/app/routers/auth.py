from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.auth import RegisterRequest, OtpRequest, OtpVerify, TokenResponse
from app.services.auth_service import register_user, request_otp, verify_otp
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await register_user(db, body.phone, body.full_name)
    return {"message": "Đăng ký thành công", "phone": user.phone}


@router.post("/request-otp")
async def request_otp_endpoint(body: OtpRequest, db: AsyncSession = Depends(get_db)):
    await request_otp(db, body.phone)
    return {"message": "OTP đã được gửi qua Zalo"}


@router.post("/verify-otp")
async def verify_otp_endpoint(body: OtpVerify, response: Response, db: AsyncSession = Depends(get_db)):
    access_token, refresh_token = await verify_otp(db, body.phone, body.otp_code)

    cookie_opts = {
        "httponly": True,
        "samesite": "lax",
        "secure": settings.is_production,
    }
    response.set_cookie("access_token", access_token, max_age=settings.JWT_ACCESS_EXPIRE_MINUTES * 60, **cookie_opts)
    response.set_cookie("refresh_token", refresh_token, max_age=settings.JWT_REFRESH_EXPIRE_DAYS * 86400, **cookie_opts)

    return {"message": "Đăng nhập thành công"}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Đã đăng xuất"}
