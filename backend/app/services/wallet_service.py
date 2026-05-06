import uuid
import json
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.wallet import Wallet, WalletTransaction
from app.utils.qr import create_momo_payment, create_zalopay_payment, verify_momo_webhook, verify_zalopay_webhook
from app.config import settings


async def get_wallet(db: AsyncSession, user_id: uuid.UUID) -> Wallet:
    wallet = await db.scalar(select(Wallet).where(Wallet.user_id == user_id))
    if not wallet:
        raise HTTPException(status_code=404, detail="Ví không tồn tại")
    return wallet


async def init_topup(db: AsyncSession, user_id: uuid.UUID, amount: float, provider: str) -> dict:
    if amount < 10000:
        raise HTTPException(status_code=400, detail="Số tiền nạp tối thiểu là 10.000đ")
    if amount > 10_000_000:
        raise HTTPException(status_code=400, detail="Số tiền nạp tối đa là 10.000.000đ")

    order_id = f"PB-{uuid.uuid4().hex[:12].upper()}"
    amount_int = int(amount)

    ipn_url = f"{settings.WEBHOOK_BASE_URL}/api/v1/wallet/topup/webhook"
    redirect_url = f"{settings.WEBHOOK_BASE_URL}/wallet"

    if provider == "momo":
        result = await create_momo_payment(order_id, amount_int, redirect_url, ipn_url)
        if result.get("resultCode") != 0:
            raise HTTPException(status_code=502, detail="Không thể tạo lệnh thanh toán Momo")
        return {
            "order_id": order_id,
            "qr_code_url": result.get("qrCodeUrl", ""),
            "pay_url": result.get("payUrl", ""),
            "amount": amount,
            "provider": "momo",
            "expires_in": 900,
        }
    elif provider == "zalopay":
        result = await create_zalopay_payment(order_id, amount_int, ipn_url)
        if result.get("return_code") != 1:
            raise HTTPException(status_code=502, detail="Không thể tạo lệnh thanh toán ZaloPay")
        return {
            "order_id": order_id,
            "qr_code_url": result.get("zp_trans_token", ""),
            "pay_url": result.get("order_url", ""),
            "amount": amount,
            "provider": "zalopay",
            "expires_in": 900,
        }
    else:
        raise HTTPException(status_code=400, detail="Provider không hợp lệ (momo|zalopay)")


async def process_momo_webhook(db: AsyncSession, payload: dict) -> dict:
    if not verify_momo_webhook(payload):
        raise HTTPException(status_code=400, detail="Chữ ký không hợp lệ")
    if payload.get("resultCode") != 0:
        return {"message": "Payment not successful, ignored"}

    order_id = payload["orderId"]
    amount = Decimal(payload["amount"])
    await _credit_wallet_by_order(db, order_id, amount, "momo")
    return {"message": "OK"}


async def process_zalopay_webhook(db: AsyncSession, data: str, mac: str) -> dict:
    if not verify_zalopay_webhook(data, mac):
        raise HTTPException(status_code=400, detail="MAC không hợp lệ")

    data_json = json.loads(data)
    order_id = data_json.get("app_trans_id", "")
    amount = Decimal(data_json.get("amount", 0))
    await _credit_wallet_by_order(db, order_id, amount, "zalopay")
    return {"return_code": 1, "return_message": "success"}


async def _credit_wallet_by_order(db: AsyncSession, order_id: str, amount: Decimal, provider: str) -> None:
    """Credit wallet for a completed payment. Idempotent via ref_id check."""
    existing = await db.scalar(
        select(WalletTransaction).where(WalletTransaction.ref_id == order_id)
    )
    if existing:
        return  # Already processed

    # Find wallet by order_id pattern "PB-{12hex}-{user_id_prefix}"
    # In production: store order_id → user_id mapping in Redis when creating the order
    # For now: use the note field to store user context
    # This is a placeholder — real impl needs Redis or DB pending orders table
    raise HTTPException(status_code=500, detail="Order mapping not implemented — use Redis pending orders")
