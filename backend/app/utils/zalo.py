import httpx
from app.config import settings


ZALO_API_BASE = "https://openapi.zalo.me/v3.0/oa"


async def get_user_id_by_phone(phone: str) -> str | None:
    """Resolve phone number to Zalo user ID via OA API."""
    if not settings.ZALO_OA_TOKEN:
        return None
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{ZALO_API_BASE}/getprofile",
            params={"phone": phone},
            headers={"access_token": settings.ZALO_OA_TOKEN},
            timeout=10.0,
        )
        data = resp.json()
        if data.get("error") == 0:
            return data.get("data", {}).get("user_id")
    return None


async def send_otp_message(zalo_uid: str, otp_code: str, phone: str) -> bool:
    """Send OTP code via Zalo OA message."""
    if not settings.ZALO_OA_TOKEN or not zalo_uid:
        # Dev mode: log OTP to console
        print(f"[DEV] OTP for {phone}: {otp_code}")
        return True

    message = f"[Pickleball Hub] Mã OTP của bạn là: {otp_code}\nMã có hiệu lực trong 5 phút. Không chia sẻ mã này với ai."
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{ZALO_API_BASE}/message/cs",
            json={
                "recipient": {"user_id": zalo_uid},
                "message": {"text": message},
            },
            headers={
                "access_token": settings.ZALO_OA_TOKEN,
                "Content-Type": "application/json",
            },
            timeout=10.0,
        )
        data = resp.json()
        return data.get("error") == 0


async def send_slot_full_notification(zalo_uid: str, court_name: str, play_date: str, start_time: str, end_time: str) -> bool:
    """Notify user that their booked court slot is now full — game is on!"""
    if not settings.ZALO_OA_TOKEN or not zalo_uid:
        print(f"[DEV] Slot full notification for {zalo_uid}: {court_name} {play_date} {start_time}-{end_time}")
        return True

    message = (
        f"🏓 [Pickleball Hub] Sân đã đủ người!\n\n"
        f"📍 Sân: {court_name}\n"
        f"📅 Ngày: {play_date}\n"
        f"⏰ Giờ: {start_time} - {end_time}\n\n"
        f"Hẹn gặp bạn trên sân! 🎉"
    )
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{ZALO_API_BASE}/message/cs",
            json={
                "recipient": {"user_id": zalo_uid},
                "message": {"text": message},
            },
            headers={
                "access_token": settings.ZALO_OA_TOKEN,
                "Content-Type": "application/json",
            },
            timeout=10.0,
        )
        data = resp.json()
        return data.get("error") == 0
