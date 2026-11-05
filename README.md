# EPR Nexuss Scrap Marketplace

B2B industrial scrap marketplace. **Two independent apps** — no Next.js anywhere:

| | Stack | Folder |
| --- | --- | --- |
| **Backend** (REST API) | Node 20+, Express, Mongoose, MongoDB Atlas (files in GridFS) | [`backend/`](backend) |
| **Frontend** (web app) | React 19, React Router, Vite, Tailwind v4 | [`frontend/`](frontend) |

```
backend/
  src/
    server.js            boot: load .env, connect MongoDB, listen
    app.js               Express app (security headers, cookies, CSRF origin guard, /api, optional static frontend)
    config/constants.js  roles, categories, statuses
    models/              User, Listing, Deal, FileAsset, Notification, AuditLog, Setting, Counter
    lib/                 http wrapper, session (JWT cookie), auth, files (GridFS), upload (multer), validators,
                         serializers (what each role may see), deals/ledger/pricing maths, mailer, rate-limit
    routes/              one folder per endpoint, mirroring the URL  (routes/seller/listings/by-id/close → /api/seller/listings/:id/close)
  scripts/seed-admin.js  creates the first admin
frontend/
  index.html, vite.config.js   dev server proxies /api → backend
  src/
    main.jsx, App.jsx    entry + route table with role guards
    pages/               thin route components (one per URL)
    components/          views and UI, grouped by role: admin / seller / buyer / shared / ui / layout
    lib/                 api client, formatters, nav, status labels
```

## Run it (development)

```bash
npm run install:all        # installs root, backend and frontend dependencies

# 1) backend/.env  → replace <db_username> in MONGODB_URI with your Atlas database user
# 2) Atlas → Network Access → allow your IP

npm run seed:admin         # first admin: admin@eprnexuss.com / Admin@12345 (see backend/.env — change it!)
npm run dev                # API on http://localhost:4000, web app on http://localhost:5173
```
Open **http://localhost:5173**. Or run them separately: `cd backend && npm run dev` and `cd frontend && npm run dev`.

> The Atlas password was shared in chat — **rotate it** (Atlas → Database Access) and update `backend/.env`.
> `.env` is git-ignored; never commit it.

## How the two apps talk

The frontend calls **relative URLs** (`/api/...`), and cookies carry the login (httpOnly JWT). In development Vite
proxies `/api` to the backend, so the browser only ever sees one origin — no CORS setup, cookies just work.
Uploaded files are also served from `/api/files/:id`, with a permission check on every request.

## Environment (`backend/.env`, see `.env.example`)

`MONGODB_URI`, `JWT_SECRET` (32+ chars) are required. Optional: `PORT` (4000), `APP_URL` (frontend URL used in reset
emails), `SMTP_*` (otherwise emails print to the server console), `SERVE_FRONTEND`, `ADMIN_*` for the seed script.
The frontend needs no environment variables (`VITE_PROXY_TARGET` can point the dev proxy at a non-default API).

## Deploying (pick one)

**A — one server (simplest).** `npm run build`, then run the backend with `SERVE_FRONTEND=true`
(`backend/.env`). Express serves `frontend/dist` and `/api` from the same origin.

**B — two hosts.** Host `frontend/dist` on any static host (Netlify, Vercel, S3/CloudFront, nginx) and the backend on
Node hosting. Put them behind the **same domain** by forwarding `/api/*` to the backend (a rewrite/proxy rule:
Netlify `_redirects`, Vercel `rewrites`, nginx `location /api`). Keeping one origin is what makes cookie login and
file previews work without extra configuration.

Always: set a fresh `JWT_SECRET`, run `npm run seed:admin` against the production database, allow your server's IP
in Atlas, and serve over HTTPS (cookies become `Secure` when `NODE_ENV=production`).

## Roles

| Role | Highlights |
| --- | --- |
| **Seller** | Register with documents → create/edit listings (photos + PDFs, drafts) → submit for approval → anonymised enquiries, deal progress, settlements |
| **Recycler** | Register with authorisations → browse approved lots in verified categories → save lots → private offers → counteroffers → upload payment proof → pickup details |
| **Admin** | Verify/reject/suspend users → approve listings with margin pricing → run negotiations → advance deals (inspection → pickup → delivery) → confirm payments → settle → reports, audit log |

**Privacy** (enforced server-side in `backend/src/lib/serializers.js`): buyers never receive seller identity, the seller's private price,
the margin, or the pickup address before the pickup stage. **Money** (`ledger.js`): seller is paid their own price × weighed
quantity; buyer pays the agreed price × weighed quantity; the difference is platform revenue. Lot quantity is reserved
atomically when terms are agreed, so a lot can't be oversold.

## Notes

- `constants`, `pricing` and `ledger` exist in both apps by design (the apps share no code). If you change a rule, change it in both.
- Login/reset rate limits are in memory (per instance); use Redis if you run many instances.
- Payments are confirmed manually by admins — there is no payment gateway.
