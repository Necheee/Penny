# PENNY Pre-Upload Audit & Security Report

**Initial Audit Date:** 2026-11-19  
**Last Updated:** 2026-11-22 (Post-Phase 1 Remediation)  
**Scope:** Full-repository readiness review prior to mass uploading product images and public storefront launch  
**Current Verdict:** 
* **Catalogue & Image Mass Upload:** **GREEN / GO** — All catalogue data-loss traps, ID collisions, silent product overwrites, broken duplication errors, Cloudflare R2 multi-image controls, base64 bloat protections, and the storefront cart crash have been fully resolved. The admin dashboard is now safe for mass catalog onboarding.
* **Public Customer Launch:** **NO-GO** until **Phase 2** (JWT authentication bypass, unauthenticated customer/order endpoints, and server-side payment verification) is completed.

---

## Executive Summary

A full audit of the PENNY architecture identified **15 distinct concerns** across database integrity, checkout calculations, image/upload pipelines, storefront rendering, and application security.

### Phase 1 Remediation Summary (Completed 2026-11-22)
All critical blockers preventing safe mass product creation, image uploading, editing, and duplication have been resolved:
1. **Cart Crash Fixed (Issue 3):** Resolved the `BigInt * Number` TypeError in [CartContext.jsx](../client/src/context/CartContext.jsx) and hardened currency arithmetic in [money.js](../client/src/utils/money.js).
2. **Safe Atomic Product Creation & Collision-Free IDs (Issue 6):** Replaced 4-digit timestamp IDs (`p-XXXX`) with cryptographically secure UUIDs, eliminated `ON CONFLICT (id) DO UPDATE` to prevent silent product overwrites, added automatic slug deduplication, and wrapped product insertion in atomic transactions in [products.js](../server/src/routes/products.js).
3. **Non-Destructive Variant Upserts (Issue 8):** Replaced the destructive `DELETE FROM product_variants` query with an in-place diff and update. Stable variant IDs prevent foreign-key nullification in `order_items` and cascading deletions in `inventory_adjustments`. Variants referenced by past orders are soft-retired instead of deleted.
4. **Reliable Product Duplication (Issue 9):** Cloned variants are stripped of legacy IDs and SKUs in [AdminDashboard.jsx](../client/src/pages/AdminDashboard.jsx) and [ProductFormModal.jsx](../client/src/components/admin/ProductFormModal.jsx). Fresh unique UUIDs and barcodes are assigned, preventing database primary key and unique constraint crashes.
5. **Multi-Image Management & Cloudflare R2 Guardrails (Issues 7 & 10):**
   - Removed hardcoded fake linen gallery images.
   - Built an interactive Multi-Image Manager in [ProductFormModal.jsx](../client/src/components/admin/ProductFormModal.jsx) allowing admins to upload multiple photos, set cover images, and delete individual images down to a single photo.
   - Locked the **Save Product** button while images are actively uploading.
   - Added backend validation in [products.js](../server/src/routes/products.js) to reject raw `data:` base64 URLs.
   - Enforced `R2_PUBLIC_URL` validation in [media.js](../server/src/routes/media.js) and wrapped Multer upload limits (`LIMIT_FILE_SIZE` -> 413).
6. **Storefront Description Specs Scope (Issue 5):** The store owner explicitly removed description, material, fit, care, and shipping specs from the storefront design requirements, marking this issue as resolved / out of scope.

### What Remains (Phase 2 & Phase 3)
* **Phase 2 (Launch Blockers):** 3 remaining critical vulnerabilities (Issues 1, 2, and 4: JWT authentication bypass, unauthenticated PII/order routes, and client-controlled payment amounts) must be resolved prior to accepting live customer payments.
* **Phase 3 (Scaling & Polish):** Pagination, admin variant inventory controls, and code cleanup.

---

## Summary Table

| # | Severity | Category | Concern | Status | Notes |
| :-: | :--- | :--- | :--- | :---: | :--- |
| 1 | **Critical** | Security / Auth | Unsigned JWT fallback allows complete admin auth bypass | 🔴 **OPEN** | Blocks public launch |
| 2 | **Critical** | Security / PII | Unauthenticated order dumps, deletion, replies, & account takeover | 🔴 **OPEN** | Blocks public launch |
| 3 | **Critical** | Storefront Bug | Cart subtotal calculation crashes the app with `BigInt * Number` TypeError | 🟢 **RESOLVED** | Fixed in `CartContext.jsx` & `money.js` (commit `a05ca01`) |
| 4 | **Critical** | Payments | Checkout trusts client-submitted prices & never verifies Paystack paid amount | 🔴 **OPEN** | Blocks public launch |
| 5 | **High** | Storefront UX | Product descriptions & specs are never rendered to customers | ⚪ **RESOLVED** | Discarded from website per business design requirements |
| 6 | **High** | Data Integrity | 4-digit timestamp IDs + `ON CONFLICT DO UPDATE` silently overwrite products | 🟢 **RESOLVED** | Fixed in `products.js` & `AdminDashboard.jsx` (commit `19ce98d`) |
| 7 | **High** | Media / DB | In-progress R2 uploads save multi-MB base64 data URLs to Postgres | 🟢 **RESOLVED** | Save disabled during upload; base64 rejected server-side (commit `19ce98d`) |
| 8 | **High** | Data Integrity | Editing any product deletes `product_variants`, wiping audit logs & orders | 🟢 **RESOLVED** | Non-destructive in-place variant diff/upsert implemented (commit `19ce98d`) |
| 9 | **High** | Data Integrity | Duplicating a product fails with variant PK/SKU collision | 🟢 **RESOLVED** | Cloned IDs/SKUs stripped; fresh keys generated in transaction (commit `19ce98d`) |
| 10 | **High** | Media / Admin UX | Broken R2 fallback (`403`), fake gallery photo, and no multi-image UI | 🟢 **RESOLVED** | Multi-image manager, individual delete, and R2 check added (commits `57b5dc6`, `19ce98d`) |
| 11 | **Medium** | Scaling / Privacy | Unpaginated full-catalogue fetch, `localStorage` cache bloat, & draft reads | 🟡 **OPEN** | Scheduled for Phase 3 |
| 12 | **Medium** | Infrastructure | Memory-buffered uploads, proxy timeouts, generic 500s, & orphaned R2 | 🟡 **PARTIAL** | Multer error handling added; R2 orphan cleanup in Phase 3 |
| 13 | **Medium** | Inventory / UX | Broken stock toggle, missing inventory UI, unselectable waist sizes | 🟡 **OPEN** | Scheduled for Phase 3 |
| 14 | **Medium** | Database | Prisma schema drift vs. live `pg` tables & runtime DDL/DELETE inside `GET` | 🟡 **OPEN** | Scheduled for Phase 3 |
| 15 | **Low** | Polish / Hygiene | Broken auth links, missing color hexes, duplicate slugs, swallowed errors | 🟡 **PARTIAL** | Duplicate slugs resolved; link/color polish in Phase 3 |

---

## Detailed Status of Findings

### Critical (Launch Blockers)

#### 1. Complete Admin Authentication Bypass via Unsigned JWT Fallback
- **Status:** 🔴 **OPEN**
- **Files:**
  - [server/src/utils/token.js](../server/src/utils/token.js) (lines 3, 29–47)
  - [server/src/middleware/auth.js](../server/src/middleware/auth.js) (lines 6–52)
- **Current State:**
  `verifyToken` falls back to a hardcoded development secret and calls `jwt.decode(token)` if signature verification fails, returning an unverified payload if `decoded.role` exists.
- **Action Required:**
  Remove both the dev secret fallback and `jwt.decode` fallback. Enforce strict verification with `jwt.verify(token, JWT_SECRET)`.

---

#### 2. Unauthenticated PII Exposure, Order Deletion, Inquiry Spoofing, & Customer Account Takeover
- **Status:** 🔴 **OPEN**
- **Files:**
  - [server/src/routes/payments.js](../server/src/routes/payments.js) (lines 806–945)
  - [server/src/routes/auth.js](../server/src/routes/auth.js) (lines 122–383, 566–576, 623–800)
  - [server/src/routes/contact.js](../server/src/routes/contact.js) (lines 78–270, 551–576)
  - [client/src/pages/Account.jsx](../client/src/pages/Account.jsx) (line 259)
  - [server/src/data/storage/users.json](../server/src/data/storage/users.json)
- **Current State:**
  `GET /api/payments/orders`, `DELETE /api/payments/orders/:id`, customer sync/password change routes, and contact inquiry routes lack authentication and authorization checks.
- **Action Required:**
  Protect admin endpoints with `requireAuth` + `requireAdmin`. Derive customer identities from verified JWT sessions (`req.user.id`) rather than query parameters or request bodies.

---

#### 3. Adding Any Item to the Cart Crashes the Storefront (`BigInt` TypeError)
- **Status:** 🟢 **RESOLVED** (2026-11-22)
- **Files Modified:**
  - [client/src/context/CartContext.jsx](../client/src/context/CartContext.jsx)
  - [client/src/utils/money.js](../client/src/utils/money.js)
- **Resolution Applied:**
  - Updated `cartSubtotal` in `CartContext.jsx` to explicitly convert `item.quantity` to `BigInt` before multiplying by minor units: `toMinorUnits(item.price) * BigInt(Math.max(1, Math.round(Number(item.quantity) || 1)))`.
  - Wrapped calculation in a defensive `try...catch` block with a floating-point fallback to guarantee `<CartProvider>` can never crash the React component tree.
  - Hardened [client/src/utils/money.js](../client/src/utils/money.js) to strip formatted commas and sanitize inputs safely.

---

#### 4. Checkout Trusts Client-Submitted Prices & Unverified Payment Amounts
- **Status:** 🔴 **OPEN**
- **Files:**
  - [server/src/routes/payments.js](../server/src/routes/payments.js) (lines 341–417, 451–532)
- **Current State:**
  `POST /api/payments/verify` creates orders using client-supplied prices without querying authoritative `products.price` from PostgreSQL, and accepts Paystack verification without comparing paid kobo amounts.
- **Action Required:**
  Recalculate order subtotal and delivery fees server-side using authoritative database pricing. Validate that `verifyJson.data.amount` matches the expected order kobo total and that currency is `NGN`.

---

### High Severity (Catalog & Image Pipeline)

#### 5. Product Descriptions, Material, Fit, Care, & Shipping
- **Status:** ⚪ **RESOLVED / OUT OF SCOPE** (2026-11-22)
- **Context:**
  The store owner decided to streamline the storefront aesthetic and intentionally removed description, material, fit, care, and shipping specifications from customer-facing product views. No frontend changes needed.

---

#### 6. 4-Digit Timestamp Product IDs & `ON CONFLICT DO UPDATE` Overwrite Trap
- **Status:** 🟢 **RESOLVED** (2026-11-22)
- **Files Modified:**
  - [server/src/routes/products.js](../server/src/routes/products.js)
  - [client/src/pages/AdminDashboard.jsx](../client/src/pages/AdminDashboard.jsx)
- **Resolution Applied:**
  - Replaced `p-${Date.now().toString().slice(-4)}` with cryptographically secure UUIDs (`p-${crypto.randomUUID()}`).
  - Removed `ON CONFLICT (id) DO UPDATE` from `POST /api/products`. If an existing ID is submitted, the route returns `409 Conflict` instead of overwriting existing catalog records.
  - Added automatic slug deduplication (`${slug}-${randomHash}`) to prevent route collisions.
  - Wrapped product, variant, and image creation inside a single atomic PostgreSQL transaction with rollback on failure.

---

#### 7. Base64 Data URL Persistence from In-Progress or Failed Uploads
- **Status:** 🟢 **RESOLVED** (2026-11-22)
- **Files Modified:**
  - [client/src/components/admin/ProductFormModal.jsx](../client/src/components/admin/ProductFormModal.jsx)
  - [server/src/routes/products.js](../server/src/routes/products.js)
- **Resolution Applied:**
  - Disabled the **Save Product** button in `ProductFormModal.jsx` while images are uploading, adding an animated `Loader2` state to prevent saving pending or uncompressed images.
  - Added strict backend validation in `syncProductRelations` in `products.js` that rejects any URL starting with `data:` with a `400 Bad Request`.

---

#### 8. Editing Any Product Destroys `product_variants` & Audit History
- **Status:** 🟢 **RESOLVED** (2026-11-22)
- **Files Modified:**
  - [server/src/routes/products.js](../server/src/routes/products.js)
- **Resolution Applied:**
  - Replaced `DELETE FROM product_variants WHERE product_id = $1` with an in-place variant diff and upsert algorithm.
  - Matches existing variants by ID or `(size, color_name)` and updates them in place, preserving primary keys and preventing foreign key nullification in `order_items` and cascading deletion in `inventory_adjustments`.
  - Added check against `order_items`: removed variants that are referenced by existing customer orders are soft-retired (`stock_quantity = 0`) instead of deleted.

---

#### 9. Duplicating a Product Primary Key / SKU Collision
- **Status:** 🟢 **RESOLVED** (2026-11-22)
- **Files Modified:**
  - [client/src/pages/AdminDashboard.jsx](../client/src/pages/AdminDashboard.jsx)
  - [client/src/components/admin/ProductFormModal.jsx](../client/src/components/admin/ProductFormModal.jsx)
  - [server/src/routes/products.js](../server/src/routes/products.js)
- **Resolution Applied:**
  - `handleDuplicateProduct` in `AdminDashboard.jsx` explicitly strips legacy `id` and `sku` values from cloned variant arrays.
  - `ProductFormModal.jsx` initializes duplicated products without variant IDs.
  - The server generates clean UUIDs and unique SKU strings for each cloned variant inside an atomic transaction.

---

#### 10. Multi-Image Management, Broken R2 Fallbacks, & Linen Set Gallery Default
- **Status:** 🟢 **RESOLVED** (2026-11-22)
- **Files Modified:**
  - [client/src/components/admin/ProductFormModal.jsx](../client/src/components/admin/ProductFormModal.jsx)
  - [client/src/pages/AdminDashboard.jsx](../client/src/pages/AdminDashboard.jsx)
  - [server/src/routes/media.js](../server/src/routes/media.js)
  - [server/src/data/storage/products.json](../server/src/data/storage/products.json)
- **Resolution Applied:**
  - Removed hardcoded `gallery: ['/images/products/linen-set-2.jpg']` fallback on product creation.
  - Built an interactive Multi-Image Manager in `ProductFormModal.jsx` allowing admins to view all uploaded images, delete unwanted photos with a 🗑️ button, set any photo as the cover image, and drag-and-drop multiple images simultaneously.
  - In `media.js`, enforced that `R2_PUBLIC_URL` must be configured, failing fast with a descriptive 500 error instead of returning private S3 endpoints that cause `403 Forbidden` browser errors.
  - Added Multer error handling wrapper returning clean `413 Payload Too Large` responses for files exceeding 15MB.

---

### Medium & Low Severity (Operational & Polish)

#### 11. Unpaginated Full-Catalogue Fetching & `localStorage` Cache Limits
- **Status:** 🟡 **OPEN (Scheduled for Phase 3)**
- **Current State:** Public storefront fetches all products including drafts and archives in an unpaginated payload.
- **Action Planned:** Restrict draft/archive reads to authenticated admins, add pagination, and omit full variant collections on list views.

#### 12. Upload Memory Buffering & Orphaned R2 Objects
- **Status:** 🟡 **PARTIAL (Phase 1 + Phase 3)**
- **Progress:** Multer file-size and MIME type errors now return clean 413/400 responses. R2 deletion on product cleanup scheduled for Phase 3.

#### 13. Stock Toggle Persistence & Variant Inventory UI
- **Status:** 🟡 **OPEN (Scheduled for Phase 3)**
- **Current State:** `toggleStock` updates legacy `in_stock` boolean rather than variant stock quantities.

#### 14. Prisma Schema Drift & Runtime DDL on `GET` Requests
- **Status:** 🟡 **OPEN (Scheduled for Phase 3)**
- **Current State:** DDL statements exist in several read endpoints. Will be relocated to migration scripts.

#### 15. Broken Auth Links, Color Swatches, & Hygiene
- **Status:** 🟡 **PARTIAL (Phase 1 + Phase 3)**
- **Progress:** Slug collisions resolved with deduplication suffixes. Color swatch mapping and auth navigation links scheduled for Phase 3.

---

## Remediation Roadmap

### Phase 1 — Catalogue & Upload Pipeline Hardening (COMPLETED)
- [x] Fix storefront cart BigInt calculation crash (`CartContext.jsx`, `money.js`)
- [x] Collision-free product UUIDs & remove `ON CONFLICT DO UPDATE` (`products.js`, `AdminDashboard.jsx`)
- [x] Atomic transactions for product + variant + image creation (`products.js`)
- [x] Non-destructive in-place variant diff & upsert with order protection (`products.js`)
- [x] Clean product duplication stripping old IDs & SKUs (`AdminDashboard.jsx`, `ProductFormModal.jsx`)
- [x] Multi-Image Manager with individual delete and cover selection (`ProductFormModal.jsx`)
- [x] Upload guardrails: disable Save while uploading, reject raw base64 (`ProductFormModal.jsx`, `products.js`)
- [x] Cloudflare R2 public URL validation & Multer 413 error handling (`media.js`)

### Phase 2 — Critical Security & Payment Hardening (NEXT)
- [ ] Remove unsigned JWT and hardcoded secret fallbacks in `server/src/utils/token.js`
- [ ] Protect order endpoints (`GET /api/payments/orders`, `DELETE /api/payments/orders/:id`) with admin auth
- [ ] Authenticate customer profile, cart, notifications, and contact inquiry routes
- [ ] Server-side price recalculation from PostgreSQL during checkout (`/api/payments/verify`)
- [ ] Verify Paystack paid amount (kobo) and currency (NGN) match expected order total

### Phase 3 — Scaling, Inventory UI, & Hygiene
- [ ] Restrict `DRAFT`/`ARCHIVED` catalogue visibility to admins and implement pagination
- [ ] Add variant-level inventory controls in Admin Dashboard
- [ ] Move runtime `CREATE/ALTER TABLE` statements out of `GET` routes into Prisma migrations
- [ ] Align `/signin` and `/create-account` links and complete missing color swatch hexes

---

## Verification Summary

- **Server Test Suite (`npm --prefix server test`):** 11/11 tests pass.
- **Client Build (`npm --prefix client run build`):** Vite production build completes cleanly with 0 errors.
- **Git Branches Synchronized:** Both `main` and `penny_dev_branch` are up to date.
