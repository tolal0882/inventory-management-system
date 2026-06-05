# 🏭 Inventory Management System — Backend

NestJS + PostgreSQL + Prisma backend for the Inventory Management System frontend.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Step 1 — Install PostgreSQL](#step-1--install-postgresql)
4. [Step 2 — Set Up the Backend](#step-2--set-up-the-backend)
5. [Step 3 — Configure Environment](#step-3--configure-environment)
6. [Step 4 — Set Up the Database](#step-4--set-up-the-database)
7. [Step 5 — Run the Backend](#step-5--run-the-backend)
8. [Step 6 — Connect the Frontend](#step-6--connect-the-frontend)
9. [API Reference](#api-reference)
10. [Role Permissions](#role-permissions)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Make sure you have these installed before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18+ | https://nodejs.org |
| npm | v9+ | Comes with Node.js |
| PostgreSQL | v14+ | https://www.postgresql.org/download |

To check versions:
```bash
node -v
npm -v
psql --version
```

---

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma        # Database schema (all tables)
│   └── seed.ts              # Creates default admin user
├── src/
│   ├── auth/                # JWT login / logout / /auth/me
│   ├── users/               # User management (CRUD)
│   ├── products/            # Product management (CRUD)
│   ├── suppliers/           # Supplier management (CRUD)
│   ├── transactions/        # Stock IN / OUT / TRANSFER / SHRINKAGE
│   ├── invoices/            # Invoice management (CRUD)
│   ├── purchase-orders/     # Purchase order management (CRUD)
│   ├── dashboard/           # Dashboard stats & chart data
│   ├── activity-logs/       # User login/logout history
│   ├── prisma/              # Database connection service
│   ├── app.module.ts        # Root module
│   └── main.ts              # App entry point
├── frontend-api-service.ts  # Drop into your frontend project
├── .env.example             # Environment variables template
├── package.json
└── tsconfig.json
```

---

## Step 1 — Install PostgreSQL

### Windows
1. Download installer from https://www.postgresql.org/download/windows
2. Run installer — keep default port **5432**
3. Set a password for the `postgres` user (remember this!)
4. After install, open **pgAdmin** or **SQL Shell (psql)**

### macOS
```bash
brew install postgresql@14
brew services start postgresql@14
```

### Linux (Ubuntu)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Create the database
Open your terminal and run:
```bash
# Login to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE inventory_db;

# Verify it was created
\l

# Exit
\q
```

---

## Step 2 — Set Up the Backend

```bash
# 1. Go into the backend folder
cd backend

# 2. Install all packages
npm install

# 3. Generate Prisma client
npx prisma generate
```

---

## Step 3 — Configure Environment

```bash
# Copy the example env file
cp .env.example .env
```

Now open `.env` in your code editor and fill in your values:

```env
# Your PostgreSQL connection — replace USER, PASSWORD, HOST, PORT, DATABASE
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/inventory_db"

# Secret key for JWT tokens — change this to any long random string
JWT_SECRET="change-this-to-a-random-secret-key-at-least-32-characters"
JWT_EXPIRES_IN="7d"

# Server port
PORT=3000

# Your React frontend URL (default Vite port)
FRONTEND_URL="http://localhost:5173"
```

> ⚠️ **Important**: Replace `YOUR_PASSWORD` with the PostgreSQL password you set in Step 1.

---

## Step 4 — Set Up the Database

Run these commands **in order**:

```bash
# Step 4a: Run database migrations (creates all tables)
npx prisma migrate dev --name init
```

You should see output like:
```
✔ Generated Prisma Client
✔ Database is now in sync with your schema
```

```bash
# Step 4b: Seed the database (creates default admin user)
npx ts-node prisma/seed.ts
```

You should see:
```
🌱 Seeding database...
✅ Admin user created: tolalong7@gmail.com

📋 Login credentials:
   Email   : tolalong7@gmail.com
   Password: Long@3624

🎉 Seeding complete!
```

---

## Step 5 — Run the Backend

```bash
# Development mode (auto-restarts on file changes)
npm run start:dev
```

You should see:
```
🚀 Server running on: http://localhost:3000/api
📦 Environment: development
```

### Test that it's working
Open your browser or use curl:
```bash
# Should return { "statusCode": 401, "message": "Unauthorized" }
curl http://localhost:3000/api/products

# Login test
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tolalong7@gmail.com","password":"Long@3624"}'
```

The login should return a token like:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5c...",
  "user": { "id": "...", "name": "Administrator", ... }
}
```

---

## Step 6 — Connect the Frontend

### 6a. Add the API environment variable

In your **frontend project**, create a `.env` file at the root:
```env
VITE_API_URL=http://localhost:3000/api
```

### 6b. Add the API service

Copy `frontend-api-service.ts` from this backend folder into your frontend:
```
src/app/services/api.ts
```

### 6c. Update AppContext.tsx

Replace the mock login in `src/app/context/AppContext.tsx` with real API calls:

```typescript
// At the top of AppContext.tsx, add:
import { authApi, productsApi, suppliersApi, transactionsApi, usersApi, invoicesApi } from '../services/api';

// Replace the login function:
const login = useCallback(async (email: string, password: string): Promise<boolean> => {
  setLoginError(null);
  setIsLoading(true);
  try {
    const user = await authApi.login(email, password);
    setCurrentUser(user);
    setStoredUser(user);

    // Load all data after login
    const [prods, supps, txns, usrs, invs] = await Promise.all([
      productsApi.getAll(),
      suppliersApi.getAll(),
      transactionsApi.getAll(),
      usersApi.getAll(),
      invoicesApi.getAll(),
    ]);
    setProducts(prods);
    setSuppliers(supps);
    setTransactions(txns);
    setUsers(usrs);
    setInvoices(invs);

    setIsLoading(false);
    return true;
  } catch (err: any) {
    setLoginError(err.message || 'Invalid email or password');
    setIsLoading(false);
    return false;
  }
}, []);

// Replace the logout function:
const logout = useCallback(async () => {
  await authApi.logout();
  setStoredUser(null);
  setCurrentUser(null);
  setProducts([]);
  setSuppliers([]);
  setTransactions([]);
  setInvoices([]);
  setUsers([]);
  setUserActivityLogs([]);
}, []);
```

### 6d. Run both servers

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run start:dev
# Running on http://localhost:3000/api
```

**Terminal 2 — Frontend:**
```bash
cd your-frontend-folder
pnpm dev
# Running on http://localhost:5173
```

Open your browser at **http://localhost:5173** and log in with:
- Email: `tolalong7@gmail.com`
- Password: `Long@3624`

---

## API Reference

All endpoints require `Authorization: Bearer <token>` header **except** `POST /auth/login`.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login — returns JWT token |
| POST | `/auth/logout` | Logout — logs activity |
| GET | `/auth/me` | Get current user profile |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | Get all products |
| GET | `/products?category=Electronics` | Filter by category |
| GET | `/products/low-stock` | Get products below min stock |
| GET | `/products/expiring?days=30` | Get expiring products |
| GET | `/products/:id` | Get single product |
| POST | `/products` | Create product |
| PUT | `/products/:id` | Update product |
| DELETE | `/products/:id` | Delete product (Admin only) |

### Suppliers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/suppliers` | Get all suppliers |
| GET | `/suppliers/:id` | Get single supplier |
| POST | `/suppliers` | Create supplier |
| PUT | `/suppliers/:id` | Update supplier |
| DELETE | `/suppliers/:id` | Delete supplier (Admin only) |

### Stock Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/transactions` | Get all transactions |
| GET | `/transactions?type=IN` | Filter by type (IN/OUT/TRANSFER/SHRINKAGE) |
| GET | `/transactions/:id` | Get single transaction |
| POST | `/transactions` | Create transaction (updates stock automatically) |
| PUT | `/transactions/:id/status` | Update transaction status |
| DELETE | `/transactions/:id` | Delete transaction (Admin only) |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/invoices` | Get all invoices |
| GET | `/invoices?status=Pending` | Filter by status |
| GET | `/invoices/:id` | Get single invoice |
| POST | `/invoices` | Create invoice |
| PUT | `/invoices/:id` | Update invoice |
| DELETE | `/invoices/:id` | Delete invoice (Admin only) |

### Purchase Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/purchase-orders` | Get all purchase orders |
| GET | `/purchase-orders?status=Draft` | Filter by status |
| GET | `/purchase-orders/:id` | Get single order |
| POST | `/purchase-orders` | Create purchase order |
| PUT | `/purchase-orders/:id` | Update purchase order |
| DELETE | `/purchase-orders/:id` | Delete order (Admin only) |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Get all users (Admin/Auditor) |
| GET | `/users/:id` | Get single user |
| POST | `/users` | Create user (Admin only) |
| PUT | `/users/:id` | Update user (Admin only) |
| DELETE | `/users/:id` | Delete user (Admin only) |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/stats` | Summary stats (total products, low stock, etc.) |
| GET | `/dashboard/stock-movement?months=6` | Stock in/out chart data |
| GET | `/dashboard/stock-by-category` | Stock grouped by category |

### Activity Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/activity-logs` | All login/logout activity (Admin/Auditor) |
| GET | `/activity-logs/user/:userId` | Activity for specific user |

---

## Role Permissions

| Endpoint | Admin | Inventory Staff | Warehouse Manager | Auditor |
|----------|-------|----------------|-------------------|---------|
| View products | ✅ | ✅ | ✅ | ✅ |
| Create/Edit products | ✅ | ✅ | ✅ | ❌ |
| Delete products | ✅ | ❌ | ❌ | ❌ |
| Create transactions | ✅ | ✅ | ✅ | ❌ |
| Approve transactions | ✅ | ❌ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| View users | ✅ | ❌ | ❌ | ✅ |
| View activity logs | ✅ | ❌ | ❌ | ✅ |

---

## Troubleshooting

### ❌ `DATABASE_URL` connection error
- Check your PostgreSQL is running: `pg_ctl status` or `brew services list`
- Verify your password in `.env` matches your PostgreSQL password
- Make sure the `inventory_db` database exists: `psql -U postgres -l`

### ❌ `Cannot find module '@prisma/client'`
```bash
npx prisma generate
```

### ❌ Migration fails
```bash
# Reset and re-run
npx prisma migrate reset
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
```

### ❌ CORS error in browser
- Check `FRONTEND_URL` in your `.env` matches where your frontend runs (default: `http://localhost:5173`)
- Make sure backend is running on port 3000

### ❌ `401 Unauthorized` on all requests
- The JWT token is missing or expired
- Log in again via `POST /auth/login` and use the new token

### View database in browser (optional)
```bash
npx prisma studio
# Opens at http://localhost:5555 — browse all tables visually
```

---

## Quick Start Summary

```bash
# 1. Install dependencies
npm install && npx prisma generate

# 2. Configure environment
cp .env.example .env  # then edit DATABASE_URL and JWT_SECRET

# 3. Setup database
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts

# 4. Start backend
npm run start:dev
```

Then in your frontend project:
```bash
# Add to .env
echo "VITE_API_URL=http://localhost:3000/api" >> .env

# Copy the API service
cp backend/frontend-api-service.ts src/app/services/api.ts

# Start frontend
pnpm dev
```

**Done! Visit http://localhost:5173 🎉**
