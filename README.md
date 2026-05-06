# 🏓 Pickleball Hub

> Ứng dụng quản lý đặt sân pickleball nội bộ và đội nhóm

[![Frontend Deploy](https://img.shields.io/badge/Frontend-Vercel-black)](https://pickleball-hub.vercel.app)
[![Backend Deploy](https://img.shields.io/badge/Backend-Railway-purple)](https://pickleball-hub-api.railway.app)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

---

## Giới thiệu

**Pickleball Hub** là ứng dụng web full-stack giúp tổ chức và quản lý các trận đấu pickleball nội bộ. Hỗ trợ đặt sân theo slot thời gian, quản lý ví điện tử, thông báo realtime và chia đội ngẫu nhiên.

### Tính năng chính

- **Đặt sân trực tuyến** — 10 sân, mỗi sân 6 slot/ngày, đặt sân trực tiếp từ giao diện web
- **Ví điện tử** — Nạp tiền qua QR Momo/ZaloPay, tự động trừ tiền khi đặt sân
- **Thông báo realtime** — Cập nhật slot trống tức thì, thông báo Zalo khi sân đầy
- **Đăng nhập OTP qua Zalo** — Không cần mật khẩu, an toàn và tiện lợi
- **Chia đội ngẫu nhiên** — Tự động chia đội từ danh sách người chơi đã đăng ký
- **Điểm danh** — Admin điểm danh thành viên từng trận
- **Admin Panel** — Quản lý sân, thành viên, đặt chỗ và doanh thu

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/ui |
| Backend | Python 3.12, FastAPI, SQLAlchemy (async), Alembic |
| Database | PostgreSQL 16, Redis 7 |
| Auth | JWT (httpOnly cookie) + OTP via Zalo OA |
| Realtime | Server-Sent Events (SSE) |
| Payment | Momo API, ZaloPay API |
| Notification | Zalo Official Account API |
| Deployment | Docker, Vercel (FE), Railway (BE) |
| CI/CD | GitHub Actions |
| DNS/CDN | Cloudflare |

---

## Cài đặt và chạy local

### Yêu cầu

- Docker Desktop >= 4.0
- Node.js >= 20 (để phát triển frontend)
- Python >= 3.12 (để phát triển backend)

### Nhanh nhất với Docker Compose

```bash
# 1. Clone repo
git clone https://github.com/your-username/pickleball-hub.git
cd pickleball-hub

# 2. Tạo file .env từ template
cp .env.example .env
# Chỉnh sửa .env với các API keys thực tế

# 3. Chạy toàn bộ stack
docker compose up --build

# 4. Chạy migrations
docker compose exec backend alembic upgrade head

# 5. Tạo admin đầu tiên
docker compose exec backend python -m app.scripts.create_admin
```

Truy cập:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Phát triển riêng từng phần

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

---

## Cấu trúc dự án

```
pickleball-hub/
├── .github/workflows/    # CI/CD GitHub Actions
├── backend/              # Python FastAPI
│   ├── app/
│   │   ├── models/       # SQLAlchemy ORM
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── routers/      # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── tasks/        # Background jobs
│   │   └── utils/        # Helpers (Zalo, QR, JWT)
│   ├── alembic/          # Database migrations
│   └── tests/            # Pytest test suite
├── frontend/             # Next.js 14
│   └── src/
│       ├── app/          # App Router pages
│       ├── components/   # React components
│       ├── hooks/        # Custom hooks (SSE, SWR)
│       ├── lib/          # API client, utils
│       ├── store/        # Zustand state
│       └── types/        # TypeScript types
├── nginx/                # Reverse proxy config
├── docker-compose.yml
└── PLAN.md               # Chi tiết kế hoạch triển khai
```

---

## Biến môi trường

Xem file `.env.example` để biết tất cả biến cần thiết.

Các biến quan trọng:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://...

# Auth
JWT_SECRET=<64-char random>

# Zalo OA (https://developers.zalo.me)
ZALO_OA_TOKEN=...
ZALO_OA_ID=...

# Momo Payment
MOMO_PARTNER_CODE=...
MOMO_SECRET_KEY=...

# ZaloPay
ZALOPAY_APP_ID=...
ZALOPAY_KEY2=...
```

---

## API Documentation

Khi chạy backend, truy cập:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Deployment

### Frontend (Vercel)

```bash
cd frontend
npm run build   # kiểm tra build trước
# Sau đó connect GitHub repo với Vercel
```

### Backend (Railway)

```bash
# Railway tự detect Dockerfile trong /backend
# Set environment variables trong Railway dashboard
```

### Cloudflare DNS

```
pickleball-hub.vn     CNAME  cname.vercel-dns.com  (proxied)
api.pickleball-hub.vn CNAME  <railway-domain>       (proxied)
```

---

## CI/CD

Mỗi push vào `main` sẽ trigger:
1. **Tests** — pytest (backend) + eslint/tsc (frontend)
2. **Build** — Docker build check
3. **Deploy** — Tự động deploy lên Vercel + Railway

---

## Đóng góp

Dự án này là bài tập học tập (BTVN Vibe Coding). Mọi góp ý đều được chào đón qua Issues.

---

## License

MIT License — xem [LICENSE](LICENSE)

---

*Built with Claude Code by Anthropic*
