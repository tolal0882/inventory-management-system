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

| Field | Value |
|-------|-------|
| Email | `tolalong7@gmail.com` |
| Password | `Long@3624` |

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

### Backend
Deploy to **Render**, **Railway**, or **Fly.io** with these environment variables set:
- `DATABASE_URL` — your production PostgreSQL URL
- `JWT_SECRET` — a long random secret (never reuse the dev one)
- `FRONTEND_URL` — your production frontend domain

### Frontend
Deploy to **Vercel** or **Netlify** with:
- `VITE_API_URL` — your deployed backend URL

---

## License

MIT — see [frontend/ATTRIBUTIONS.md](frontend/ATTRIBUTIONS.md) for third-party component credits.
