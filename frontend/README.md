# Frontend — Inventory Management System

React + TypeScript frontend for the Inventory Management System.  
Connects to the [NestJS backend](../backend/README.md) via REST API.

---

## Tech Stack

- **React 18** — UI framework
- **TypeScript** — Type safety
- **Tailwind CSS v4** — Utility-first styling
- **Vite** — Build tool and dev server
- **Radix UI / shadcn-ui** — Accessible component primitives
- **Framer Motion** — Animations
- **Recharts** — Charts and data visualization
- **xlsx** — Excel export and import
- **jsPDF + jspdf-autotable** — PDF export
- **Sonner** — Toast notifications
- **React Router v7** — Client-side routing
- **Vitest + Testing Library** — Unit and component tests

---

## Prerequisites

- Node.js v18+
- pnpm (`npm install -g pnpm`)
- Backend running at `http://localhost:3000/api`

---

## Setup

```bash
# Install dependencies
pnpm install

# Create environment file
echo "VITE_API_URL=http://localhost:3000/api" > .env

# Start development server
pnpm dev
```

Open `http://localhost:5173` in your browser.

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000/api` |

---

## Available Scripts

```bash
pnpm dev          # Start dev server (http://localhost:5173)
pnpm build        # Production build → dist/
pnpm preview      # Preview production build locally
pnpm test         # Run all tests (Vitest)
pnpm test:watch   # Tests in watch mode
pnpm test:cov     # Tests with coverage report
```

---

## Project Structure

```
src/
├── app/
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # Base components (Radix / shadcn-ui)
│   │   ├── Sidebar.tsx      # Navigation sidebar
│   │   ├── TopBar.tsx       # Header with search
│   │   └── [Modals]         # Product, Supplier, Invoice, User modals
│   ├── pages/               # Application pages
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── StockInOutPage.tsx
│   │   ├── SuppliersPage.tsx
│   │   ├── InvoicesPage.tsx
│   │   ├── ReportsPage.tsx
│   │   ├── UsersPage.tsx
│   │   └── SettingsPage.tsx
│   ├── context/
│   │   └── AppContext.tsx   # Global state (products, users, transactions…)
│   ├── services/
│   │   └── api.ts           # All API calls (fetch wrapper per resource)
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces
│   └── App.tsx              # Router and layout
├── test/
│   └── setup.ts             # Vitest global setup
├── styles/                  # Global CSS
└── main.tsx                 # Entry point
```

---

## Pages

| Page | Route | Access |
|------|-------|--------|
| Login | `/login` | Public |
| Dashboard | `/` | All roles |
| Products | `/products` | All roles |
| Stock In/Out | `/stock` | All except Auditor |
| Suppliers | `/suppliers` | All roles |
| Invoices | `/invoices` | All roles |
| Reports | `/reports` | All roles |
| Users | `/users` | Admin + Auditor |
| Settings | `/settings` | All roles |

---

## Settings Tabs

| Tab | Description | Who |
|-----|-------------|-----|
| General | Profile, language, timezone | All |
| Notifications | Toggle email/browser alerts | All |
| Security | Change password | All |
| Data & Backup | Export/import data, clear data | Admin only |

---

## Testing

Tests live alongside their source files as `*.spec.ts` or `*.test.tsx`.

```bash
pnpm test
```

**46 tests — all passing.**

Key test files:
- `src/app/services/api.spec.ts` — API service (27 tests)
- `src/app/__tests__/settings-storage.spec.ts` — Storage logic (19 tests)

---

## Build for Production

```bash
pnpm build
```

Output goes to `dist/`. Deploy to Vercel, Netlify, or any static host.  
Set `VITE_API_URL` to your production backend URL before building.

---

## Browser Support

Modern browsers with ES2020+ support:
- Chrome / Edge (latest)
- Firefox (latest)
- Safari (latest)
