# WardrobeX — POS & Inventory Management System

A Point-of-Sale and Inventory Management System for a retail clothing store, built for ITEC 75 (System Integration and Architecture I).

**Stack:** React + Vite + Tailwind CSS v4 (frontend) · FastAPI (backend) · MySQL (database)

---

## 1. Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- MySQL Server (MySQL Workbench recommended for managing the DB)

---

## 2. Database Setup

1. Open MySQL Workbench (or your MySQL client of choice).
2. Run the script at `backend/schema.sql`. This creates the `wardrobex_db` database, all 7 tables (users, categories, products, transactions, transaction_items, stock_in, stock_alerts), and some sample product data.
3. Note your MySQL username, password, host, and port — you'll need them in the next step.

---

## 3. Backend Setup (FastAPI)

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env       # Windows
cp .env.example .env         # macOS/Linux
```

Open `.env` and fill in your actual MySQL credentials:

```
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wardrobex_db
JWT_SECRET_KEY=replace-this-with-a-long-random-secret-string
```

Run the API server:

```bash
uvicorn main:app --reload
```

The API will be live at **http://localhost:8000**. Interactive API docs (Swagger UI) are available at **http://localhost:8000/docs**.

### Create your first user

Since there's no user yet to log in with, create the first admin account directly via the Swagger UI (`/docs` → `POST /auth/register`) or with curl:

```bash
curl -X POST http://localhost:8000/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"full_name\":\"Jay Habitan\",\"username\":\"admin\",\"email\":\"admin@wardrobex.com\",\"password\":\"Admin@123\",\"role\":\"admin\"}"
```

Once you have an admin account, you can log in through the React app and create the rest of your team's accounts (manager, cashier, inventory_staff) directly from there in the future, or repeat the same `/auth/register` call with different roles.

---

## 4. Frontend Setup (React + Vite + Tailwind v4)

```bash
cd frontend
npm install

copy .env.example .env       # Windows
cp .env.example .env         # macOS/Linux

npm run dev
```

The app will be live at **http://localhost:5173**.

---

## 5. Logging In & Roles

| Role              | Redirects to | Access                                              |
|-------------------|--------------|------------------------------------------------------|
| `admin`           | Dashboard    | Full access to all modules                           |
| `manager`         | Dashboard    | Full access to all modules                           |
| `cashier`         | POS          | Point-of-Sale only                                    |
| `inventory_staff` | Inventory    | Inventory management only                             |

---

## 6. Project Structure

```
wardrobex/
├── backend/              # FastAPI application
│   ├── main.py           # App entrypoint, CORS, router registration
│   ├── database.py       # SQLAlchemy engine/session setup
│   ├── models.py         # ORM models (7 tables)
│   ├── schemas.py        # Pydantic request/response schemas
│   ├── auth.py           # JWT auth + role-based access control
│   ├── schema.sql        # Raw MySQL schema + seed data
│   └── routers/
│       ├── auth_router.py   # /auth/register, /auth/login, /auth/me
│       ├── products.py      # /products (CRUD), categories, stock-in, alerts
│       ├── pos.py           # /pos/checkout, transaction history, void
│       └── reports.py       # /reports/dashboard-summary, sales-summary, top-products
└── frontend/              # React application
    └── src/
        ├── api/client.js           # Axios instance + JWT interceptor
        ├── context/AuthContext.jsx # Login state, role checks
        ├── components/             # Sidebar, Navbar, ProtectedRoute
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx    # admin/manager
            ├── POS.jsx          # admin/manager/cashier
            ├── Inventory.jsx    # admin/manager/inventory_staff
            └── Reports.jsx      # admin/manager
```

---

## 7. Key Features Implemented

- **JWT-based authentication** with role-based access control (admin, manager, cashier, inventory_staff), matching the roles defined in your project document.
- **POS module:** product search, cart, tax calculation (12% default), multiple payment methods (cash, GCash, card), automatic stock decrement, change computation.
- **Inventory module:** add products, restock (stock-in log), deactivate products, automatic low-stock alert generation and resolution.
- **Reports module:** daily/weekly/monthly sales summaries, best-selling products (bar chart via Recharts), slow-moving product detection.
- **Dashboard:** today's sales, transaction count, low-stock count, active alerts feed.

---

## 8. Troubleshooting

- **CORS errors:** Confirm the frontend is running on `http://localhost:5173` — this is the only origin allowed in `backend/main.py`. Add more origins there if needed.
- **401 Unauthorized right after login:** Check that `JWT_SECRET_KEY` in `.env` is set and the backend was restarted after editing `.env`.
- **"Access denied for user" MySQL error:** Double-check `DB_USER` / `DB_PASSWORD` in `backend/.env` against your actual MySQL Workbench credentials.
- **Tailwind classes not applying:** Make sure `@tailwindcss/vite` is listed in `vite.config.js` plugins and that `src/index.css` starts with `@import "tailwindcss";`.
