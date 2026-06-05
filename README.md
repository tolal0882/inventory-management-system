# Inventory Management System

A full-stack inventory management system built with **React + TypeScript** (frontend) and **NestJS + PostgreSQL** (backend).

---

## Project Structure

```
Inventory Management System/
├── frontend/          # React + TypeScript + Tailwind CSS
├── backend/           # NestJS + Prisma + PostgreSQL
└── README.md          # This file
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
| Auth | JWT (jsonwebtoken) |
| Password | bcryptjs |
| Testing (FE) | Vitest + Testing Library + happy-dom |
| Testing (BE) | Jest + ts-jest + @nestjs/testing |

---

## User Roles

| Role | Permissions |
|------|------------|
| Admin | Full access — users, products, transactions, reports, settings |
| Warehouse Manager | Manage stock, auto-approve own transactions |
| Inventory Staff | Submit transactions (requires Admin/WM approval) |
| Auditor | Read-only — view all data, reports, activity logs |

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/inventory-management-system.git
cd inventory-management-system
```

### 2. Set up the backend

```bash
cd backend
npm install
cp .env.example .env     # Edit .env with your PostgreSQL password and JWT secret
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

Use the credentials you set in `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in your `backend/.env` file (defaults: `admin@example.com` / `Admin@12345`).

| Field | Value |
|-------|-------|
| Email | *(your `SEED_ADMIN_EMAIL`)* |
| Password | *(your `SEED_ADMIN_PASSWORD`)* |

---

## Features

### Products
- Add, edit, delete products with SKU tracking
- Category management
- Low stock alerts and expiry date tracking
- Real-time search and filtering

### Stock Transactions
- Stock In / Out / Transfer / Shrinkage
- Approval workflow (Inventory Staff requires approval)
- Automatic stock quantity updates on approval

### Suppliers
- Supplier database with contact info
- Link products to suppliers

### Invoices
- Multi-item invoice creation
- Auto tax and total calculations
- Status: Draft → Pending → Paid / Overdue / Cancelled

### Reports & Analytics
- Dashboard with live stats
- Stock movement charts (bar, line)
- Category performance (pie chart)
- Supplier analytics
- Export to PDF and Excel

### User Management (Admin only)
- Create users with role assignment
- Activate / deactivate users
- Activity log (login/logout history)

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

**Test summary:** 172 tests total — 126 backend, 46 frontend — all passing.

---

## API Reference

Base URL: `http://localhost:3000/api`  
All endpoints require `Authorization: Bearer <token>` except `POST /auth/login`.

| Resource | Endpoints |
|----------|-----------|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Products | `GET/POST /products`, `GET/PUT/DELETE /products/:id` |
| Suppliers | `GET/POST /suppliers`, `GET/PUT/DELETE /suppliers/:id` |
| Transactions | `GET/POST /transactions`, `GET /transactions/:id`, `PUT /transactions/:id/status` |
| Invoices | `GET/POST /invoices`, `GET/PUT/DELETE /invoices/:id` |
| Users | `GET/POST /users`, `GET/PUT/DELETE /users/:id` |
| Dashboard | `GET /dashboard/stats`, `GET /dashboard/stock-movement`, `GET /dashboard/stock-by-category` |
| Activity Logs | `GET /activity-logs`, `GET /activity-logs/user/:userId` |

---

## Deployment

The backend deploys to **Railway** and the frontend deploys to **Vercel**. Both connect to the same GitHub repository.

---

### Backend → Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → select this repo.
2. In the service settings, set **Root Directory** to `backend`.
3. Railway reads `backend/railway.json` automatically — build and start commands are already configured.
4. Add a **PostgreSQL** plugin (Railway → New → Database → PostgreSQL). Copy the `DATABASE_URL` it generates.
5. Set these **Environment Variables** in Railway:

| Variable | Value |
|---|---|
| `DATABASE_URL` | *(auto-filled by Railway PostgreSQL plugin)* |
| `JWT_SECRET` | *(generate: `openssl rand -base64 48`)* |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `FRONTEND_URL` | *(your Vercel URL, e.g. `https://your-app.vercel.app`)* |
| `SEED_ADMIN_EMAIL` | *(your admin login email)* |
| `SEED_ADMIN_PASSWORD` | *(your admin login password)* |
| `SEED_ADMIN_NAME` | `Administrator` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | *(your Gmail address)* |
| `SMTP_PASS` | *(your Gmail App Password)* |

6. **Deploy** — Railway runs `prisma migrate deploy` then starts the server on each deploy.
7. To seed the admin user the first time, run in Railway Shell:
   ```bash
   npx ts-node prisma/seed.ts
   ```
8. Copy your Railway backend URL (e.g. `https://your-backend.up.railway.app`).

---

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import this GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Vercel detects Vite automatically. Confirm:
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`
4. Add this **Environment Variable**:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://your-backend.up.railway.app/api` |

5. **Deploy** — `frontend/vercel.json` handles SPA routing automatically.

---

### After both are live

- Update Railway's `FRONTEND_URL` to your Vercel domain.
- Update Vercel's `VITE_API_URL` to your Railway backend URL.
- Redeploy both services once after updating the cross-origin URLs.

---

## License

MIT — see [frontend/ATTRIBUTIONS.md](frontend/ATTRIBUTIONS.md) for third-party component credits.
