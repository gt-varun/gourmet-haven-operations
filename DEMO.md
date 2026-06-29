# Demo Script — Verifying the Acceptance Criteria

This walkthrough maps directly to the PRD §10 acceptance criteria. Run the
backend and frontend (see [README](./README.md)) and seed the database first
(`cd backend && npm run seed`). All accounts use password `Password123`.

---

### 1. Per-role UI & API access
- Log in as **superadmin@gourmethaven.com** → sees Dashboard, POS, Inventory,
  Staff Management, **and** Audit Logs; can switch between both branches.
- Log in as **downtown.admin@gourmethaven.com** → sees Dashboard, POS,
  Inventory, Staff Management (no Audit Logs); scoped to Downtown Bistro only.
- Log in as **downtown.cashier@gourmethaven.com** → lands on POS; the sidebar
  shows **only POS**.

### 2. Cashier calling an admin-only API returns 403
While logged in as the cashier (cookie set), call an admin endpoint directly:
```bash
curl -i -b cookies.txt http://localhost:5001/api/reports/dashboard
# → HTTP/1.1 403 Forbidden
```
(Get `cookies.txt` from `curl -c cookies.txt -X POST .../api/auth/login -d ...`.)
The same `403` applies to `/api/audit-logs`, product writes, and voids.

### 3. Back button does not reveal a protected page after logout
1. Log in, navigate to the Dashboard.
2. Click **Logout**.
3. Press the browser **Back** button.
→ The SPA re-validates the session via `GET /api/auth/me`; because the cookie
was cleared server-side and responses are `Cache-Control: no-store`, you are
redirected to `/login`.

### 4. Logged-in user visiting /login is redirected
While logged in, manually navigate to `http://localhost:5173/login`.
→ `PublicRoute` auto-redirects to the dashboard (or POS for cashiers).

### 5. Selling reduces stock; selling out-of-stock fails atomically
- In **POS**, add *Craft Beer* (Downtown, stock 8) to the cart, set qty 2, pay.
  → Receipt prints; Inventory now shows stock 6.
- Try to checkout a quantity greater than available stock.
  → `400` "Out of stock"; the transaction rolls back — **no** partial stock
  change and **no** order is created. (Covered by integration test #7.)

### 6. Low-stock items surface on the dashboard
The seed ships *Craft Beer* (8 ≤ 10) and *Croissant* (4 ≤ 10) below their
reorder thresholds. The Dashboard "Low Stock" card and Inventory page flag them.

### 7. Reports are branch-scoped per role
- As the Downtown admin, the Dashboard totals reflect **only** Downtown orders.
- As super admin, switch branches to see each branch's figures, or the combined
  view. An admin cannot read another branch's data:
  ```bash
  curl -i -b cookies.txt "http://localhost:5001/api/products?branchId=<otherBranch>"
  # → 403 "you cannot access data from another branch"
  ```

### 8. Sensitive actions appear in the audit log
Perform: create a user (admin), restock a product, apply a discount at checkout,
and void an order. Then log in as super admin → **Audit Logs** lists each action
(`USER_CREATE`, `INVENTORY_RESTOCK`, `DISCOUNT_OVERRIDE`, `ORDER_VOID`) with
actor, branch, timestamp, and metadata. Audit logs are append-only.

### 9. Meaningful, incremental git history
`git log --oneline` shows commits scoped to the milestones (scaffold, auth/RBAC,
catalog/inventory, billing, reporting/audit, frontend, docs).

---

### Automated verification
```bash
cd backend && npm test
```
Seven integration tests assert the auth, RBAC, branch-isolation, transactional
stock-deduction, discount-cap, and rollback behaviors above.
