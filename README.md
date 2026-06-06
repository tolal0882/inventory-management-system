# Inventory Management System

A full-stack inventory management system built with **React + TypeScript** (frontend) and **NestJS + PostgreSQL** (backend).

---

## Live Production

| | URL |
|---|---|
| **Frontend** | https://inventory-management-frontend-ten-ebon.vercel.app |
| **Backend API** | https://inventory-backend-production-9602.up.railway.app/api |

---

## Project Structure

```
Inventory Management System/
├── frontend/          # React + TypeScript + Tailwind CSS (Vite)
├── backend/           # NestJS + Prisma + PostgreSQL
├── railway.json       # Root deploy config for Railway (monorepo)
├── nixpacks.toml      # Node.js build config for Railway
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS v4, Vite |
| UI Components | Radix UI (shadcn/ui), Lucide React |
| Charts | Recharts |
| Animations | Framer Motion (motion) |
| Excel | xlsx (export/import) |
| PDF | jsPDF + jspdf-autotable |
| Backend | NestJS, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken, 7-day expiry) |
| Password | bcryptjs |
| Email | Resend API (OTP / forgot password) |
| Rate Limiting | @nestjs/throttler (120 req/min per IP) |

---

## User Roles

| Role | Permissions |
|------|------------|
| Admin | Full access — users, products, transactions, reports, settings |
| Warehouse Manager | Manage stock, auto-approve own transactions |
| Inventory Staff | Submit transactions (requires Admin/WM approval) |
| Auditor | Read-only — view all data, reports, activity logs |

---

## Quick Start (Local Development)

### 1. Clone the repository

```bash
git clone https://github.com/tolal0882/inventory-management-system.git
cd inventory-management-system
```

### 2. Set up the backend

```bash
cd backend
npm install
cp .env.example .env     # Fill in your values (see Environment Variables below)
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
npm run start:dev
# Backend running at http://localhost:3000/api
```

### 3. Set up the frontend

```bash
cd frontend
pnpm install
# Create frontend/.env with:
# VITE_API_URL=http://localhost:3000/api
pnpm dev
# Frontend running at http://localhost:5173
```

### 4. Log in

Use the credentials set in `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `backend/.env`.

---

## Features

### Products
- Add, edit, deactivate products with SKU tracking
- Category management and unit tracking
- Low stock alerts and expiry date tracking
- Real-time search and filtering
- **Note:** Products with existing transactions cannot be deleted — deactivate instead

### Stock Transactions
- Stock In / Out / Transfer / Shrinkage
- Approval workflow (Inventory Staff requires Admin/WM approval)
- Automatic stock quantity updates on approval

### Suppliers
- Supplier database with contact info
- Link products to multiple suppliers

### Purchase Orders
- Create and track purchase orders per supplier/product
- Status: Draft → Ordered → Received / Cancelled

### Invoices
- Multi-item invoice creation
- Auto tax and total calculations
- Status: Draft → Pending → Paid / Overdue / Cancelled

### Reports & Analytics
- Dashboard with live stats (auto-refreshes every 15 seconds)
- Stock movement charts (bar, line)
- Category performance (pie chart)
- Supplier analytics
- Export to PDF and Excel

### User Management (Admin only)
- Create users with role assignment
- Approve / deactivate / delete users
- Activity log (login/logout history)
- **Note:** Users with existing records cannot be deleted — deactivate instead

### Forgot Password
- Request a 6-digit OTP sent to the user's registered email
- OTP expires after **60 seconds**
- Delivered via Resend (works for any email provider)

### Settings
- General: profile, language, timezone
- Notifications: toggle alerts
- Security: change password
- Data & Backup: export all data (xlsx), import products, clear data (Admin only)

---

## Environment Variables

### Backend — `backend/.env`

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/inventory_db"
JWT_SECRET="your-random-secret-at-least-32-characters"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"

# Email (Resend — https://resend.com, free 3000 emails/month)
RESEND_API_KEY="re_your_api_key_here"

# Admin seed (used by prisma/seed.ts)
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="Admin@12345"
SEED_ADMIN_NAME="Administrator"
```

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:3000/api
```

---

## Running Tests

### Backend (Jest)

```bash
cd backend
npm test                  # Run all tests
npm test -- --coverage    # With coverage report
npm test -- --watch       # Watch mode
```

### Frontend (Vitest)

```bash
cd frontend
pnpm test                 # Run all tests
pnpm test:cov             # With coverage report
pnpm test:watch           # Watch mode
```

---

## API Reference

Base URL: `http://localhost:3000/api`
All endpoints require `Authorization: Bearer <token>` except `/auth/login`, `/auth/request-otp`, `/auth/verify-otp`, `/auth/reset-password`.

| Resource | Endpoints |
|----------|-----------|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/change-password` |
| Forgot Password | `POST /auth/request-otp`, `POST /auth/verify-otp`, `POST /auth/reset-password` |
| Products | `GET/POST /products`, `GET/PUT/DELETE /products/:id`, `GET /products/low-stock`, `GET /products/expiring-soon` |
| Suppliers | `GET/POST /suppliers`, `GET/PUT/DELETE /suppliers/:id` |
| Transactions | `GET/POST /transactions`, `GET /transactions/:id`, `PUT /transactions/:id/status` |
| Purchase Orders | `GET/POST /purchase-orders`, `GET/PUT/DELETE /purchase-orders/:id` |
| Invoices | `GET/POST /invoices`, `GET/PUT/DELETE /invoices/:id` |
| Users | `GET/POST /users`, `GET/PUT/DELETE /users/:id`, `PUT /users/:id/approve` |
| Dashboard | `GET /dashboard/stats`, `GET /dashboard/stock-movement`, `GET /dashboard/stock-by-category` |
| Activity Logs | `GET /activity-logs`, `GET /activity-logs/user/:userId` |

---

## Deployment

### Backend → Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Railway uses the root `railway.json` and `nixpacks.toml` — no extra config needed.
3. Add a **PostgreSQL** database plugin in the Railway project.
4. Set these **Environment Variables** on the backend service:

| Variable | Value |
|---|---|
| `DATABASE_URL` | *(copy from PostgreSQL plugin — use the internal `postgres.railway.internal` URL)* |
| `JWT_SECRET` | *(generate: `openssl rand -base64 48`)* |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `FRONTEND_URL` | *(your Vercel URL)* |
| `RESEND_API_KEY` | *(from resend.com — free account)* |
| `SEED_ADMIN_EMAIL` | *(your admin login email)* |
| `SEED_ADMIN_PASSWORD` | *(your admin login password)* |
| `SEED_ADMIN_NAME` | `Administrator` |

5. Railway runs `prisma migrate deploy` automatically on each deploy via `railway.json`.
6. To seed the first admin user, run locally:
   ```bash
   DATABASE_URL="<postgres-public-url>" npx ts-node backend/prisma/seed.ts
   ```

> **Note:** Use `DATABASE_URL` (internal `postgres.railway.internal`) for the service — not `DATABASE_PUBLIC_URL`. The public URL is only for connecting from your laptop.

---

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import this GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Set this **Environment Variable**:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://your-backend.up.railway.app/api` |

4. **Important:** Before deploying via CLI, delete any local `frontend/dist/` folder first — otherwise Vercel uploads stale pre-built files instead of rebuilding:
   ```bash
   rm -rf frontend/dist
   cd frontend && vercel deploy --prod --force
   ```

> **Note:** `frontend/vercel.json` configures the SPA rewrite rules and install command automatically.

---

### After both are deployed

- Set Railway `FRONTEND_URL` = your Vercel domain
- Set Vercel `VITE_API_URL` = your Railway backend URL
- Redeploy both after updating the cross-origin URLs

---

## Known Behaviours

| Behaviour | Reason |
|---|---|
| Delete user/product returns 409 | Users/products with existing transactions, POs, or invoices cannot be hard-deleted — deactivate instead |
| Dashboard auto-refreshes every 15s | Polling keeps all users' views in sync without WebSockets |
| OTP expires in 60 seconds | Short window to prevent code reuse |
| `DATABASE_PUBLIC_URL` warning in Railway | Safe to ignore — backend uses private internal URL, no egress fees |
| Emails come from `onboarding@resend.dev` | Resend free plan; verify a custom domain on Resend to change the sender |

---

## License

MIT — see [frontend/ATTRIBUTIONS.md](frontend/ATTRIBUTIONS.md) for third-party component credits.
