# CLAUDE.md — Pickleball Hub

Hướng dẫn cho Claude Code khi làm việc với dự án này.

## Dự án là gì

Full-stack web app quản lý đặt sân pickleball nội bộ.
- **Frontend**: Next.js 14 App Router + TypeScript + Tailwind + Shadcn/ui
- **Backend**: Python FastAPI + PostgreSQL + Redis
- **Monorepo**: `/frontend` và `/backend` là hai service riêng biệt

## Chạy dev local

```bash
# Toàn bộ stack (khuyến nghị)
docker compose up --build

# Chỉ backend
cd backend && uvicorn app.main:app --reload

# Chỉ frontend  
cd frontend && npm run dev
```

## Cấu trúc quan trọng

### Backend (`/backend/app/`)
- `models/` — SQLAlchemy ORM models, mỗi file = 1 table
- `schemas/` — Pydantic request/response schemas
- `routers/` — FastAPI route handlers (mỏng, chỉ HTTP logic)
- `services/` — Business logic (booking_service.py là file quan trọng nhất)
- `utils/zalo.py` — Zalo OA API wrapper
- `utils/qr.py` — Momo/ZaloPay QR generation

### Frontend (`/frontend/src/`)
- `app/` — Next.js App Router pages
- `app/(auth)/` — Public pages (login, register)
- `app/(app)/` — Protected pages (cần đăng nhập)
- `app/admin/` — Admin-only pages
- `components/` — Shared UI components
- `hooks/useSSE.ts` — SSE connection hook cho realtime
- `lib/api.ts` — Axios instance với JWT interceptor

## Conventions

### TypeScript / Next.js
- Dùng `'use client'` chỉ khi thực sự cần (hooks, event handlers)
- Server Components là default
- Data fetching: SWR cho client-side, `fetch` trong Server Components
- State: Zustand (`/store/authStore.ts`) cho global auth state

### Python / FastAPI
- Async everywhere: dùng `async def` cho tất cả route handlers
- DB sessions: inject qua `Depends(get_db)`
- Auth: inject qua `Depends(get_current_user)` hoặc `Depends(require_admin)`
- Business logic KHÔNG được trong routers — chuyển vào services/
- Dùng `SELECT ... FOR UPDATE` cho các transaction cần row-level lock

### Database
- Migration: `alembic revision --autogenerate -m "description"` rồi `alembic upgrade head`
- UUID primary keys cho tất cả tables
- Timestamps: `TIMESTAMPTZ` (timezone-aware)
- Tên table: snake_case, số nhiều (users, bookings, court_slots)

### Git
- Branch: `feature/`, `fix/`, `chore/`
- Commit: conventional commits (feat:, fix:, chore:, docs:)
- Không commit `.env`, chỉ commit `.env.example`

## Transaction quan trọng nhất

Booking + wallet deduction phải là ACID transaction:
```python
# backend/app/services/booking_service.py
async def create_booking(db, user_id, court_slot_id):
    async with db.begin():
        wallet = await db.execute(
            select(Wallet).where(Wallet.user_id == user_id).with_for_update()
        )
        slot = await db.execute(
            select(CourtSlot).where(CourtSlot.id == court_slot_id).with_for_update()
        )
        # check balance >= price
        # check current_players < max_players
        # INSERT booking, UPDATE slot count, UPDATE wallet balance
        # INSERT wallet_transaction
```

## SSE Pattern

```python
# Backend: broadcaster
class ConnectionManager:
    def __init__(self):
        self.connections: dict[str, asyncio.Queue] = {}

# Frontend: hook
const { data } = useSSE('/notifications/stream')
# Khi nhận event → invalidate SWR cache key
```

## Không làm những điều này

- Không mock database trong tests — dùng test database thực (`TEST_DATABASE_URL`)
- Không bỏ qua HMAC verification khi nhận webhook từ Momo/ZaloPay
- Không trả JWT trong response body — chỉ dùng httpOnly cookies
- Không gọi Zalo API trực tiếp từ route handlers — luôn qua `services/`
- Không hardcode API keys, dùng `config.py` với pydantic-settings

## Khi thêm tính năng mới

1. Thêm Alembic migration nếu cần thay đổi DB
2. Thêm Pydantic schema trước khi viết route
3. Business logic vào service layer
4. Frontend: types trước, rồi hooks/API calls, rồi UI
5. Test manual bằng Docker Compose trước khi commit

## Deployment notes

- Frontend deploy tự động lên Vercel khi push vào `main`
- Backend deploy lên Railway, detect từ `backend/Dockerfile`
- Webhook URL Momo/ZaloPay PHẢI là domain công khai (không phải localhost)
- Cloudflare proxy phải được bật cho `api.` subdomain
