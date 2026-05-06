# Pickleball Hub — Implementation Plan

> **Tạo bởi Claude Code** | Ngày: 2026-05-06

---

## Tổng quan dự án

**Pickleball Hub** là ứng dụng web full-stack quản lý đặt sân pickleball nội bộ cho nhóm/đội.

- **Frontend**: Next.js 14 (App Router, TypeScript, Tailwind CSS)
- **Backend**: Python FastAPI + PostgreSQL + Redis
- **Auth**: OTP qua Zalo
- **Payment**: Momo / ZaloPay QR
- **Realtime**: Server-Sent Events (SSE)
- **Deploy**: Docker → Vercel (FE) + Railway (BE) + Cloudflare DNS

---

## Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                        Cloudflare DNS                       │
│   pickleball-hub.vn → Vercel   api.pickleball-hub.vn → BE  │
└─────────────────────────────────────────────────────────────┘
         │                                    │
┌────────▼────────┐                 ┌─────────▼────────┐
│  Next.js 14     │  HTTP/SSE/WS   │   FastAPI         │
│  (Vercel)       │◄──────────────►│   (Railway)       │
│                 │                │                   │
│ - Court Grid    │                │ - Auth (OTP/JWT)  │
│ - Booking UI    │                │ - Booking logic   │
│ - Wallet QR     │                │ - Wallet deduct   │
│ - Team Split    │                │ - SSE broadcaster │
│ - Admin Panel   │                │ - Zalo notify     │
└─────────────────┘                └─────────┬─────────┘
                                             │
                              ┌──────────────▼──────────────┐
                              │       PostgreSQL             │
                              │  + Redis (SSE/rate-limit)    │
                              └─────────────────────────────┘
```

---

## Database Schema

### Tables

| Table | Mô tả |
|-------|-------|
| `users` | Thành viên, đăng ký qua SĐT |
| `otp_sessions` | OTP tạm thời (5 phút TTL) |
| `wallets` | Ví tiền 1:1 với user |
| `wallet_transactions` | Lịch sử giao dịch (bất biến) |
| `courts` | 10 sân pickleball |
| `slot_definitions` | Định nghĩa 6 khung giờ/sân |
| `court_slots` | Slot thực tế theo ngày |
| `bookings` | Đặt chỗ của thành viên |
| `attendance` | Điểm danh |

### Quan hệ chính
```
users 1──1 wallets 1──N wallet_transactions
users 1──N bookings N──1 court_slots N──1 slot_definitions N──1 courts
bookings 1──1 attendance
bookings 1──1 wallet_transactions (txn_id)
```

---

## API Endpoints

### Auth `/api/v1/auth/`
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/request-otp` | Gửi OTP qua Zalo |
| POST | `/verify-otp` | Xác minh OTP → JWT |
| POST | `/refresh` | Refresh token |
| POST | `/logout` | Đăng xuất |
| POST | `/register` | Tạo tài khoản mới |

### Courts `/api/v1/courts/`
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Danh sách sân |
| GET | `/{id}/slots?date=` | 6 slot của 1 sân theo ngày |
| GET | `/availability?date=` | Tất cả sân + slot theo ngày |

### Bookings `/api/v1/bookings/`
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/` | Đặt sân (trừ ví tự động) |
| GET | `/me` | Lịch sử đặt sân |
| DELETE | `/{id}` | Huỷ đặt sân + hoàn tiền |

### Wallet `/api/v1/wallet/`
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/me` | Số dư hiện tại |
| GET | `/me/transactions` | Lịch sử giao dịch |
| POST | `/topup/init` | Tạo QR nạp tiền |
| POST | `/topup/webhook` | Callback từ Momo/ZaloPay |

### Notifications `/api/v1/notifications/`
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/stream` | SSE stream realtime |

### Admin `/api/v1/admin/`
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/dashboard` | Thống kê tổng quan |
| CRUD | `/courts` | Quản lý sân |
| GET | `/members` | Danh sách thành viên |
| POST | `/members/{id}/topup` | Nạp tiền thủ công |
| GET | `/bookings` | Tất cả đặt sân |

---

## Các tính năng chính

### 1. OTP Login qua Zalo
```
1. User nhập SĐT → POST /auth/request-otp
2. Backend tạo OTP 6 số, lưu DB (5 phút)
3. Gọi Zalo OA API gửi tin nhắn OTP
4. User nhập OTP → POST /auth/verify-otp
5. Backend trả JWT (access 15ph + refresh 30 ngày)
6. Lưu trong httpOnly cookie
```

### 2. Đặt sân + Trừ ví (Atomic Transaction)
```sql
BEGIN TRANSACTION
  SELECT balance FROM wallets WHERE user_id=? FOR UPDATE
  IF balance < price → InsufficientFunds
  SELECT current_players FROM court_slots WHERE id=? FOR UPDATE  
  IF current_players >= max_players → SlotFull
  INSERT INTO bookings
  UPDATE court_slots SET current_players += 1
  UPDATE wallets SET balance -= price
  INSERT INTO wallet_transactions (type='deduct')
COMMIT
```

### 3. Nạp tiền qua QR (Momo/ZaloPay)
```
1. User chọn số tiền + provider → POST /wallet/topup/init
2. Backend gọi API tạo lệnh thanh toán → nhận QR deeplink
3. Hiển thị QR trên UI, user quét bằng Momo/ZaloPay app
4. Provider callback → POST /wallet/topup/webhook
5. Backend xác minh HMAC signature
6. Cộng tiền vào ví, lưu transaction
7. SSE push cập nhật số dư cho user
```

### 4. Real-time Slot Updates (SSE)
```
Client: EventSource('/notifications/stream')
Server: ConnectionManager với asyncio.Queue per user
Trigger: Mỗi khi booking tạo/huỷ → broadcast slot update
Frontend: useSSE hook → invalidate SWR cache → re-render SlotBadge
```

### 5. Thông báo sân đầy
```
Sau khi booking thành công:
IF current_players == max_players AND NOT notified_full:
  1. SSE broadcast all connected clients
  2. Zalo message to all booked users in that slot
  3. SET notified_full = TRUE (tránh duplicate)
```

### 6. Chia đội ngẫu nhiên
```python
def split_teams(players, teams=2):
    shuffled = random.sample(players, len(players))
    return [shuffled[i::teams] for i in range(teams)]
```

---

## Kế hoạch triển khai

### Giai đoạn 1 — Foundation (Tuần 1-2)
- [x] Khởi tạo dự án (monorepo structure)
- [x] Docker Compose setup (PostgreSQL + Redis + Backend + Frontend)
- [x] Database migrations (Alembic)
- [x] FastAPI skeleton + CORS + health check
- [x] Auth: OTP request/verify + JWT issue
- [x] Next.js setup + Tailwind + Shadcn/ui

### Giai đoạn 2 — Core Features (Tuần 3-4)
- [ ] Court + slot CRUD APIs
- [ ] Booking với atomic wallet deduction
- [ ] Wallet balance API
- [ ] Frontend: Court grid, booking modal, wallet page

### Giai đoạn 3 — Payments & Realtime (Tuần 5-6)
- [ ] Momo QR top-up integration
- [ ] ZaloPay QR top-up integration  
- [ ] SSE notification stream
- [ ] Zalo push notification khi sân đầy

### Giai đoạn 4 — Admin & UX (Tuần 7)
- [ ] Admin panel (courts, members, bookings, attendance)
- [ ] Team split feature
- [ ] Cost calculation per session

### Giai đoạn 5 — Deploy & CI/CD (Tuần 8)
- [ ] GitHub Actions workflows
- [ ] Vercel deployment (frontend)
- [ ] Railway deployment (backend)
- [ ] Cloudflare DNS config
- [ ] End-to-end testing

---

## Biến môi trường

```bash
# Backend
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/pickleball
REDIS_URL=redis://redis:6379/0
JWT_SECRET=<64-char random hex>
JWT_REFRESH_SECRET=<64-char random hex>
ZALO_OA_TOKEN=<Zalo Developer Console>
ZALO_OA_ID=<OA ID>
MOMO_PARTNER_CODE=<Momo Business>
MOMO_ACCESS_KEY=<Momo>
MOMO_SECRET_KEY=<Momo>
ZALOPAY_APP_ID=<ZaloPay>
ZALOPAY_KEY1=<ZaloPay>
ZALOPAY_KEY2=<ZaloPay>
WEBHOOK_BASE_URL=https://api.pickleball-hub.vn

# Frontend
NEXT_PUBLIC_API_URL=https://api.pickleball-hub.vn/api/v1
NEXT_PUBLIC_SSE_URL=https://api.pickleball-hub.vn/api/v1/notifications/stream
```

---

## Rủi ro & Giải pháp

| Rủi ro | Giải pháp |
|--------|-----------|
| Zalo API không có sandbox | Dùng mock service khi dev, test thực tế trước launch |
| Race condition booking | `SELECT FOR UPDATE` trong transaction |
| SSE multi-instance | Redis Pub/Sub thay in-process queue |
| Payment webhook giả mạo | Xác minh HMAC signature từ provider |
| OTP brute force | Rate limit 3 lần/SĐT/10 phút |

---

*Kế hoạch này được tạo bởi Claude Code cho mục đích học tập (BTVN Vibe Coding)*
