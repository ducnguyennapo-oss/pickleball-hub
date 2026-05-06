from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.wallet import Wallet, WalletTransaction
from app.schemas.wallet import TopupInitRequest
from app.services.wallet_service import get_wallet, init_topup, process_momo_webhook, process_zalopay_webhook

router = APIRouter(prefix="/wallet", tags=["wallet"])


@router.get("/me")
async def my_wallet(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wallet = await get_wallet(db, current_user.id)
    return {"balance": float(wallet.balance), "updated_at": wallet.updated_at.isoformat()}


@router.get("/me/transactions")
async def my_transactions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wallet = await get_wallet(db, current_user.id)
    result = await db.execute(
        select(WalletTransaction)
        .where(WalletTransaction.wallet_id == wallet.id)
        .order_by(WalletTransaction.created_at.desc())
        .limit(50)
    )
    return [
        {
            "id": str(t.id),
            "type": t.type,
            "amount": float(t.amount),
            "balance_after": float(t.balance_after),
            "note": t.note,
            "created_at": t.created_at.isoformat(),
        }
        for t in result.scalars()
    ]


@router.post("/topup/init")
async def topup_init(
    body: TopupInitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await init_topup(db, current_user.id, body.amount, body.provider)


@router.post("/topup/webhook/momo")
async def momo_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.json()
    return await process_momo_webhook(db, payload)


@router.post("/topup/webhook/zalopay")
async def zalopay_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.json()
    return await process_zalopay_webhook(db, payload.get("data", ""), payload.get("mac", ""))
