# Project Roadmap & Outstanding Modules

This document outlines the remaining architectural modules, features, and production milestones required to transition **PENNY** from its current frontend implementation into a full-stack, production-ready e-commerce platform and final year project submission.

---

## 1. Project Status Overview

| Layer / Area | Current Status | Notes |
| :--- | :--- | :--- |
| **Storefront UI & Pages** | **Completed (~95%)** | Home, Shop, Product Details, Bag Drawer, Search, Size Guide, Auth pages, Info pages. |
| **Checkout Flow** | **Completed (Simulated)** | Multi-step form, state-based delivery fees, Nigerian states selector, summary receipt. |
| **Admin Dashboard** | **Completed (UI & Client Sync)** | Full UI, product CRUD, image uploader & preview, categories, size guide, order drawer, ProductContext & localStorage sync. |
| **Backend & Database** | **Pending (Next Target)** | REST/GraphQL API, persistent database, session/JWT auth, cloud storage. |
| **Payment Gateway** | **Pending** | Real Paystack/Flutterwave API keys, webhook listener, transaction verification. |
| **Transactional Email** | **Pending** | Order receipts, tracking updates, and password resets sent to email inboxes. |
| **Customer Portal** | **Partially Implemented** | Account layout exists; needs real order history and address book synchronization. |
| **Production Deployment** | **Pending** | Cloud hosting (Vercel/Render/Supabase) with live domain and SSL. |
| **Academic Documentation** | **Pending** | Architecture diagrams, ERD, API specs, and defense materials for FYP. |

---

## 2. Admin Dashboard Module

The Admin Dashboard provides store managers with full administrative control through a web UI without editing code.

### 2.1 Access & Security (Single-Owner Model)
- **Strict Single-Owner Model:** Access is exclusively reserved for the business owner. No public admin registration or sign-up option exists anywhere on the platform.
- **Protected Route:** Client-side `/admin` paths are intercepted by `<ProtectedRoute requiredRole="admin">`. Unauthenticated requests or non-admin users are automatically redirected to `/admin/login`.
- **Private Credential Provisioning:** The owner's initial administrator account is seeded securely through server environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) with `bcrypt` salt hashing.
- **Session Termination:** An authenticated administrator can terminate their session via the sidebar "Log Out" action, invalidating the session cookie/token and returning to the storefront.

### 2.2 Product Management (CRUD)
- **Product Catalog Table:** Searchable, filterable list of all products with stock indicators and pricing.
- **Add / Edit Product Form:**
  - Product name, slug, description, category, subcategory.
  - Base price, discounted/sale price.
  - Available sizes (`XS` through `XXL`) and custom size toggles.
  - Color swatches with hex color picker and label assignment.
  - Featured product flag: Automatically feeds the storefront's **"Featured Essentials"** section on the homepage in real time.
- **Image Upload & Media Manager (Cloudinary):**
  - Drag-and-drop image uploader with instantaneous local thumbnail preview and CDN upload pipeline.
  - Primary photo selection and gallery re-ordering.
  - Integration with Cloudinary for automated WebP compression and responsive CDN delivery.
  - **Single-Source Reflection:** Replacing or uploading photos via the admin automatically synchronizes across the entire website—including the shop collection, product modals, and homepage showcase pieces.
  - **Hero & Promotional Asset Replacement:** Interface or configuration to replace mock editorial carousel slides on the homepage with high-resolution brand campaign imagery.

### 2.3 Category & Taxonomy Management
- **Category Manager:** Add, rename, re-order, and delete main categories (*Tops, Bottoms, Sets, etc.*).
- **Subcategory Builder:** Dynamic subcategory tags per parent category.
- **Menu Hierarchy:** Control which categories appear in the customer navigation bar.

### 2.4 Dynamic Size Guide Editor
- **Measurement Tables:** Editable grid for chest, waist, shoulder, hips, and inseam numbers in Centimeters (**CM**).
- **Category-Specific Guides:** Capability to create custom size guides for specific garment fits (e.g., Slim vs. Oversized).

### 2.5 Order & Fulfillment Management
- **Live Orders Feed:** View incoming customer purchases in real time.
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
- **Database & ORM:** **PostgreSQL** paired with **Prisma ORM** (strict relational integrity, declarative schema definition, automated type generation, and streamlined database migrations).
- **Media Asset Storage:** **Cloudinary** (enterprise-grade e-commerce CDN offering automatic image optimization, format adaptation, and high-speed global delivery).
- **Authentication & Authorization:** **JSON Web Tokens (JWT)** with HTTP-Only cookie storage and **bcryptjs** password hashing.
- **Security & Integrity:** **Helmet** HTTP header protection, **CORS** origin restriction, and server-side request schema validation.

### 3.2 Database Schema (Entity-Relationship Model)
1. **Users Table / Collection:**
   - `id`, `email`, `password_hash`, `first_name`, `last_name`, `role` (`customer` | `admin`), `phone`, `created_at`.
2. **Addresses Table:**
   - `id`, `user_id`, `street`, `city`, `state`, `postal_code`, `is_default`.
3. **Categories & Subcategories Table:**
   - `id`, `name`, `slug`, `parent_id`.
4. **Products Table:**
   - `id`, `name`, `slug`, `price`, `description`, `material`, `fit`, `care`, `shipping_info`, `category_id`, `subcategory_id`, `in_stock`, `featured`, `created_at`.
5. **Product Variants / Inventory:**
   - `id`, `product_id`, `color_name`, `color_hex`, `size`, `stock_quantity`, `sku`.
6. **ProductImages Table:**
   - `id`, `product_id`, `url`, `is_primary`, `sort_order`.
7. **SizeGuides Table:**
   - `id`, `category_id`, `unit` (`cm` | `in`), `size`, `measurements_json`.
8. **Orders Table:**
   - `id`, `order_reference`, `user_id`, `guest_email`, `total_amount`, `shipping_cost`, `grand_total`, `status`, `payment_status`, `payment_method`, `shipping_address_json`, `created_at`.
9. **OrderItems Table:**
   - `id`, `order_id`, `product_id`, `size`, `color`, `quantity`, `unit_price`.

### 3.3 Core API Endpoints
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh-token`, `GET /api/auth/me`
- `GET /api/products`, `GET /api/products/:id`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`
- `GET /api/categories`, `POST /api/categories`, `PUT /api/categories/:id`
- `GET /api/size-guides`, `PUT /api/size-guides/:id`
- `POST /api/orders`, `GET /api/orders/:id`, `GET /api/orders/my-orders`, `GET /api/admin/orders`, `PATCH /api/admin/orders/:id/status`
- `POST /api/payments/initialize`, `POST /api/payments/verify`, `POST /api/payments/webhook`

---

## 4. Payment Gateway Integration (Paystack / Flutterwave)

1. **Transaction Initialization:** Server generates a payment link or authorization code from Paystack.
2. **Inline Popup / Secure Redirect:** Customer completes payment securely using Card, Bank Transfer, or USSD.
3. **Webhook Verification (Crucial):** Secure webhook endpoint (`/api/payments/webhook`) listening for `charge.success` events to prevent fraudulent order confirmations.
4. **Order Status Update:** Order transitions from `Pending Payment` to `Paid` automatically.

---

## 5. Automated Transactional Email System

- **Email Provider:** Integration with Resend, SendGrid, or AWS SES.
- **Templates Required:**
  - **Order Confirmation:** Clean, branded receipt containing purchased pieces, delivery address, order ID, and estimated arrival.
  - **Shipping Notification:** Alert containing courier/dispatch details once marked "Shipped" in the admin dashboard.
  - **Password Reset & Account Verification:** Security links sent to customer inboxes.

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

