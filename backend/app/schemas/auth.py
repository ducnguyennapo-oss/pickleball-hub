from pydantic import BaseModel, field_validator
import re


class RegisterRequest(BaseModel):
    phone: str
    full_name: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip().replace(" ", "").replace("-", "")
        if not re.match(r"^(0|\+84)[3-9]\d{8}$", v):
            raise ValueError("Số điện thoại không hợp lệ")
        return v

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Tên phải có ít nhất 2 ký tự")
        return v


class OtpRequest(BaseModel):
    phone: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip().replace(" ", "").replace("-", "")
        if not re.match(r"^(0|\+84)[3-9]\d{8}$", v):
            raise ValueError("Số điện thoại không hợp lệ")
        return v


class OtpVerify(BaseModel):
    phone: str
    otp_code: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str
