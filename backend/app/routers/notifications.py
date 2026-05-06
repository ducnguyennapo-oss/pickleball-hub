from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.dependencies import get_current_user
from app.models.user import User
from app.services.notification_service import sse_event_generator

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/stream")
async def sse_stream(current_user: User = Depends(get_current_user)):
    return StreamingResponse(
        sse_event_generator(str(current_user.id)),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
