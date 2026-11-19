# PENNY Partner Handoff

Updated: 2026-11-19

## Current repository state

- Repository: `Necheee/Penny`
- Branch: `main`
- `HEAD`: `1158952`
- Branch is five commits ahead of `origin/main`.
- Source worktree was clean before this handoff update; this document is currently untracked.
- The database is a remote PostgreSQL/Neon instance configured through `server/.env`.
- Do not expose or commit `server/.env`.
- Linux Node.js `v26.13.1` is available at `/usr/local/bin/node`.

Recent commits:

1. `3d664d4` - add admin authentication to product/category mutations.
2. `90c1d94` - add `ProductStatus` and the catalogue migration foundation.
3. `5b9c691` - add product variants and product images.
4. `b05f252` - add inventory adjustments and checkout stock locking.
5. `1158952` - add Prisma 7 configuration and update package dependencies.

## Database migration status

The migration in [server/prisma/migrations/0001_catalogue_foundation/migration.sql](../server/prisma/migrations/0001_catalogue_foundation/migration.sql)
was applied successfully on 2026-11-18 after a database backup was confirmed.

The migration in [server/prisma/migrations/0002_relational_order_snapshots/migration.sql](../server/prisma/migrations/0002_relational_order_snapshots/migration.sql)
was applied successfully with `prisma migrate deploy` on 2026-11-19.
`prisma migrate status` reports that the database is up to date with both
migrations.

Verified live data after migration:

- `products`: 38 rows
- `categories`: 5 rows
- `orders`: 8 rows
- `product_variants`: 426 rows
- `product_images`: 77 rows
- `inventory_adjustments`: 0 rows
- All 38 products have status `ACTIVE`.
- No variant has negative stock.
- No migrated image has an empty URL.
- Foreign keys exist for product images, product variants, and inventory adjustments.

### Important migration bookkeeping caveat

The migration was applied directly with `psql`, not through Prisma CLI.

The live database now has `_prisma_migrations` with
`0001_catalogue_foundation` recorded as applied. This was reconciled with
Prisma 7's `prisma migrate resolve --applied` command after verifying the
migration had already been applied. Future deployments may use Prisma CLI, but
should still verify migration status before applying changes.

Prisma tooling is now runnable from Linux. Node.js `v26.13.1` is installed and
`npm run prisma:validate` succeeds. Prisma Client generation also succeeds.

## Current application architecture

The database schema now contains the relational catalogue structures, but the
application has not yet been converted to Prisma or made database-only.

Active catalogue routes still use handwritten `pg` queries and legacy fields:

- [server/src/routes/products.js](../server/src/routes/products.js)
- [server/src/routes/categories.js](../server/src/routes/categories.js)
- [server/src/utils/cloudDb.js](../server/src/utils/cloudDb.js)

Product and category catalogue routes no longer use operational JSON/in-memory
fallbacks, and database initialization no longer seeds products or categories
from JSON files. Other administrative content still uses its existing storage
paths and is outside this catalogue-source change.

Prisma models are defined in
[server/prisma/schema.prisma](../server/prisma/schema.prisma), but application
routes do not currently instantiate or use `PrismaClient`.

The Prisma 7 baseline is now configured in
[server/prisma.config.ts](../server/prisma.config.ts). The datasource URL is loaded
from `DATABASE_URL` there and is no longer declared in the Prisma schema.

## What is complete

- Admin authentication is present on product/category catalogue mutations.
- Product lifecycle values `DRAFT`, `ACTIVE`, and `ARCHIVED` are represented in
  the schema and product API.
- Relational product images and variants exist and were backfilled.
- Variant size, color, SKU, and stock fields exist.
- Inventory adjustment records and an admin adjustment endpoint exist.
- Checkout stock locking/decrement logic was added.
- The catalogue migration has been applied and verified against live data.
- The relational order snapshot migration has been applied and verified.
- Existing orders were backfilled into `order_items`.
- Order totals and item unit prices use `NUMERIC(12, 2)` in PostgreSQL.
- Prisma 7 is configured for migration/deployment tooling with
  `server/prisma.config.ts`.
- `npm run prisma:validate` passes.
- `npx prisma generate` generates `@prisma/client` successfully.

## What remains

### 1. Make PostgreSQL the only catalogue source of truth — **Complete**

Product and category routes now make database errors explicit and no longer
read/write catalogue JSON caches. Keep any frontend cache read-only and
non-authoritative.

Primary files:

- [server/src/routes/products.js](../server/src/routes/products.js)
- [server/src/routes/categories.js](../server/src/routes/categories.js)
- [server/src/utils/cloudDb.js](../server/src/utils/cloudDb.js)
- [server/src/utils/seedProductsToDb.js](../server/src/utils/seedProductsToDb.js)

Use small, reviewable changes. Preserve the existing API response shape until
the frontend migration is intentionally handled.

### 2. Resolve Prisma migration bookkeeping — **Complete**

The already-applied migration was safely recorded with Prisma 7's
`prisma migrate resolve --applied` command without rerunning its SQL.

### 3. Decide whether Prisma becomes the active data layer

The schema and live database are currently relational, but the application uses
`pg`. Either:

- adopt Prisma consistently for catalogue reads/writes; or
- explicitly retain `pg` and treat Prisma as a schema contract only.

Do not maintain two competing persistence implementations indefinitely.

### 4. Complete catalogue model usage

Product routes still expose legacy JSON fields (`colors`, `available_sizes`,
`images`, `is_archived`) alongside the new relational variant/image tables.
Update read/write normalization and admin forms so variants and images are the
authoritative values.

## Full remaining implementation roadmap

The following items from the original handoff remain in scope. The statuses below
reflect the work completed since that handoff; none of these future areas should
be considered removed.

### 5. Use Decimal-safe currency values — **Partial**

Database storage and Prisma models now use `Decimal(12, 2)`/`NUMERIC(12, 2)` for
order and item currency values. Remaining work is to remove repeated
`Number(...)` conversions and floating-point arithmetic from payment and checkout
calculations:

- `Product.price`
- `Order.subtotal`
- `Order.deliveryFee`
- `Order.total`
- `OrderItem.unitPrice`
- payment and checkout total calculations

Use database Decimal/Numeric values and avoid floating-point arithmetic for payment
amounts.

### 6. Make order snapshots relational and immutable — **Complete**

The active payment transaction now writes relational `order_items` alongside
the order header. Existing orders were backfilled from `orders.items`. The legacy
JSON column remains temporarily for backward-compatible reads during the
application transition.

Relational order items contain purchase-time snapshots:

- product ID when available
- product name
- size
- color
- image URL
- quantity
- Decimal unit price

Order status/payment updates must not rewrite historical item details.

### 7. Complete auditable inventory and reservation behavior — **Partial**

Variant inventory tables, adjustment records, and checkout stock locking now exist,
and the migration verified 426 variants. Remaining work includes:

- verify every checkout path reserves/decrements the correct variant;
- enforce variant-level stock for all purchasable items;
- prevent negative stock under concurrent checkout;
- record adjustment reason, reference, and admin actor consistently;
- define cancellation/refund stock restoration behavior;
- add focused concurrency and failure-path tests.

Relevant files include [server/src/routes/products.js](../server/src/routes/products.js)
and [server/src/routes/payments.js](../server/src/routes/payments.js).

### 8. Resolve the catalogue model mismatch — **Not complete**

The frontend and active API still expose the legacy shape:

- `images.primary/gallery`
- `colors`
- `availableSizes`
- `inStock`
- `isArchived`
- string category IDs

The relational model uses `ProductImage`, `ProductVariant`, `Category`, and
`ProductStatus`. Update the normalization layer, admin forms, storefront reads,
cart data, and checkout payloads deliberately rather than hiding the mismatch.

### 9. Remove operational frontend localStorage fallbacks — **Partial**

Frontend localStorage must become optional, read-only UI cache rather than an
authoritative fallback:

- catalogue cache initialization in `ProductContext.jsx`;
- mock-product fallback in `client/src/services/api.js`;
- checkout order writes in `client/src/pages/Checkout.jsx`;
- admin order initialization/persistence in `client/src/pages/AdminDashboard.jsx`.

Order records are no longer read from or written to frontend `penny_orders`
localStorage in checkout, account history, notifications, or the admin
dashboard. Catalogue cache cleanup remains outstanding.

Network/database failures should surface explicitly instead of creating
success-shaped local orders or catalogue records.

### 10. Adopt one active persistence layer — **Not complete**

The live database now contains the relational catalogue structures, but active
routes still use handwritten `pg` queries and legacy JSON fields. Decide and
execute one coherent direction:

1. adopt Prisma consistently for catalogue reads/writes and transactions; or
2. explicitly retain `pg` while treating Prisma as a schema contract only.

Do not leave Prisma models, handwritten SQL, JSON storage, and in-memory state as
competing sources of truth.

### 11. Complete database migration/deployment hygiene — **Not complete**

The catalogue migration was applied directly with `psql`, but the live database
does not have `_prisma_migrations` bookkeeping. Safely reconcile this before
using `prisma migrate deploy` or future automated deployments. Validate the
Prisma schema and migration state against the live database.

### 12. Harden catalogue and administrative workflows — **Partial**

Admin authentication was added to product/category mutations, but the complete
workflow still needs verification:

1. admin login;
2. create/update category and subcategory;
3. create product;
4. create variants and images;
5. adjust stock;
6. activate/archive product;
7. display it in the storefront;
8. checkout a selected variant;
9. verify the order snapshot and inventory result.

Review related order, bank configuration, announcement, and other administrative
mutation routes for authorization and explicit error handling as part of this
workflow.

### 13. Add focused regression and end-to-end coverage — **Not complete**

Add tests for behavior introduced by the catalogue migration and remaining work:

- status filtering and transitions;
- relational image/variant reads and writes;
- inventory adjustments and non-negative stock;
- concurrent checkout locking;
- duplicate payment verification;
- immutable order snapshots;
- database failure behavior without JSON fallback;
- admin authorization on all mutation routes.

### 14. Repair or remove the broken seed script — **Complete**

The broken `npm run seed` script was removed because catalogue initialization is
now database-only and no `server/prisma/seed.js` implementation exists.

## Relevant frontend areas

- [client/src/context/ProductContext.jsx](../client/src/context/ProductContext.jsx)
- [client/src/services/api.js](../client/src/services/api.js)
- [client/src/context/CartContext.jsx](../client/src/context/CartContext.jsx)
- [client/src/pages/Checkout.jsx](../client/src/pages/Checkout.jsx)
- [client/src/pages/AdminDashboard.jsx](../client/src/pages/AdminDashboard.jsx)

## Original recommended implementation order, updated

1. Reconcile `_prisma_migrations` bookkeeping safely. **Complete.**
2. Make PostgreSQL the only backend catalogue source of truth.
3. Choose Prisma or `pg` as the single active catalogue data layer.
4. Make relational variants/images/status authoritative in the API and frontend.
5. Verify and harden inventory adjustment, reservation, cancellation, and
   concurrency behavior.
6. Convert active currency calculations and payment totals to Decimal-safe values.
7. Make order items immutable relational snapshots. **Complete.**
8. Remove operational frontend localStorage catalogue/order fallbacks.
9. Complete admin-to-storefront-to-checkout end-to-end verification.
10. Add focused regression and integration coverage.
11. Repair or remove the broken seed script. **Complete.**

## Recommended next session

1. Reconcile `_prisma_migrations` safely. **Complete.**
2. Add focused tests or a controlled smoke test for the migrated catalogue. **Category GET smoke test complete.**
3. Remove the remaining category backend JSON and in-memory operational fallbacks. **Complete.**
4. Verify admin login → category save → product/variant save → storefront read. **Complete.**
5. Begin the order schema work; relational order snapshot migration, write path, relational reads, and legacy JSON cleanup are **Complete**.
6. Repair or remove the missing `prisma/seed.js` script. **Complete.**

## Validation notes

The following live checks were completed with `psql`:

- PostgreSQL connection succeeded.
- Migration SQL completed with `ON_ERROR_STOP=1` in a single transaction.
- Product/category/order counts were preserved.
- Backfilled variant/image counts were verified.
- Status, stock, image URL, and foreign-key checks passed.
- Migration `0002_relational_order_snapshots` was applied successfully with
  `prisma migrate deploy`.
- `prisma migrate status` confirmed that both migrations are applied and the
  database schema is up to date.
- Live verification found 8 orders and 13 backfilled `order_items`.
- Live `orders` totals were returned as `NUMERIC(12, 2)` values, including
  `92000.00`, `5000.00`, and `97000.00` for the existing PNY-892140 order.

Prisma 7 CLI checks completed in Linux:

- `npm run prisma:validate` passes with Prisma `7.10.1`.
- `npx prisma generate` generates `@prisma/client` successfully.
- No automated test suite or test script is currently configured in
  `server/package.json`.
- PostgreSQL order reads now join immutable `order_items` snapshots, and new
  PostgreSQL orders no longer use the legacy `orders.items` JSON payload.

The authenticated catalogue smoke test also passed against the configured
database: admin login, category creation, product creation with a relational
variant, public product/category reads, and cleanup of the temporary records.
