# Oryx Eyewear — Admin & E-Commerce Backend

Premium eyewear brand — Born in Morocco. Built for everywhere.

This repo contains the **admin panel** and **backend** for the Oryx Eyewear website: login, product management (with images, variants, dual pricing for promotions), order CRM (status workflow, delivery webhook), collections, content, and settings.

## Tech stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Prisma** + **PostgreSQL**
- **JWT** auth (httpOnly cookie) for admin

## Setup

1. **Clone and install**

   ```bash
   cd Oryx
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set:

   - `DATABASE_URL` — PostgreSQL connection string (e.g. [Neon](https://neon.tech), [Supabase](https://supabase.com), or local Postgres)
   - `JWT_SECRET` — Secret for admin sessions (min 32 chars in production)
   - Optional: `ADMIN_EMAIL`, `ADMIN_PASSWORD` for seed; `DELIVERY_WEBHOOK_SECRET` for delivery API

3. **Database**

   ```bash
   npx prisma db push
   npm run db:seed
   ```

   Default admin after seed: `admin@oryxeyewear.com` / `OryxAdmin2026!` (change in production).

4. **Run**

   ```bash
   npm run dev
   ```

   - Site: [http://localhost:3000](http://localhost:3000)
   - Admin: [http://localhost:3000/admin](http://localhost:3000/admin) (redirects to login if not authenticated)

## Admin features

- **Login** — Email + password, JWT in httpOnly cookie, 24h session
- **Dashboard** — Orders today, revenue this month, active products, low-stock alerts, recent orders
- **Products** — List (search, filter by status/low stock), create/edit with:
  - Name, slug, short/long description, collection, frame style, gender, dimensions
  - **Variants (colorways)** — Color, SKU, **price (MAD + EUR)**, **compare-at price (MAD + EUR)** for promotions, stock, low-stock threshold
  - Image upload (per variant), active/archived, featured, SEO
- **Orders** — List (filter by status), detail view, update **status** (pending → confirmed → processing → shipped → delivered, or returned / cancelled), tracking number, internal notes. Stock is deducted when status is set to **Confirmed**; restored if order is **Cancelled**.
- **Delivery webhook** — `POST /api/v1/delivery/webhook` with `order_number`, `status` (shipped | delivered | returned), optional `tracking_number`, and `secret` to update orders from your delivery provider. Configure `DELIVERY_WEBHOOK_SECRET` in Settings / env.
- **Collections** — List (create via API or future UI)
- **Content** — Placeholder for hero, story, FAQ (seed creates blocks)
- **Settings** — Delivery webhook docs, admin account notes

## API (summary)

- `POST /api/v1/admin/auth/login` — Admin login
- `POST /api/v1/admin/auth/logout` — Logout
- `GET /api/v1/admin/products` — List products (admin)
- `POST /api/v1/admin/products` — Create product (admin)
- `GET/PUT/DELETE /api/v1/admin/products/:id` — Get/update/archive product (admin)
- `POST /api/v1/admin/upload` — Upload product image (admin, multipart, `variantId` required)
- `GET /api/v1/admin/orders` — List orders (admin)
- `GET /api/v1/admin/orders/:id` — Order detail (admin)
- `PUT /api/v1/admin/orders/:id` — Update order status, tracking, notes (admin)
- `POST /api/v1/orders` — Create order (public, for storefront checkout)
- `POST /api/v1/delivery/webhook` — Update order status from delivery provider (secret in body)

## Scripts

- `npm run dev` — Dev server
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run db:generate` — Prisma generate
- `npm run db:push` — Push schema to DB
- `npm run db:seed` — Seed admin user, content blocks, default collection
- `npm run db:studio` — Prisma Studio

## License

Proprietary — Oryx Eyewear. Confidential.
