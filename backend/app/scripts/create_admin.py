"""
Create the first admin user.
Run: python -m app.scripts.create_admin
"""
import asyncio
import sys
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.user import User
from app.models.wallet import Wallet


async def create_admin():
    phone = input("Nhập số điện thoại admin: ").strip()
    full_name = input("Nhập họ tên: ").strip()

    async with AsyncSessionLocal() as db:
        existing = await db.scalar(select(User).where(User.phone == phone))
        if existing:
            if existing.is_admin:
                print(f"User {phone} đã là admin.")
            else:
                existing.is_admin = True
                await db.commit()
                print(f"Đã cấp quyền admin cho {phone}.")
            return

        user = User(phone=phone, full_name=full_name, is_admin=True)
        db.add(user)
        await db.flush()

        wallet = Wallet(user_id=user.id)
        db.add(wallet)
        await db.commit()
        print(f"Đã tạo admin: {full_name} ({phone})")


if __name__ == "__main__":
    asyncio.run(create_admin())
