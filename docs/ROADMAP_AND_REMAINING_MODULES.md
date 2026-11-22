# Project Roadmap & Outstanding Modules

This document outlines the remaining architectural modules, features, and production milestones required to transition **PENNY** from its current frontend implementation into a full-stack, production-ready e-commerce platform and final year project submission.

---

## 1. Project Status Overview

| Layer / Area | Current Status | Notes |
| :--- | :--- | :--- |
| **Storefront UI & Pages** | **Completed (100%)** | Home, Shop, Product Modal, Bag Drawer, Search, Size Guide, Auth pages with aliases (`/signin`, `/login`, `/create-account`), 60+ fashion color swatches, Info pages. |
| **Checkout Flow** | **Completed (100%)** | Multi-step form, state-based delivery fees, free delivery threshold $\ge$ ₦200,000, authoritative server-side price recalculation from PostgreSQL, summary receipt. |
| **Admin Dashboard** | **Completed (100%)** | Full UI, product CRUD, Multi-Image Manager with individual delete & cover selection, categories, CM size guide, bank transfer config, order drawer, payment confirmation. |
| **Backend & Database** | **Completed (100%)** | Neon Cloud PostgreSQL, collision-free UUIDs, atomic transactions, in-place variant diffs/upserts, relational order snapshots, schema hygiene in `initCloudDatabase()`. |
| **Security & Authentication** | **Completed (100%)** | Strict JWT signature verification (no unsigned/dev fallbacks), RBAC middleware (`requireAuth`, `requireAdmin`), customer data ownership verification, guest takeover prevention. |
| **Payment Processing** | **Completed (Direct Bank Transfer)** | Direct Bank Transfer active with manual admin verification; Paystack server verification hardened with server-side DB pricing, kobo, and NGN checks. |
| **Transactional Email** | **Completed (100%)** | Nodemailer with branded HTML receipts, support inquiry replies, Ethereal test previews, and production SMTP support. |
| **Customer Portal** | **Completed (100%)** | Authenticated customer profile, multi-address book, real-time 5-stage order history tracking, support inquiries, cross-device cart sync, and notification state. |
| **Production Deployment** | **Current Target** | Cloud hosting (Vercel / Render / Supabase) with live domain and SSL. |
| **Academic Documentation** | **In Progress** | Architecture diagrams, ERD, API specs, and defense materials for FYP. |

---

## 2. Admin Dashboard Module

The Admin Dashboard provides store managers with full administrative control through a web UI without editing code.

### 2.1 Access & Security (Single-Owner Model)
- **Strict Single-Owner Model:** Access is exclusively reserved for the business owner. No public admin registration or sign-up option exists anywhere on the platform.
- **Protected Route:** Client-side `/admin` paths are intercepted by `<ProtectedRoute requiredRole="admin">`. Unauthenticated requests or non-admin users are automatically redirected to `/admin/login`.
- **Private Credential Provisioning:** The owner's initial administrator account is seeded securely through server environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) with `bcrypt` salt hashing.
- **Session Termination:** An authenticated administrator can terminate their session via the sidebar "Log Out" action, invalidating the session cookie/token and returning to the storefront.

### 2.2 Product Management (CRUD & Non-Destructive Archiving)
- **Product Catalog Table:** Searchable, filterable list of all products with stock indicators, archive badges, and pricing.
- **Product Archiving (Soft-Hide & Retrieval):**
  - **Non-Destructive Archiving:** Rather than permanently deleting items that are out of season or temporarily paused, store owners can archive pieces with a single click.
  - **Storefront Isolation:** Archived products are immediately filtered out from public viewing on the website (`/shop`, Homepage Essentials, Search Modal, and Bag suggestions).
  - **Quick Status Filtering:** Administrative switcher tabs allow viewing **All**, **Active**, and **Archived** products in the catalogue.
  - **1-Click Restoration:** Easy retrieval button (`ArchiveRestore`) on each archived piece to immediately unarchive and restore it to the live store catalogue.
  - **In-Modal Archive Flag:** Checkbox inside the Add/Edit Product form to set or toggle archive state with clear visual warnings.
  - **API Endpoint:** Supported by server-side `PATCH /api/products/:id/archive` and persistent storage syncing.
- **Add / Edit Product Form:**
  - Product name, slug, description, category, subcategory, subtype.
  - Base price, discounted/sale price.
  - Available sizes (`XS` through `XXL`) and custom size toggles.
  - Color swatches with hex color picker and label assignment.
  - Featured product flag: Automatically feeds the storefront's **"Featured Essentials"** section on the homepage in real time.
- **Image Upload & Multi-Image Manager (Cloudflare R2):**
  - Interactive multi-image management interface with drag-and-drop file uploader and live thumbnail previews.
  - Individual image deletion (🗑️ button) allowing admins to remove specific unwanted photos down to a single cover photo.
  - **Cover Photo Selector:** Set any uploaded photo as the primary showcase image with a single click.
  - **Upload Protection:** Save button is disabled with an active loading spinner while photos upload to prevent saving premature base64 data URLs.
  - S3-compatible Cloudflare R2 storage integration (`/api/media/upload`) with strict `R2_PUBLIC_URL` validation and Multer 413 file size handling.
  - **Single-Source Reflection:** Replacing or uploading photos via the admin automatically synchronizes across the entire website—including the shop collection, product modals, and homepage showcase pieces.

### 2.3 Category & Taxonomy Management
- **Category Manager:** Add, rename, re-order, and delete main categories (*Tops, Bottoms, Sets, etc.*).
- **Subcategory Builder:** Dynamic subcategory tags per parent category.
- **Menu Hierarchy:** Control which categories appear in the customer navigation bar.

### 2.4 Dynamic Size Guide Editor
- **Measurement Tables:** Editable grid for chest, waist, shoulder, hips, and inseam numbers in Centimeters (**CM**).
- **Category-Specific Guides:** Capability to create custom size guides for specific garment fits (e.g., Slim vs. Oversized).

### 2.5 Order & Fulfillment Management (Direct Bank Transfer Flow)
- **Live Orders Feed:** View incoming customer purchases in real time with auto-refresh every 10 seconds.
- **Direct Bank Transfer Verification:** Review incoming orders marked as "Pending Verification" (`paymentConfirmed: false`), match the payer's bank account name with the bank alert, and click **Confirm Payment** to authorize fulfillment.
- **Automated Digital Receipt Dispatch:** Confirming payment automatically transitions order status to `Processing` and dispatches a branded HTML purchase receipt to the customer's email.
- **Order Status Workflow:** Update status (*Pending Payment*, *Processing*, *Shipped*, *Delivered*, *Cancelled*).
- **Customer Information:** View shipping address, phone number, and dispatch notes.
- **Invoice & Packing Slip:** Printable receipt and packing slip generation.

### 2.6 Basic Store Analytics
- Daily, weekly, and monthly sales volume and revenue charts.
- Top-selling products and low-stock inventory alerts.

---

## 3. Backend & Database Architecture

The backend replaces mock in-memory data with a resilient, persistent server infrastructure.

### 3.1 Confirmed Technology Stack Decisions
- **Server Runtime:** **Node.js** with **Express.js** (clean REST API architecture, middleware pipeline, robust error handling).
- **Database & ORM:** **PostgreSQL (Neon Serverless)** paired with `pg` for production connection pooling and transactional integrity; **Prisma ORM** for declarative schema definition and migration tracking.
- **Media Asset Storage:** **Cloudflare R2** (S3-compatible, zero-egress cost object storage with high-speed global CDN delivery, automated payload limits, and public URL validation).
- **Authentication & Authorization:** **JSON Web Tokens (JWT)** with strict signature validation, **bcryptjs** password hashing, RBAC middleware (`requireAuth`, `requireAdmin`), and customer session ownership scoping.
- **Security & Integrity:** **Helmet** HTTP header protection, **CORS** origin restriction, authoritative server-side price recalculation, and guest checkout account takeover prevention.

### 3.2 Database Schema (Entity-Relationship Model)
1. **Users Table:**
   - `id`, `email`, `password_hash`, `first_name`, `last_name`, `role` (`customer` | `admin`), `phone`, `addresses` (JSONB), `cart` (TEXT), `seen_notifications` (TEXT), `dismissed_notifications` (TEXT), `created_at`.
2. **Categories Table:**
   - `id`, `name`, `slug`, `display_order`, `subcategories` (JSONB).
3. **Products Table:**
   - `id`, `slug`, `name`, `category`, `subcategory`, `subtype`, `price`, `description`, `material`, `fit`, `care`, `shipping`, `images` (JSONB), `colors` (JSONB), `available_sizes` (JSONB), `featured` (bool), `in_stock` (bool), `is_archived` (bool), `status` (`DRAFT` | `ACTIVE` | `ARCHIVED`), `created_at`, `updated_at`.
4. **Product Variants Table (`product_variants`):**
   - `id` (UUID), `product_id`, `size`, `color_name`, `color_hex`, `stock_quantity`, `sku` (UNIQUE), `created_at`, `updated_at`.
5. **Product Images Table (`product_images`):**
   - `id`, `product_id`, `url`, `public_id`, `is_primary`, `created_at`.
6. **Inventory Adjustments Table (`inventory_adjustments`):**
   - `id`, `variant_id`, `product_id`, `quantity_delta`, `reason`, `reference`, `actor_id`, `created_at`.
7. **Size Guides Table (`size_guides`):**
   - `category`, `title`, `subtitle`, `columns` (JSONB), `rows` (JSONB), `updated_at`.
8. **Bank Config Table (`bank_config`):**
   - `id`, `bank_name`, `account_name`, `account_number`, `instructions`, `updated_at`.
9. **Contact Inquiries Table (`contact_inquiries`):**
   - `id`, `name`, `email`, `user_id`, `order_number`, `subject`, `message`, `type`, `status`, `reply`, `replied_at`, `created_at`.
10. **Orders Table:**
    - `id`, `reference`, `user_id`, `customer`, `email`, `phone`, `state`, `city`, `address`, `shipping_method`, `payment_method`, `transfer_account_name`, `payment_confirmed`, `items_count`, `subtotal`, `delivery_fee`, `total`, `status`, `items` (JSONB), `paid_at`, `created_at`.
11. **Order Items Table (`order_items`):**
    - `id`, `order_id`, `product_id`, `variant_id`, `name`, `size`, `color`, `image_url`, `quantity`, `unit_price`.

### 3.3 Core API Endpoints
- **Authentication & Customer Accounts (`/api/auth`):**
  - `POST /login`, `POST /logout`, `GET /me` (Admin single-owner authentication)
  - `POST /customer-login`, `POST /customer-register`, `POST /customer-change-password` (Bcrypt secured)
  - `GET /customer-profile`, `POST /customer-sync` (Verified JWT session scoped)
  - `GET /cart`, `POST /cart` (Cross-device synced cart)
  - `GET /notifications-state`, `POST /notifications-state` (Seen & dismissed tracking)
- **Catalogue & Inventory (`/api/products`):**
  - `GET /` (Public storefront: active products only; admin: includes drafts/archives; pagination via `page` and `limit`)
  - `GET /:id`, `POST /` (Atomic UUID creation), `PUT /:id` (In-place variant upsert & stock toggle), `DELETE /:id`
  - `POST /:id/adjust-inventory`, `PATCH /:id/archive`
- **Taxonomies (`/api/categories`):**
  - `GET /`, `POST /`, `DELETE /:id`
- **Media Assets (`/api/media`):**
  - `GET /status`, `POST /upload` (Cloudflare R2 multi-upload with Multer 413 handling), `DELETE /delete`
- **Payments & Orders (`/api/payments`):**
  - `GET /orders` (Admin only: live orders list), `DELETE /orders/:id` (Admin or verified owner)
  - `GET /my-orders` (Authenticated customer order history / guest verification)
  - `POST /create-intent`, `POST /verify` (Authoritative server pricing recalculation from DB)
  - `POST /orders/:id/confirm-payment` (Admin manual bank transfer confirmation & email trigger)
  - `PATCH /orders/:id/status` (Workflow progression: Processing -> Shipped -> Delivered)
  - `GET /config`, `PUT /config/bank` (Admin bank details editor)
- **Customer Support & Inquiries (`/api/contact`):**
  - `POST /submit`, `POST /custom-color` (Public contact & custom shade formulation requests)
  - `GET /messages` (Admin only), `PATCH /messages/:id/read`, `POST /messages/:id/reply` (Admin email reply dispatch)
  - `GET /my-inquiries` (Authenticated customer inquiry history), `DELETE /messages/:id`

---

## 4. Payment Workflows (Direct Bank Transfer & Paystack)

1. **Active Primary Method — Direct Bank Transfer:**
   - Customer selects Direct Bank Transfer at checkout and receives the official PENNY bank details.
   - Payer enters their bank account name in Checkout Step 3 to link the transfer with their order.
   - Order is created in PostgreSQL with status `Processing` and `paymentConfirmed = false`.
   - Admin verifies the bank credit on their phone/bank app, opens `/admin`, and clicks **Confirm Payment**.
   - Order is marked paid, and an official luxury digital purchase receipt is automatically dispatched to the customer's email.
2. **Secondary Method — Paystack (Ready for Re-activation):**
   - Server-side price recalculation from PostgreSQL database prevents client price tampering.
   - Paystack verification verifies that `amount` (kobo) and `currency` (`NGN`) match the server-calculated order total.
   - Webhook listener (`/api/payments/webhook`) prepared for automatic payment capture.

---

## 5. Automated Transactional Email System

- **Email Provider:** Nodemailer with automated support for Gmail App Passwords, custom SMTP (Resend / SendGrid), and instantaneous Ethereal test inbox preview URLs.
- **Templates Active:**
  - **Order Confirmation & Official Receipt:** Branded receipt containing purchased pieces, delivery address, order ID, items breakdown, line subtotals, and official PENNY logo.
  - **Customer Inquiry Reply:** Clean, branded email dispatched directly from the admin dashboard to the customer's inbox with real-time in-app inquiry card updates.

---

## 6. Customer Account Portal Enhancements

- **Real Order History:** Logged-in customers can view past orders, track dispatch progress, and download receipts.
- **Saved Addresses:** Ability to store default delivery information for fast, one-click checkout.
- **Password & Profile Settings:** Change passwords, update phone numbers, and manage notification preferences.

---

## 7. Performance & Production Polish

- **SEO & Social Sharing:** Dynamic OpenGraph tags so product URLs display previews (cover photo, price, title) when shared on WhatsApp, Twitter, or iMessage.
- **Optimized Assets:** WebP image conversion, responsive image `srcset`, and asset caching.
- **Custom 404 & Error Boundaries:** Graceful, branded fallback screens for broken links or failed network calls.

---

## 8. Deployment & Hosting Strategy

- **Frontend:** Hosted on **Vercel** or **Netlify** with automatic GitHub CI/CD deployments.
- **Backend API:** Hosted on **Render**, **Railway**, or **Supabase Functions**.
- **Database:** Hosted PostgreSQL on **Supabase** or **Neon**.
- **Media Assets:** **Cloudinary** or **Supabase Storage**.
- **Domain & SSL:** Custom domain (e.g. `pennymenswear.com` or custom subdomain) with HTTPS encryption.

---

## 9. Final Year Project (FYP) Academic Requirements

To fulfill academic submission criteria for a computer science or engineering degree, the project requires:
1. **System Architecture Document:** High-level diagrams detailing Client-Server communication, MVC / component hierarchy, and data pipelines.
2. **Database Design (ERD):** Entity-Relationship Diagram with relational cardinality and foreign key relationships.
3. **API Documentation:** Interactive documentation using Swagger (OpenAPI) or Postman workspace.
4. **Testing Suite:**
   - Unit testing for cart calculations and price algorithms.
   - Integration testing for checkout and API routes.
5. **Final Project Report / Thesis Sections:**
   - Chapter 1: Introduction, Problem Statement, Objectives, and Scope.
   - Chapter 2: Literature Review & Market Analysis (Fast Fashion vs. Minimal Capsule Wardrobe platforms).
   - Chapter 3: System Methodology & Architectural Design.
   - Chapter 4: Implementation & Technology Stack Justification.
   - Chapter 5: Testing, Evaluation, and Security Considerations.
   - Chapter 6: Conclusion, Limitations, and Recommendations for Future Work.

