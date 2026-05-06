import uuid
from datetime import datetime
from pydantic import BaseModel


class WalletResponse(BaseModel):
    id: uuid.UUID
    balance: float
    updated_at: datetime

    model_config = {"from_attributes": True}


class TransactionResponse(BaseModel):
    id: uuid.UUID
    type: str
    amount: float
    balance_after: float
    ref_id: str | None
    note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TopupInitRequest(BaseModel):
    amount: float
    provider: str  # momo | zalopay


class TopupInitResponse(BaseModel):
    order_id: str
    qr_code_url: str
    pay_url: str
    amount: float
    provider: str
    expires_in: int  # seconds


class MomoWebhookPayload(BaseModel):
    partnerCode: str
    orderId: str
    requestId: str
    amount: int
    orderInfo: str
    orderType: str
    transId: int
    resultCode: int
    message: str
    payType: str
    responseTime: int
    extraData: str
    signature: str


class ZaloPayWebhookPayload(BaseModel):
    data: str
    mac: str
    type: int
