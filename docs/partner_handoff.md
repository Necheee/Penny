# PENNY Partner Handoff

Updated: 2026-11-19

## Current repository state

- Repository: `Necheee/Penny`
- Branch: `main`
- `HEAD`: `94254c9`
- Branch is twelve commits ahead of `origin/main`.
- Source worktree was clean before this handoff update; this document is tracked.
- The database is a remote PostgreSQL/Neon instance configured through `server/.env`.
- Do not expose or commit `server/.env`.
- Linux Node.js `v26.13.1` is available at `/usr/local/bin/node`.

Recent relevant commits:

1. `94254c9` - persist selected variant references and restore inventory on cancellation.
2. `c827220` - update partner handoff documentation and migration status.
3. `1158952` - add Prisma 7 configuration and update package dependencies.
4. `b05f252` - add inventory adjustments and checkout stock locking.
5. `5b9c691` - add product variants and product images.

## Database migration status

The migration in [server/prisma/migrations/0001_catalogue_foundation/migration.sql](../server/prisma/migrations/0001_catalogue_foundation/migration.sql)
was applied successfully on 2026-11-18 after a database backup was confirmed.

The migration in [server/prisma/migrations/0002_relational_order_snapshots/migration.sql](../server/prisma/migrations/0002_relational_order_snapshots/migration.sql)
was applied successfully with `prisma migrate deploy` on 2026-11-19.
The migration in [server/prisma/migrations/0003_order_item_variant_references/migration.sql](../server/prisma/migrations/0003_order_item_variant_references/migration.sql)
was applied successfully with `prisma migrate deploy` on 2026-11-19.
`prisma migrate status` reports that the database is up to date with all three
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

The live database has all three migrations recorded in `_prisma_migrations`.
The initially direct-applied catalogue migration was reconciled with Prisma 7's
`prisma migrate resolve --applied` command after verifying it had already been
applied. Future deployments may use Prisma CLI, but should still verify
migration status before applying changes.

Prisma tooling is now runnable from Linux. Node.js `v26.13.1` is installed and
`npm run prisma:validate` succeeds. Prisma Client generation also succeeds.

## Current application architecture

The database schema contains the relational catalogue structures. The
application uses `pg` as its active database-backed runtime persistence layer;
it has not been converted to Prisma.

### Architecture guardrails

- `pg` is the single runtime persistence layer.
- Prisma is used strictly for the `server/prisma/schema.prisma` contract and
  migrations, with migrations using `DIRECT_URL`.
- Never instantiate `PrismaClient` in routes or other runtime application code.
- All `pg` SQL must use PostgreSQL `snake_case` table and column names matching
  the Prisma `@map` directives, including `unit_price`, `product_id`, and
  `image_url`.

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

### 3. Decide whether Prisma becomes the active data layer — **Complete**

The schema and live database are currently relational, but the application uses
`pg`. The project explicitly retains `pg` as the active application data layer.
Prisma is retained as a schema contract and migration/deployment tool only:

- catalogue routes and transactional checkout logic use the shared `pg` pool;
- `server/prisma/schema.prisma` defines and validates the relational contract;
- Prisma CLI is used for client generation and migration status/deployment;
- application routes do not instantiate `PrismaClient`.

This avoids maintaining two competing runtime persistence implementations. Any
future move to Prisma must be an intentional, repository-wide migration rather
than a route-by-route hybrid.

The remaining implementation work is to finish the frontend/API model
transition and remove legacy compatibility paths while preserving the existing
response shape where required.

### 4. Complete catalogue model usage — **Complete**

Product API responses now derive images, colors, sizes, and stock from the
relational `product_images` and `product_variants` tables. The frontend
normalization layer follows those relational values, including empty relational
arrays, instead of inventing defaults. Legacy JSON columns remain as
compatibility mirrors for the existing response shape and older records, but
are no longer authoritative for relational catalogue data.

This marks relational data authority as complete; the remaining legacy response
shape and frontend migration work is tracked separately under item 8.

## Full remaining implementation roadmap

The following items from the original handoff remain in scope. The statuses below
reflect the work completed since that handoff; none of these future areas should
be considered removed.

### 5. Use Decimal-safe currency values — **Complete**

Database storage and Prisma models now use `Decimal(12, 2)`/`NUMERIC(12, 2)` for
order and item currency values. Checkout subtotals, totals, Paystack amounts,
and PostgreSQL order writes use integer minor-unit arithmetic and fixed
two-decimal values. Active product/order models and display paths now preserve
fixed two-decimal strings and use BigInt minor-unit helpers for arithmetic.

- `Product.price`
- `Order.subtotal`
- `Order.deliveryFee`
- `Order.total`
- `OrderItem.unitPrice`
- payment and checkout total calculations

The remaining numeric conversions are limited to external API boundaries and
legacy seed/input compatibility, not currency arithmetic or display formatting.

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
and the migration verified 426 variants. Checkout now persists the selected
variant reference, and cancellation restores that exact variant in a transaction.
The inventory adjustment and order status/payment mutation routes now require
authenticated admin access, order statuses are allow-listed, and cancellation
restores stock only through the immutable `order_items.variant_id` snapshot while
recording the admin actor.

Remaining work includes:

- validate refund-specific behavior with the payment provider; this codebase does
  not currently expose a provider refund endpoint.

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
- mock-product fallback in `client/src/services/api.js` **removed**;
- checkout order writes in `client/src/pages/Checkout.jsx`;
- admin order initialization/persistence in `client/src/pages/AdminDashboard.jsx`.

Order records are no longer read from or written to frontend `penny_orders`
localStorage in checkout, account history, notifications, or the admin
dashboard. Catalogue cache cleanup remains outstanding.

Catalogue API requests now fail explicitly instead of returning mock products or
categories. The existing catalogue cache may still render while the request is
in flight, but it is replaced by the live response (including an empty response)
and is never used as a success-shaped API fallback.

Network/database failures should surface explicitly instead of creating
success-shaped local orders or catalogue records.

### 10. Adopt one active persistence layer — **Complete**

The project explicitly retains handwritten `pg` queries and transactions as the
active persistence layer. Prisma models remain the schema contract and
migration/deployment tooling; they are not a second runtime persistence path.
The remaining catalogue work is to remove legacy JSON fields from the active
normalization and write paths, not to introduce Prisma into those routes.

### 11. Complete database migration/deployment hygiene — **Complete**

The catalogue migration was initially applied directly with `psql`; its
`_prisma_migrations` bookkeeping was subsequently reconciled with
`prisma migrate resolve --applied`. The relational order snapshot migration was
then applied with `prisma migrate deploy`, and `prisma migrate status` confirms
that all three migrations are applied and the database schema is up to date.

### 12. Harden catalogue and administrative workflows — **Partial**

Admin authentication was added to product/category mutations, but the complete
workflow has now been verified end to end for the catalogue and checkout path:

1. admin login;
2. create/update category and subcategory;
3. create product;
4. create variants and images;
5. adjust stock;
6. activate/archive product;
7. display it in the storefront;
8. checkout a selected variant;
9. verify the order snapshot and inventory result.

The temporary end-to-end records were cleaned up after verification. The item
remains partial because related order, bank configuration, announcement, refund,
and other administrative mutation routes still need authorization and explicit
error-handling review.

Review related order, bank configuration, announcement, and other administrative
mutation routes for authorization and explicit error handling as part of this
workflow.

### 13. Add focused regression and end-to-end coverage — **Partial**

A focused Node regression suite now covers currency arithmetic, relational
catalogue authority, checkout validation, order snapshots, transaction
safeguards, and admin authorization. Remaining coverage includes:

- status filtering and transitions;
- relational image/variant reads and writes;
- inventory adjustments and non-negative stock;
- concurrent checkout locking;
- duplicate payment verification;
- immutable order snapshots;
- database failure behavior without JSON fallback;
- provider-side refund verification.

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
2. Make PostgreSQL the only backend catalogue source of truth. **Complete.**
3. Choose Prisma or `pg` as the single active catalogue data layer. **Complete:
   retain `pg`; Prisma is the schema contract and migration tool.**
4. Make relational variants/images/status authoritative in the API and frontend. **Complete.**
5. Verify and harden inventory adjustment, reservation, refund-specific
   cancellation, and concurrency behavior. **Partial.**
6. Convert active currency calculations and payment totals to Decimal-safe
   values. **Partial: calculations are complete; display/model normalization
   remains.**
7. Make order items immutable relational snapshots. **Complete.**
8. Remove operational frontend localStorage catalogue/order fallbacks. **Partial.**
9. Complete admin-to-storefront-to-checkout end-to-end verification. **Complete.**
10. Add focused regression and integration coverage. **Not complete.**
11. Repair or remove the broken seed script. **Complete.**

## Recommended next session

1. Add focused regression, concurrency, and failure-path coverage for inventory,
   payment verification, and immutable order snapshots.
2. Track provider-side refund integration and verification.
3. Resolve the remaining frontend/API catalogue model mismatch.
4. Remove the remaining operational frontend catalogue cache and mock fallbacks.
5. Review administrative mutation routes for authorization and explicit error
   handling, including refund-specific inventory behavior.

## Practical completion scope

The implementation work documented above is a hardening backlog rather than a
set of launch-blocking features. The core catalogue, migration, persistence,
payment, order snapshot, and inventory foundations are already in place.

Use the following three milestones to keep remaining work bounded:

1. **Ship confidence**
   - Complete and verify the admin-to-storefront-to-checkout workflow.
   - Verify category, product, variant, image, stock, activation/archive,
     order snapshot, and inventory behavior end to end.

2. **Prevent regressions**
   - Add focused tests for checkout locking/concurrency, duplicate payment
     verification, immutable snapshots, database failures, inventory
     adjustments, status transitions, and admin authorization.

3. **Follow-up cleanup**
   - Track provider-side refund integration and verification.
   - Finish the relational frontend/API model migration.
   - Remove remaining catalogue cache and local fallback authority.
   - Review refund and administrative mutation behavior for authorization and
     explicit errors.

## Validation notes

The following live checks were completed with `psql`:

- PostgreSQL connection succeeded.
- Migration SQL completed with `ON_ERROR_STOP=1` in a single transaction.
- Product/category/order counts were preserved.
- Backfilled variant/image counts were verified.
- Status, stock, image URL, and foreign-key checks passed.
- Migration `0002_relational_order_snapshots` was applied successfully with
  `prisma migrate deploy`.
- Migration `0003_order_item_variant_references` was applied successfully with
  `prisma migrate deploy`; `order_items.variant_id` now records the selected
  variant for new orders.
- `prisma migrate status` confirmed that all three migrations are applied and the
  database schema is up to date.
- Live verification found 8 orders and 13 backfilled `order_items`.
- Live `orders` totals were returned as `NUMERIC(12, 2)` values, including
  `92000.00`, `5000.00`, and `97000.00` for the existing PNY-892140 order.

Prisma 7 CLI checks completed in Linux:

- `npm run prisma:validate` passes with Prisma `7.10.1`.
- `npx prisma generate` generates `@prisma/client` successfully.
- A focused Node `node:test` regression suite is configured in
  `server/package.json` and currently covers currency arithmetic, relational
  catalogue authority, checkout item validation, order snapshot mapping,
  checkout concurrency/rollback safeguards, and admin authorization.
- PostgreSQL order reads now join immutable `order_items` snapshots, and new
  PostgreSQL orders no longer use the legacy `orders.items` JSON payload.

The authenticated catalogue smoke test also passed against the configured
database: admin login, category creation, product creation with a relational
variant, public product/category reads, and cleanup of the temporary records.
The full temporary admin-to-storefront-to-checkout workflow also passed against
the configured database, including relational image persistence, inventory
adjustment, selected-variant checkout, immutable order snapshot creation,
cancellation, inventory restoration, and cleanup.
