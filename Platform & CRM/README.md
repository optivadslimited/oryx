# Platform & CRM

This folder documents the **admin platform and CRM** delivered for Oryx Eyewear. The actual source code lives in the repo under `src/` (Next.js App Router); this README is the single entry point for what was built and where it lives.

---

## What’s included

- **Admin panel** – Login, dashboard, products, collections, content, settings
- **Orders CRM** – List/detail, status workflow, manual order creation
- **Statistics** – Visits, orders, revenue (EUR), best countries, platform reach, affiliate metrics
- **Analytics** – Visit tracking, UTM support, public track API
- **Order numbering** – Format e.g. `MAR1234` (month + 4 digits), affiliate code on orders

---

## Where it lives in the repo

### Admin UI (pages)

| Area        | Path |
|------------|------|
| Layout     | `src/app/admin/layout.tsx` |
| Login      | `src/app/admin/login/page.tsx` |
| Dashboard  | `src/app/admin/dashboard/page.tsx` |
| Statistics | `src/app/admin/statistics/page.tsx` |
| Products   | `src/app/admin/products/page.tsx`, `.../new/page.tsx`, `.../[id]/edit/page.tsx` |
| Orders CRM | `src/app/admin/orders/page.tsx`, `.../[id]/page.tsx`, `.../new/page.tsx` |
| Collections| `src/app/admin/collections/page.tsx` |
| Content    | `src/app/admin/content/page.tsx` |
| Settings   | `src/app/admin/settings/page.tsx` |
| Error      | `src/app/admin/error.tsx` |

### Admin components

- `src/components/admin/AdminNav.tsx`
- `src/components/admin/ManualOrderForm.tsx`
- `src/components/admin/OrderStatusForm.tsx`
- `src/components/admin/ProductForm.tsx`
- `src/components/admin/ProductStatusToggle.tsx`

### APIs (admin & platform)

- Auth: `src/app/api/v1/admin/auth/login/route.ts`, `logout`, `me`
- Orders: `src/app/api/v1/orders/route.ts` (public create), `src/app/api/v1/admin/orders/route.ts`, `.../[id]/route.ts`
- Products: `src/app/api/v1/admin/products/route.ts`, `.../[id]/route.ts`, `.../images/...`, `upload`
- Collections: `src/app/api/v1/admin/collections/route.ts`, `.../[id]/route.ts`
- Statistics: `src/app/api/v1/admin/statistics/route.ts`
- Analytics: `src/app/api/v1/analytics/track/route.ts`
- Delivery: `src/app/api/v1/delivery/webhook/route.ts`

### Shared / lib

- `src/lib/db.ts` – Prisma client
- `src/lib/auth.ts` – Admin auth
- `src/lib/order-number.ts` – Order number generation
- `src/components/AnalyticsTracker.tsx` – Client-side visit tracking

### Data (Prisma)

- Schema: `prisma/schema.prisma` (includes `AnalyticsVisit`, `Order.affiliateCode`, etc.)
- Seed: `prisma/seed.ts`

---

## Quick run

- **Admin:** `/admin` (login: see seed or `.env`)
- **Orders CRM:** `/admin/orders` (+ “Create manual order” → `/admin/orders/new`)
- **Statistics:** `/admin/statistics`
