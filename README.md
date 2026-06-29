# Scalable POS & Inventory Management Platform

This is a production-grade, multi-branch POS (Point of Sale) and Inventory Management web application built for hotels and restaurants. It implements hierarchical Role-Based Access Control (RBAC), branch data isolation, atomic inventory updates using MongoDB transactions, secure session management, and role-scoped reporting.

## Tech Stack
- **Frontend**: React SPA, Vite, React Router, custom Vanilla CSS variables (glassmorphic dark theme)
- **Backend**: Node.js, Express, Mongoose, JWT (secure http-only cookies), rate-limiting
- **Database**: MongoDB Atlas (supports transaction rollbacks)

---

## Directory Structure
- `/backend`: Node/Express API server, database models, controllers, and routing
- `/frontend`: React SPA client
- `/scripts`: Database startup scripts
- `/db`: Local MongoDB data files

---

## Default Seeded Credentials
Use these credentials to test the RBAC capabilities (all passwords are `Password123`):

1. **Sara Super** (`SUPER_ADMIN`):
   - Email: `superadmin@gourmethaven.com`
   - Access: View all branch metrics, audit logs, create/edit branches, manage all users
2. **Alice Admin** (`ADMIN` - Downtown Bistro):
   - Email: `downtown.admin@gourmethaven.com`
   - Access: View Downtown metrics, manage Downtown catalog and inventory refills, create Downtown cashiers
3. **Charlie Cashier** (`CASHIER` - Downtown Bistro):
   - Email: `downtown.cashier@gourmethaven.com`
   - Access: Branch POS checkout, apply discount <= 10%, print invoice
4. **Bob Admin** (`ADMIN` - Uptown Café):
   - Email: `uptown.admin@gourmethaven.com`
5. **Cathy Cashier** (`CASHIER` - Uptown Café):
   - Email: `uptown.cashier@gourmethaven.com`

---

## How to Run locally

### 1. Pre-requisites
Ensure Node.js and MongoDB are installed on your system.

### 2. Start the Database
The billing system relies on MongoDB Transactions. Run the startup script to start a local MongoDB instance in replica set mode (`rs0`):
```bash
./scripts/start-db.sh
```

### 3. Seed Database & Start Backend API
Open a terminal in the `/backend` directory, install packages, run the seed script to populate the collections, and launch the server (runs on port `5001`):
```bash
cd backend
npm install
node src/seed.js   # Seeds the database with default business, branches, users, and products
npm run dev        # Starts server under hot-reload
```

### 4. Start React Frontend
Open a new terminal in the `/frontend` directory, install dependencies, and start the development server (runs on port `5173`):
```bash
cd frontend
npm install
npm run dev        # Starts Vite dev server
```

Navigate to `http://localhost:5173` in your web browser.

---

## Running Integration Tests
To run the automated test suite testing RBAC, branch isolation, and stock transactions:
```bash
cd backend
npm run test
```
