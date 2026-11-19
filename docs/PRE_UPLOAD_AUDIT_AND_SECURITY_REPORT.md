# PENNY Pre-Upload Audit & Security Report

**Date:** 2026-11-19  
**Scope:** Full-repository readiness review prior to mass uploading product images and descriptions  
**Verdict:** **NO-GO for mass upload** — critical security flaws, a storefront cart crash, and multiple product/image pipeline bugs should be resolved before uploading live catalogue data.

---

## Executive Summary

While the core PostgreSQL relational foundation (`products`, `product_variants`, `product_images`, `orders`, `order_items`, `inventory_adjustments`), Cloudflare R2 integration, and BigInt money utilities are in place, a full review of the repository uncovered **15 distinct concerns** across security, checkout integrity, the image/product upload pipeline, storefront rendering, and operational scaling.

Specifically for the planned **mass upload of product images and descriptions**:
- **Shoppers cannot see uploaded descriptions:** `description`, `material`, `fit`, `care`, and `shipping` are never rendered in the storefront product modal (and there is no dedicated product detail page).
- **Uploading can silently overwrite existing products:** Product IDs use a 4-digit millisecond timestamp suffix (`p-XXXX`) paired with `ON CONFLICT (id) DO UPDATE`.
- **Failed or slow uploads bloat the database:** Raw multi-MB base64 `data:` URLs can be saved straight into PostgreSQL and `localStorage` if an R2 upload fails or Save is clicked while uploading.
- **Editing any product damages relational history:** `syncProductRelations` executes `DELETE FROM product_variants`, cascading deletes into `inventory_adjustments` and nulling out `order_items.variant_id`.
- **Gallery uploads are missing and polluted:** New products hardcode `/images/products/linen-set-2.jpg` into their gallery, and the admin form only supports uploading a single primary image.
- **Cloning products leaves broken records:** Duplicating a product reuses existing `variant.id` and `sku` values, crashing partway through creation outside a unified transaction.

Alongside these upload blockers, there are **4 Critical issues** (an unsigned JWT admin auth bypass, unauthenticated PII/order/account-takeover endpoints, a guaranteed cart `BigInt` crash, and client-controlled checkout pricing) that pose immediate risk to the storefront.

---

## Summary Table (Ranked by Severity)

| # | Severity | Category | Concern | Directly Blocks Mass Upload? |
| :-: | :--- | :--- | :--- | :-: |
| 1 | **Critical** | Security / Auth | Unsigned JWT fallback allows complete admin auth bypass | Yes (security) |
| 2 | **Critical** | Security / PII | Unauthenticated order dumps, order deletion, inquiry replies, & customer account takeover | Yes (security) |
| 3 | **Critical** | Storefront Bug | Cart subtotal calculation crashes the app with `BigInt * Number` TypeError | No (blocks checkout) |
| 4 | **Critical** | Payments | Checkout trusts client-submitted prices & never verifies Paystack paid amount | No (blocks launch) |
| 5 | **High** | Storefront UX | Product descriptions (and material/fit/care/shipping) are never rendered to customers | **Yes** |
| 6 | **High** | Data Integrity | 4-digit timestamp product IDs + `ON CONFLICT DO UPDATE` silently overwrite products | **Yes** |
| 7 | **High** | Media / DB | Failed or in-progress R2 uploads silently save multi-MB base64 data URLs to Postgres | **Yes** |
| 8 | **High** | Data Integrity | Editing any product deletes `product_variants`, wiping audit history & breaking cancellations | **Yes** |
| 9 | **High** | Data Integrity | Duplicating a product fails with variant PK/SKU collision and orphans a broken product | **Yes** |
| 10 | **High** | Media / Admin UX | Broken R2 fallback URL (`403`), hardcoded fake gallery photo, and no gallery/bulk upload | **Yes** |
| 11 | **Medium** | Scaling / Privacy | Unpaginated full-catalogue fetch, `localStorage` cache bloat, and public draft/archive reads | **Yes** |
| 12 | **Medium** | Infrastructure | Memory-buffered uploads, Netlify proxy timeouts, generic 500 errors, & orphaned R2 objects | **Yes** |
| 13 | **Medium** | Inventory / UX | Broken stock toggle, missing inventory UI, unselectable waist sizes (`28`–`40`), & custom color 409s | Partial |
| 14 | **Medium** | Database | Prisma schema drift vs. live `pg` tables & runtime DDL/DELETE inside `GET` endpoints | No |
| 15 | **Low** | Polish / Hygiene | Broken auth links, missing color swatch hexes, duplicate slugs, & swallowed errors | No |

---

## Detailed Findings

### Critical

#### 1. Complete Admin Authentication Bypass via Unsigned JWT Fallback
- **Files:**
  - [server/src/utils/token.js](../server/src/utils/token.js) (lines 3, 29–47)
  - [server/src/middleware/auth.js](../server/src/middleware/auth.js) (lines 6–52)
- **What's happening:**
  `verifyToken` wraps `jwt.verify(token, JWT_SECRET)` in nested `try/catch` blocks. If signature verification or expiration fails, it tries a hardcoded default secret (`'penny_default_dev_secret_key_2026'`), and if that also fails, it calls `jwt.decode(token)` and returns the unverified payload as long as `decoded.role` is truthy.
- **Impact:**
  Any anonymous user on the internet can forge an unsigned token (e.g., base64-encoded `{"alg":"none"}.{"role":"admin"}.`) and pass `requireAuth` and `requireAdmin` on every protected endpoint — creating/deleting products, uploading arbitrary files to Cloudflare R2, editing bank transfer account numbers, adjusting inventory, and confirming orders.
- **Recommended fix:**
  Remove both the hardcoded dev secret fallback and the `jwt.decode` fallback immediately. Fail fast on server startup if `JWT_SECRET` is not set in production, and return `null` whenever `jwt.verify(token, JWT_SECRET)` throws.

---

#### 2. Unauthenticated PII Exposure, Order Deletion, Inquiry Spoofing, & Customer Account Takeover
- **Files:**
  - [server/src/routes/payments.js](../server/src/routes/payments.js) (lines 806–945)
  - [server/src/routes/auth.js](../server/src/routes/auth.js) (lines 122–383, 566–576, 623–800)
  - [server/src/routes/contact.js](../server/src/routes/contact.js) (lines 78–270, 551–576)
  - [client/src/pages/Account.jsx](../client/src/pages/Account.jsx) (line 259)
  - [client/src/context/NotificationContext.jsx](../client/src/context/NotificationContext.jsx) (line 61)
  - [server/src/data/storage/users.json](../server/src/data/storage/users.json) (and `orders.json`, `inquiries.json`, `bankDetails.json`)
- **What's happening:**
  - **Orders:** `GET /api/payments/orders` returns all orders (including customer names, emails, phones, and street addresses) with **no auth**. `DELETE /api/payments/orders/:id` deletes any order from PostgreSQL with **no auth**. `GET /api/payments/my-orders` has no auth and accepts `?customer=a`, matching via `ILIKE '%a%'`. Customer-facing `Account.jsx` and `NotificationContext.jsx` even fall back to calling `/api/payments/orders` directly in customer browsers.
  - **Customer accounts:** `GET /api/auth/customer-profile`, `POST /api/auth/customer-sync`, `POST /api/auth/customer-change-password`, `GET/POST /api/auth/cart`, and `GET/POST /api/auth/notifications-state` have **no authentication**. `POST /api/auth/customer-sync` accepts arbitrary `email`, `password`, and `previousEmail` in the request body — letting an attacker overwrite any customer's `password_hash` or migrate a victim's orders and inquiries to an attacker-controlled email. Additionally, `POST /api/auth/customer-login` (lines 566–576) allows logging in with *any* password if `password_hash` is empty and saves that password as the account's new password.
  - **Contact / Support:** `GET /api/contact/messages`, `PATCH /api/contact/messages/:id/read`, `POST /api/contact/messages/:id/reply`, `DELETE /api/contact/messages/:id`, and `GET /api/contact/my-inquiries` have **no authentication**. Anyone can read all customer inquiries, delete them, or send official-looking PENNY emails with unescaped HTML to any customer via `/reply`.
  - **Tracked PII in Git:** `server/src/data/storage/*.json` files containing real/test emails, phone numbers, and addresses are committed to version control.
- **Impact:**
  Full breach of customer PII, unauthorized order deletion, phishing/spam sent through PENNY's SMTP/Gmail credentials, and zero-click takeover of any customer account.
- **Recommended fix:**
  - Require `requireAuth` + `requireAdmin` on `GET /api/payments/orders`, `DELETE /api/payments/orders/:id`, and all admin `/api/contact/messages*` routes.
  - Require `requireAuth` on all customer profile, cart, notifications, password change, `my-orders`, and `my-inquiries` routes, deriving user identity strictly from `req.user.id` / `req.user.email` rather than query params or request bodies.
  - Remove `password` and `previousEmail` takeover capability from `customer-sync` (or remove `customer-sync` in favor of authenticated `PATCH /api/auth/me`).
  - Escape HTML in all email templates (`contact.js`, `receiptEmail.js`) and untrack `server/src/data/storage/*.json` from git.

---

#### 3. Adding Any Item to the Cart Crashes the Storefront (`BigInt` TypeError)
- **Files:**
  - [client/src/context/CartContext.jsx](../client/src/context/CartContext.jsx) (lines 160–166)
- **What's happening:**
  ```js
  const cartSubtotal = useMemo(() => {
    const subtotalMinorUnits = cartItems.reduce(
      (total, item) => total + (toMinorUnits(item.price) * item.quantity),
      0n,
    );
    return fromMinorUnits(subtotalMinorUnits);
  }, [cartItems]);
  ```
  `toMinorUnits(item.price)` returns a `BigInt`, while `item.quantity` is a JavaScript `Number`. Mixing `BigInt` and `Number` with `*` throws `TypeError: Cannot mix BigInt and other types, use explicit conversions`.
- **Impact:**
  Because `CartProvider` wraps the entire app in `App.jsx`, the moment any user adds an item to their cart (or already has an item in `localStorage`), the entire React app crashes to a blank screen.
- **Recommended fix:**
  Wrap quantity in `BigInt`: `toMinorUnits(item.price) * BigInt(item.quantity || 1)` (matching [client/src/utils/money.js](../client/src/utils/money.js) line 31).

---

#### 4. Checkout Trusts Client-Submitted Prices & Unverified Payment Amounts
- **Files:**
  - [server/src/routes/payments.js](../server/src/routes/payments.js) (lines 341–417, 451–532)
- **What's happening:**
  - `POST /api/payments/verify` builds `subtotal`, `deliveryFee`, `total`, and `order_items.unit_price` directly from `req.body.orderData` (`cartSubtotal`, `shippingCost`, `item.price`) without ever querying `products.price` from PostgreSQL or recomputing shipping rules server-side.
  - When Paystack verification runs, it checks `verifyJson.status && verifyJson.data?.status === 'success'`, but never checks that `verifyJson.data.amount` equals the expected order total in kobo or that `verifyJson.data.currency === 'NGN'`.
  - When `PAYSTACK_SECRET_KEY` is missing or contains `mock`/`your_`, `isVerified` defaults to `true` unconditionally, marking card orders as paid without payment.
- **Impact:**
  A customer can modify browser request payloads to purchase ₦50,000+ garments for ₦1 (or ₦0), or reuse a low-value Paystack payment reference for a high-value order.
- **Recommended fix:**
  Inside the checkout PostgreSQL transaction, look up authoritative `products.price` (and verify `products.status = 'ACTIVE'`), compute item totals, subtotal, delivery fee, and grand total strictly on the server, and verify `verifyJson.data.amount === Number(expectedTotalMinorUnits)` and `verifyJson.data.currency === 'NGN'` before marking an order paid. Disable card auto-verification in production (`NODE_ENV === 'production'`).

---

### High (Direct Blockers for Mass Uploading Product Images & Descriptions)

#### 5. Product Descriptions (and Material/Fit/Care/Shipping) Are Never Rendered to Customers
- **Files:**
  - [client/src/components/shop/ProductModal.jsx](../client/src/components/shop/ProductModal.jsx) (lines 340–788)
  - [client/src/App.jsx](../client/src/App.jsx) (lines 41–79)
- **What's happening:**
  The storefront has no `/product/:slug` detail page — clicking a product card opens `ProductModal.jsx`. However, `ProductModal.jsx` only renders subcategory, title, price, color swatches, custom color request, size grid, quantity, Add to Bag / Buy Now, and "You may also like". Neither `product.description`, `product.material`, `product.fit`, `product.care`, nor `product.shipping` is rendered anywhere in the storefront UI. They are only read by search/filter functions in `Shop.jsx` and `SearchModal.jsx`.
- **Impact:**
  All product descriptions and garment specs you are about to mass upload will be invisible to shoppers.
- **Recommended fix:**
  Render `product.description` prominently in `ProductModal.jsx`, along with collapsible/structured details for `material`, `fit`, `care`, and `shipping` (and optionally add shareable `/product/:slug` routes for SEO/direct links).

---

#### 6. 4-Digit Timestamp Product IDs + `ON CONFLICT (id) DO UPDATE` Silently Overwrite Products
- **Files:**
  - [client/src/pages/AdminDashboard.jsx](../client/src/pages/AdminDashboard.jsx) (line 409)
  - [server/src/routes/products.js](../server/src/routes/products.js) (lines 354, 389–418)
- **What's happening:**
  Both the frontend and backend generate new product IDs using `` `p-${Date.now().toString().slice(-4)}` ``. This yields only 10,000 possible IDs (`p-0000` to `p-9999`), wrapping every 10 seconds. Worse, `POST /api/products` executes `INSERT INTO products (...) ON CONFLICT (id) DO UPDATE SET ...`.
- **Impact:**
  With 38 existing products plus a mass upload batch, ID collisions become very probable (especially via birthday paradox across 100+ items or batch scripts running quickly). Instead of returning a conflict error, `POST /api/products` will **silently overwrite an existing product** and replace all of its variants and images.
- **Recommended fix:**
  Generate product IDs on the server with `crypto.randomUUID()` (matching `schema.prisma`), remove `ON CONFLICT (id) DO UPDATE` from `POST /api/products`, and return `409 Conflict` if an explicit duplicate `id` or `slug` is submitted.

---

#### 7. Failed or In-Progress R2 Uploads Silently Save Multi-MB Base64 Data URLs into PostgreSQL & `localStorage`
- **Files:**
  - [client/src/components/admin/ProductFormModal.jsx](../client/src/components/admin/ProductFormModal.jsx) (lines 141–184, 854–859)
  - [server/src/routes/products.js](../server/src/routes/products.js) (lines 40–55, 370–373)
- **What's happening:**
  When you pick or drop an image in `ProductFormModal`, `FileReader.readAsDataURL(file)` immediately sets `formData.imageUrl` to a raw base64 `data:image/...;base64,...` string for preview.
  1. If the R2 upload fails (missing env vars, Render cold start, network blip, >15 MB file), `formData.imageUrl` is **never cleared** — it remains the huge base64 string.
  2. The **Save Product** button is **not disabled** while `isUploadingImage` is `true`, so clicking Save during an upload submits the raw base64 string.
  3. The backend accepts any non-empty string as `image.url` without rejecting `data:` URIs.
- **Impact:**
  Uncompressed multi-megabyte base64 blobs get persisted in PostgreSQL (`products.images` and `product_images.url`), returned on every `GET /api/products` call to every visitor, and overflow the browser's ~5 MB `localStorage` quota for `penny_live_catalogue_cache`.
- **Recommended fix:**
  Keep local preview state separate from the persisted `imageUrl` (e.g., `previewUrl` via `URL.createObjectURL` with cleanup), disable **Save Product** while `isUploadingImage` is `true`, clear pending preview or show a retry error on upload failure, and reject `data:` URIs on the server in `POST/PUT /api/products`.

---

#### 8. Editing Any Product Deletes All `product_variants`, Destroying Audit History & Breaking Order Cancellations
- **Files:**
  - [server/src/routes/products.js](../server/src/routes/products.js) (lines 16–38, 588–593)
  - [server/prisma/migrations/0001_catalogue_foundation/migration.sql](../server/prisma/migrations/0001_catalogue_foundation/migration.sql) (lines 155–158)
  - [server/prisma/migrations/0003_order_item_variant_references/migration.sql](../server/prisma/migrations/0003_order_item_variant_references/migration.sql) (lines 13–16)
  - [server/src/routes/payments.js](../server/src/routes/payments.js) (lines 648–655)
- **What's happening:**
  `ProductFormModal` always sends the `variants` array when saving an edited product. On the server, `syncProductRelations` runs:
  ```sql
  DELETE FROM product_variants WHERE product_id = $1
  ```
  and then re-inserts all variants. Even if the same UUIDs are re-inserted, the `DELETE` triggers PostgreSQL foreign-key actions immediately:
  - `inventory_adjustments.variant_id` has `ON DELETE CASCADE` -> **all inventory adjustment history for that product is permanently deleted**.
  - `order_items.variant_id` has `ON DELETE SET NULL` -> **all past and active orders referencing that product lose their `variant_id`**.
- **Impact:**
  Simply fixing a typo in a product description or swapping a product photo after an order has been placed will destroy the product's inventory audit log and make any subsequent order cancellation fail with `409 Conflict: Cannot restore inventory for order item without its original variant`.
- **Recommended fix:**
  Replace `DELETE + INSERT` in `syncProductRelations` with a diff/upsert strategy: `UPDATE` existing variants in place (by `id` or `(product_id, size, color_name)`), `INSERT` only new variants, and only `DELETE` (or soft-disable/zero-out) variants that were explicitly removed and are not referenced by open orders.

---

#### 9. Duplicating a Product Fails with Primary Key / SKU Collision & Orphans Broken Products
- **Files:**
  - [client/src/pages/AdminDashboard.jsx](../client/src/pages/AdminDashboard.jsx) (lines 364–373)
  - [client/src/components/admin/ProductFormModal.jsx](../client/src/components/admin/ProductFormModal.jsx) (lines 205–219)
  - [server/src/routes/products.js](../server/src/routes/products.js) (lines 389–445)
- **What's happening:**
  - `handleDuplicateProduct` clones an existing product and sets `id: null`, but leaves `product.variants` intact — including the original product's `variant.id` (UUID primary key) and `variant.sku` (`UNIQUE`).
  - `ProductFormModal` preserves `existing.id` and `existing.sku` when building the payload.
  - On `POST /api/products`, the server inserts the row into `products` **outside** the `syncProductRelations` transaction. When `syncProductRelations` attempts to insert the cloned variants, PostgreSQL throws a primary key / unique constraint violation.
- **Impact:**
  Using the "Duplicate" button (a common workflow during mass uploads) fails with HTTP 503 and leaves a half-created product with 0 variants and 0 images orphaned in PostgreSQL.
- **Recommended fix:**
  1. Strip `id` and `sku` from cloned variants in `handleDuplicateProduct` (and ignore client-supplied `variant.id` on `POST /api/products`).
  2. Wrap the `INSERT/UPDATE products` query and `syncProductRelations` inside **one single PostgreSQL transaction** so failures roll back atomically.

---

#### 10. Broken R2 Fallback URL (`403`), Hardcoded Fake Gallery Photo, & No Gallery/Bulk Upload UI
- **Files:**
  - [server/src/routes/media.js](../server/src/routes/media.js) (lines 104–110)
  - [client/src/pages/AdminDashboard.jsx](../client/src/pages/AdminDashboard.jsx) (lines 428–431)
  - [client/src/components/admin/ProductFormModal.jsx](../client/src/components/admin/ProductFormModal.jsx) (lines 614–722)
- **What's happening:**
  - **R2 fallback URL:** If `R2_PUBLIC_URL` is unset, `media.js` constructs `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${objectKey}`. That hostname is Cloudflare's private S3 API endpoint, which requires signed AWS auth headers and returns `401`/`403` to public browsers.
  - **Hardcoded fake gallery photo:** Creating a new product in `AdminDashboard.jsx` sets:
    ```js
    images: {
      primary: formData.imageUrl || '/images/products/linen-set-1.jpg',
      gallery: ['/images/products/linen-set-2.jpg']
    }
    ```
    Every single newly created product gets a linen-set photo stored as a real `product_images` row in PostgreSQL.
  - **Single-image only:** `ProductFormModal.jsx` only has a dropzone for one primary image — there is no UI to upload, reorder, or delete gallery images, and no CSV/JSON/multi-file bulk import workflow.
- **Impact:**
  If `R2_PUBLIC_URL` isn't configured on Render, every uploaded image will be broken on the storefront. Even if it is configured, every product you upload through the admin UI will display a mismatched linen-set image as its second thumbnail, and you cannot upload secondary/detail angles.
- **Recommended fix:**
  - Fail fast in `media.js` if `R2_PUBLIC_URL` is not configured (instead of falling back to the private S3 endpoint).
  - Change default `gallery` on new products to `[]`.
  - Add multi-image gallery upload/remove support to `ProductFormModal.jsx` (and consider a validated bulk CSV/JSON + folder upload script for mass onboarding).

---

### Medium (Scaling, Inventory, & Operational Integrity)

#### 11. Unpaginated Full-Catalogue Fetching, `localStorage` Cache Limits, & Public Draft/Archive Exposure
- **Files:**
  - [server/src/routes/products.js](../server/src/routes/products.js) (lines 192–289)
  - [client/src/context/ProductContext.jsx](../client/src/context/ProductContext.jsx) (lines 92–123, 194–229)
- **What's happening:**
  - `ProductContext` calls `GET /api/products?includeArchived=true` on every visitor's initial page load — pulling all products (including `DRAFT` and `ARCHIVED` rows), all variants, and all images in one unpaginated payload, then serializing the entire array into `localStorage`.
  - `GET /api/products?includeArchived=true`, `GET /api/products?archivedOnly=true`, and `GET /api/products/:id` have no admin check, exposing unpublished `DRAFT` and `ARCHIVED` items to the public.
- **Impact:**
  As the catalogue grows via mass upload (e.g., 100–300 products with 10–20 variants each = thousands of variant objects), initial page loads slow down, bandwidth increases, `localStorage` caching hits browser quotas, and draft products leak before launch.
- **Recommended fix:**
  - Require admin authentication before returning `DRAFT` or `ARCHIVED` products; have public storefront pages request active products only.
  - Add pagination/limit support (and/or omit full variant arrays from list views, fetching variants on modal open).
  - Stop caching the entire catalogue with variants in `localStorage`.

---

#### 12. Upload Reliability, Memory Pressure, Proxy Timeouts, & Orphaned R2 Objects
- **Files:**
  - [server/src/routes/media.js](../server/src/routes/media.js) (lines 10–23, 62–131)
  - [server/src/index.js](../server/src/index.js) (lines 69–76)
  - [server/src/routes/products.js](../server/src/routes/products.js) (lines 776–812)
  - [netlify.toml](../netlify.toml) (lines 11–16)
- **What's happening:**
  - `multer.memoryStorage()` holds up to 15 MB per uploaded image in Node RAM alongside `sharp` decompression buffers. Concurrent uploads during a mass session can trigger OOM restarts on a small Render dyno.
  - Uploads proxy through Netlify (`/api/*` -> `https://penny-kbrh.onrender.com/api/*`), which enforces proxy timeout (~26–30s) and body size constraints — risky during Render cold starts or large image uploads.
  - Multer validation errors (`LIMIT_FILE_SIZE`, invalid MIME type) are not caught in `media.js` and bubble to Express's global error handler, returning a generic `500` instead of `400`/`413`.
  - Replacing or clearing an image never deletes the previous R2 object (orphaning storage). When deleting a product, `DELETE /api/products/:id` inspects only the legacy `products.images` JSON (not `product_images`) and only matches URLs containing `r2.dev` or `r2.cloudflarestorage.com` (skipping custom domains).
- **Recommended fix:**
  - Wrap `upload.single('image')` with explicit Multer error handling returning `400`/`413`.
  - Query `product_images` before deleting a product and delete objects matching `R2_PUBLIC_URL` (or store the R2 object `key` in `product_images.public_id` and delete by key).
  - Consider presigned R2 upload URLs or direct-to-backend upload / client-side resizing before upload for large batches.

---

#### 13. Broken Stock Toggle, Missing Variant Inventory UI, Unselectable Pants Sizes, & Broken Custom-Color Checkout
- **Files:**
  - [client/src/context/ProductContext.jsx](../client/src/context/ProductContext.jsx) (lines 390–406)
  - [server/src/routes/products.js](../server/src/routes/products.js) (lines 157–159, 623–687)
  - [client/src/components/admin/ProductFormModal.jsx](../client/src/components/admin/ProductFormModal.jsx) (lines 215, 505)
  - [client/src/components/shop/ProductModal.jsx](../client/src/components/shop/ProductModal.jsx) (lines 93–129, 227–229, 684–688)
  - [server/src/routes/payments.js](../server/src/routes/payments.js) (lines 460–474)
- **What's happening:**
  - **Stock toggle doesn't persist:** Clicking "Mark Out of Stock" (`toggleStock`) only updates legacy `products.in_stock`, which `formatProductRow` ignores when `product_variants` exist. On reload, the product flips right back to In Stock. Meanwhile, `ProductFormModal` hardcodes `stockQuantity: 10` for every new variant and no admin UI calls `PATCH /api/products/:id/variants/:variantId/inventory`.
  - **Waist sizes unselectable:** `ProductFormModal` lets admins assign waist sizes (`28`–`40`) to bottoms, but `ProductModal` renders a hardcoded `globalSizes` list (`XS`–`XXL`). Customers can never see or select sizes `28`–`40`.
  - **Color-unaware size check:** `ProductModal` checks if a size has `stockQuantity > 0` across *any* color rather than the currently selected color, allowing shoppers to add out-of-stock `(size, color)` combinations that fail at checkout.
  - **Custom color checkout failure:** Selecting a custom color sets `selectedColor = "<Name> (Custom Color)"`, which has no matching row in `product_variants`, causing checkout (`POST /api/payments/verify`) to reject the order with `409 Conflict`.
- **Recommended fix:**
  - Add per-variant stock controls in the Admin Dashboard wired to `PATCH /api/products/:id/variants/:variantId/inventory`.
  - Derive displayed sizes in `ProductModal.jsx` from the product's actual variants and filter stock availability by `(selectedColor, size)`.
  - Decide how custom-color orders should be modeled in checkout (either a separate bespoke inquiry flow without inventory locking, or a dedicated order item type).

---

#### 14. Prisma Schema Drift & Runtime DDL/Write Queries on `GET` Requests
- **Files:**
  - [server/prisma/schema.prisma](../server/prisma/schema.prisma)
  - [server/src/utils/cloudDb.js](../server/src/utils/cloudDb.js)
  - [server/src/routes/auth.js](../server/src/routes/auth.js) (lines 134, 200, 243, 282–283, 337–338, 750–751)
  - [server/src/routes/contact.js](../server/src/routes/contact.js) (lines 82–99)
  - [server/src/routes/categories.js](../server/src/routes/categories.js) (line 57)
- **What's happening:**
  - `schema.prisma` does not match the actual PostgreSQL columns read/written by `pg` (missing `products.subcategory`, `products.subtype`, `products.is_archived`; `categories.displayOrder` missing `@map("display_order")`; `User` uses `name`/`passwordHash` instead of `first_name`/`last_name`/`password_hash`/`addresses`/`cart`; `SizeGuide` uses `measurements` instead of `title`/`subtitle`/`columns`/`rows`; `Order` is missing `city`, `shipping_method`, `transfer_account_name`, `payment_confirmed`, `items_count`, `paid_at`, and `userId` lacks `@map("user_id")`).
  - `GET /api/auth/customer-profile`, `GET /api/auth/cart`, `GET /api/auth/notifications-state`, `GET /api/contact/messages`, and `GET /api/categories` run `ALTER TABLE`, `CREATE TABLE`, or `DELETE FROM categories` on every single read request.
- **Impact:**
  Future `prisma migrate dev` runs could generate destructive migrations against the live database, and running DDL (`ALTER TABLE`) on `GET` requests acquires `ACCESS EXCLUSIVE` locks in PostgreSQL under concurrent traffic.
- **Recommended fix:**
  Reconcile `schema.prisma` with the actual PostgreSQL schema (or introspect via `prisma db pull` to audit drift), and move all `CREATE TABLE`/`ALTER TABLE` statements strictly into migrations — never inside HTTP handlers. Remove the `DELETE FROM categories` statement from `GET /api/categories`.

---

### Low (UX Polish & Code Hygiene)

#### 15. Broken Auth Links, Missing Color Swatch Mappings, Duplicate Slugs, Swallowed Errors, & Missing Rate Limits
- **Files:**
  - [client/src/components/shop/ProductModal.jsx](../client/src/components/shop/ProductModal.jsx) (lines 8–17, 464–476)
  - [client/src/components/shop/ProductCard.jsx](../client/src/components/shop/ProductCard.jsx) (lines 10–19)
  - [client/src/context/ProductContext.jsx](../client/src/context/ProductContext.jsx) (lines 301–593)
  - [server/src/routes/products.js](../server/src/routes/products.js) (line 355)
  - [server/src/index.js](../server/src/index.js) (lines 41–42)
- **What's happening:**
  - **Broken links:** `ProductModal.jsx` links to `/signin?redirect=/shop` and `/create-account?redirect=/shop`, but `App.jsx` registers `/account/login` and `/account/register`. Clicking either hits the catch-all `<Route path="*" element={<Home />} />`.
  - **Missing color hexes:** `getColorHex` in `ProductModal.jsx` and `ProductCard.jsx` omits over half the colors offered in `ProductFormModal` (`Beige`, `Ash/Grey`, `Forest Green`, `Camel`, `Coffee Brown`, `Khaki`, `Burgundy`, `Burnt Orange`, `Baby Pink`, `Sky Blue`, `Striped Sky Blue`), rendering them all as `#cccccc` gray.
  - **Duplicate slugs:** Product creation derives `slug` from `name` with no uniqueness check/suffixing; duplicate product titles will create colliding slugs and break `GET /api/products/:id`.
  - **Silent optimistic failures:** `deleteProduct`, `archiveProduct`, `toggleArchive`, `toggleStock`, and category/subcategory mutations in `ProductContext.jsx` update UI state optimistically and swallow failed HTTP responses without rolling back or notifying the admin.
  - **Permissive JSON limit & no rate limiting:** `express.json({ limit: '50mb' })` creates an unnecessary memory DoS vector once base64 uploads are disallowed, and login/contact/upload routes have no rate limiting.
  - **Unused/legacy code & bundle size:** `cloudinary` dependency and `server/src/utils/seedProductsToDb.js` remain unused/outdated; the Vite production bundle (`dist/assets/index-*.js`) is ~804 kB unsplit (admin dashboard + storefront shipped together).

---

## Recommended Remediation Plan

### Phase 1 — Unblock Mass Product & Image Uploads
1. **Unique IDs & atomic product creation:** Replace `p-${Date.now().slice(-4)}` with `crypto.randomUUID()`, remove `ON CONFLICT (id) DO UPDATE` from `POST /api/products`, deduplicate slugs, and wrap product + variant + image inserts in a single DB transaction.
2. **Safe variant updates:** Refactor `syncProductRelations` to upsert/diff `product_variants` instead of `DELETE + INSERT`, and strip `variant.id`/`sku` when duplicating products.
3. **Harden media uploads:** Fail fast if `R2_PUBLIC_URL` is unset; separate local preview from saved `imageUrl`; disable Save while uploading; reject `data:` URLs server-side; add explicit Multer error handling (`400`/`413`).
4. **Fix gallery images:** Remove the hardcoded `gallery: ['/images/products/linen-set-2.jpg']` default and add gallery image upload/removal UI to `ProductFormModal.jsx` (and store R2 object keys in `product_images.public_id` for reliable cleanup).
5. **Render product descriptions:** Display `description`, `material`, `fit`, `care`, and `shipping` in `ProductModal.jsx`.

### Phase 2 — Critical Security & Storefront Fixes
1. **Lock down JWT auth:** Remove the `jwt.decode` and hardcoded secret fallbacks in `server/src/utils/token.js`.
2. **Protect all private routes:** Add `requireAuth` / `requireAdmin` and ownership checks to orders, customer profiles/carts/passwords, and contact messages; untrack `server/src/data/storage/*.json`.
3. **Fix cart crash:** Change `toMinorUnits(item.price) * item.quantity` to `toMinorUnits(item.price) * BigInt(item.quantity || 1)` in `CartContext.jsx`.
4. **Enforce server-side pricing & payment verification:** Recompute totals from `products.price` in PostgreSQL and verify Paystack's paid `amount` and `currency`.

### Phase 3 — Scaling & Storefront Polish
1. **Catalogue scaling:** Restrict `DRAFT`/`ARCHIVED` visibility to admins, add pagination, and stop mirroring full variant catalogues into `localStorage`.
2. **Inventory & sizing:** Wire admin stock controls to `PATCH /api/products/:id/variants/:variantId/inventory`, render actual product variant sizes (including `28`–`40`) filtered by selected color, and align custom-color ordering with checkout validation.
3. **Database hygiene:** Reconcile `schema.prisma` with live tables and remove DDL/DELETE queries from `GET` endpoints.
4. **UX cleanup:** Fix `/signin` and `/create-account` links, complete `getColorHex` mappings, handle optimistic mutation failures, tighten JSON body limits, and code-split `/admin` from the storefront bundle.

---

## Verification Notes (At Time of Audit)

- **Server test suite (`cd server && npm test`):** 11/11 tests pass (note: tests currently assert middleware behavior with valid tokens and do not test forged unsigned tokens, unauthenticated order/auth/contact endpoints, or variant-preservation on product updates).
- **Client production build (`cd client && npm run build`):** Builds cleanly with Vite 8 (`dist/assets/index-*.js`: 804.47 kB / 211.40 kB gzipped; chunk-size warning emitted).
