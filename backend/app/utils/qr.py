import hashlib
import hmac
import json
import time
import uuid
import httpx
from app.config import settings


async def create_momo_payment(order_id: str, amount: int, redirect_url: str, ipn_url: str) -> dict:
    """Create Momo payment order and return QR/pay URL."""
    request_id = str(uuid.uuid4())
    order_info = f"Nạp tiền Pickleball Hub - {order_id}"
    extra_data = ""

    raw_signature = (
        f"accessKey={settings.MOMO_ACCESS_KEY}"
        f"&amount={amount}"
        f"&extraData={extra_data}"
        f"&ipnUrl={ipn_url}"
        f"&orderId={order_id}"
        f"&orderInfo={order_info}"
        f"&partnerCode={settings.MOMO_PARTNER_CODE}"
        f"&redirectUrl={redirect_url}"
        f"&requestId={request_id}"
        f"&requestType=payWithMethod"
    )
    signature = hmac.new(
        settings.MOMO_SECRET_KEY.encode(), raw_signature.encode(), hashlib.sha256
    ).hexdigest()

    payload = {
        "partnerCode": settings.MOMO_PARTNER_CODE,
        "partnerName": "Pickleball Hub",
        "storeId": "PickleballHub",
        "requestId": request_id,
        "amount": amount,
        "orderId": order_id,
        "orderInfo": order_info,
        "redirectUrl": redirect_url,
        "ipnUrl": ipn_url,
        "lang": "vi",
        "requestType": "payWithMethod",
        "extraData": extra_data,
        "signature": signature,
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(settings.MOMO_ENDPOINT, json=payload, timeout=15.0)
        return resp.json()


def verify_momo_webhook(payload: dict) -> bool:
    """Verify HMAC signature from Momo webhook callback."""
    raw = (
        f"accessKey={settings.MOMO_ACCESS_KEY}"
        f"&amount={payload['amount']}"
        f"&extraData={payload['extraData']}"
        f"&message={payload['message']}"
        f"&orderId={payload['orderId']}"
        f"&orderInfo={payload['orderInfo']}"
        f"&orderType={payload['orderType']}"
        f"&partnerCode={payload['partnerCode']}"
        f"&payType={payload['payType']}"
        f"&requestId={payload['requestId']}"
        f"&responseTime={payload['responseTime']}"
        f"&resultCode={payload['resultCode']}"
        f"&transId={payload['transId']}"
    )
    expected = hmac.new(
        settings.MOMO_SECRET_KEY.encode(), raw.encode(), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, payload.get("signature", ""))


async def create_zalopay_payment(app_trans_id: str, amount: int, callback_url: str) -> dict:
    """Create ZaloPay payment order."""
    app_time = int(round(time.time() * 1000))
    embed_data = json.dumps({"redirecturl": callback_url})
    item = json.dumps([{"itemid": "topup", "itemname": "Nạp tiền Pickleball Hub", "itemprice": amount, "itemquantity": 1}])

    data = f"{settings.ZALOPAY_APP_ID}|{app_trans_id}|{settings.ZALOPAY_KEY1}|{amount}|{app_time}|{embed_data}|{item}"
    mac = hmac.new(settings.ZALOPAY_KEY1.encode(), data.encode(), hashlib.sha256).hexdigest()

    payload = {
        "app_id": settings.ZALOPAY_APP_ID,
        "app_trans_id": app_trans_id,
        "app_user": "pickleball_hub",
        "app_time": app_time,
        "amount": amount,
        "item": item,
        "embed_data": embed_data,
        "description": f"Nap tien Pickleball Hub - {app_trans_id}",
        "bank_code": "",
        "mac": mac,
        "callback_url": callback_url,
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(settings.ZALOPAY_ENDPOINT, json=payload, timeout=15.0)
        return resp.json()


def verify_zalopay_webhook(data: str, mac: str) -> bool:
    """Verify MAC from ZaloPay webhook."""
    expected = hmac.new(settings.ZALOPAY_KEY2.encode(), data.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, mac)
