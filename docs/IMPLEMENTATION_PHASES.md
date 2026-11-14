# PENNY — Implementation Phases & Roadmap

This document outlines the structured development phases for **PENNY**, covering the completed frontend work, the imminent **Admin Dashboard**, and subsequent milestones through full backend integration, payment processing, deployment, and final project submission.

---

## High-Level Phase Overview

```
[Phases 1-10: Frontend Storefront]                  --> COMPLETED
                 │
                 ▼
[Phase 11: Admin Dashboard UI & Workflows]            --> COMPLETED
                 │
                 ▼
[Phase 12: Backend Server & Neon Cloud PostgreSQL]    --> COMPLETED
                 │
                 ▼
[Phase 13: Full-Stack Integration & Persistent Sync]  --> COMPLETED
                 │
                 ▼
[Phase 14: Payment Workflows & Transactional Emails]  --> COMPLETED
                 │
                 ▼
[Phase 15: Production Deployment & SEO (Live Launch)] --> CURRENT TARGET
                 │
                 ▼
[Phase 16: Academic Defense & Documentation (FYP)]
```

---

## Phase 1 to 10: Storefront Frontend (Completed)

- **Phase 1 — Foundations:** Architecture, Vite setup, design tokens, typography, and routing.
- **Phase 2 — Catalogue & Assets:** 20+ menswear pieces with rich metadata and photography.
- **Phase 3 — Global Layout:** Sticky Header, Announcement Bar, Footer, and responsive mobile drawers.
- **Phase 4 — Homepage:** Editorial hero, curated categories, capsule philosophy, and newsletter signup.
- **Phase 5 — The Shop:** Filtering by category/size, sorting options, and live URL synchronization.
- **Phase 6 — Product Experience:** Modal purchasing interface, color swatches, size selector, and expandable details.
- **Phase 7 — Bag & Checkout:** Cart drawer, free shipping threshold (₦200,000), multi-step checkout form, and 36 Nigerian states delivery fees.
- **Phase 8 — Customer Accounts & Wishlist:** Authentication screens, wishlist toggles, and profile mockup.
- **Phase 9 — Brand & Editorial Pages:** About, Contact, Care Guide, Shipping & Returns, Terms, and Privacy.
- **Phase 10 — Storefront Polish:** Interactive Size Guide modal, global Search modal, transparent brand logo, and accessibility refinements.

---

## Phase 11: Admin Dashboard UI & Management Workflows (Completed)

The objective of Phase 11 was to build the complete management interface for store administrators, live state synchronization, interactive image uploader, and order inspection drawer. All tasks are completed:

- **Phase 11.1 — Admin Shell & Navigation:** Built `AdminLayout.jsx` with mobile-responsive sidebar, quick store link, tab switching (`/admin`), and admin logout.
- **Phase 11.2 — Metrics & Overview:** Real-time KPI cards for revenue, active orders, total products, and homepage featured pieces with recent orders overview.
- **Phase 11.3 — Product Catalog Management & Image Uploader:** Searchable & filterable catalogue table, Add/Edit modal, drag-and-drop file uploader with live thumbnail preview and URL fallback, instant stock availability switch, **Product Archiving & Soft-Hide** (with quick retrieval and storefront isolation), and **Homepage Featured Toggle** syncing directly to Homepage Essentials.
- **Phase 11.4 — Categories & Taxonomies Editor:** Dynamic creation and deletion of store categories with automatic URL slug generation and store synchronization.
- **Phase 11.5 — Dynamic Size Guide Manager:** Centimeter (CM) measurement tables for tops and bottoms with instant save capability.
- **Phase 11.6 — Order & Dispatch Workflow:** Orders table with status selector and detailed Order Inspection Drawer showing customer details, itemized garment breakdown, line subtotals, and printable packing slip/receipt generation.
- **State Synchronization (`ProductContext.jsx`):** Reactive context with `localStorage` persistence connecting Admin, Home, Shop, ProductModal, and SearchModal seamlessly.


### Phase 11.1: Admin Shell & Navigation

- **Task 11.1.1:** Setup dedicated `/admin` routing hierarchy with protected admin layout.
- **Task 11.1.2:** Design administrative sidebar navigation:
  - _Dashboard / Overview_
  - _Products_
  - _Categories & Taxonomies_
  - _Size Guide Editor_
  - _Orders & Dispatch_
- **Task 11.1.3:** Build header bar with quick stats, store view shortcut, and admin logout.

### Phase 11.2: Metrics & Sales Overview

- **Task 11.2.1:** Create metric cards: _Total Revenue_, _Active Orders_, _Products in Stock_, _Average Order Value_.
- **Task 11.2.2:** Build Recent Orders table with customer details and fulfillment badges.
- **Task 11.2.3:** Add Low Stock alert panel flagging items with fewer than 5 units remaining.

### Phase 11.3: Product Catalog Management

- **Task 11.3.1:** Build searchable, filterable product inventory table (thumbnail, SKU, price, stock status, category).
- **Task 11.3.2:** Build "Add / Edit Product" modal form:
  - Title, slug, base price, sale price.
  - Category and subcategory selection.
  - Fabric, care instructions, fit description.
  - Available size toggles (`XS`, `S`, `M`, `L`, `XL`, `XXL`).
  - Color swatches builder (color name + color picker).
  - Stock quantity input and "In Stock" / "Sold Out" switches.
  - **"Featured on Homepage" Toggle:** Flag products to dynamically populate the storefront's **"Featured Essentials"** grid.
  - **Product Archiving & Easy Retrieval:** Ability to soft-hide products without deletion, toggle between All/Active/Archived views in admin, and restore seasonal pieces with one click.
- **Task 11.3.3:** Image uploader preview zone with drag-and-drop support, cover photo selector, and delete buttons.
- **Task 11.3.4:** **Homepage Asset & Link Synchronization:**
  - Connect all homepage category cards and feature links directly to the corresponding filtered collection routes (`/shop?category=...`).
  - Configure the signature Two-Piece Set banner to link directly to the Linen Set or Sets collection.
  - Prepare image slots so that mock homepage images (Hero carousel slides and promotional banners) can be easily swapped with actual brand campaign photos via the admin panel or config.

### Phase 11.4: Categories & Taxonomies Editor

- **Task 11.4.1:** Interface to create, rename, and delete top-level categories (_Tops_, _Bottoms_, _Sets_, _Outerwear_, etc.).
- **Task 11.4.2:** Subcategory tag manager (add/remove subcategories like _Henleys_, _Chinos_, _Shorts_).
- **Task 11.4.3:** Order priority controller to choose display sequence in storefront navigation.

### Phase 11.5: Dynamic Size Guide Manager

- **Task 11.5.1:** Visual measurement grid allowing administrators to click and edit values (Chest, Waist, Hips, Inseam, Shoulder) in both **CM** and **IN**.
- **Task 11.5.2:** Add and configure size charts for specific garment categories.

### Phase 11.6: Order & Dispatch Workflow

- **Task 11.6.1:** Orders table displaying customer name, location, delivery fee, order date, and total amount.
- **Task 11.6.2:** Order Details drawer showing purchased pieces, selected sizes/colors, shipping address, and phone number.
- **Task 11.6.3:** Status transition selector (_Pending Payment_ ➔ _Processing_ ➔ _Shipped_ ➔ _Delivered_ ➔ _Cancelled_).
- **Task 11.6.4:** Print-ready order receipt and dispatch packing slip generation.

---

## Phase 12: Backend Architecture & Database Setup (Current Target)

The objective of Phase 12 is to establish the secure production server runtime, relational database models, and single-owner administration security.

### Confirmed Architectural Decisions:
- **Runtime & Server Framework:** **Node.js** with **Express.js**.
- **Database & ORM:** **PostgreSQL** paired with **Prisma ORM** (type-safe relational modeling, migrations, and academic defense documentation).
- **Authentication & Security:** **JWT (JSON Web Tokens)** + **HTTP-Only Cookies** + **bcryptjs** (password hashing) + **Helmet** (security headers) + **CORS**.
- **Admin Access Model:** **Strict Single-Owner Business Access**.
  - **Zero Public Registration:** No public registration or sign-up endpoint will ever exist for administrators.
  - **Owner Account Seeding:** The single business owner admin account is initialized via private server environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) upon initial database migration/boot.
  - **Role-Based Guards (RBAC):** Middleware intercepts all administrative endpoints and guarantees that only authenticated tokens carrying `role: 'admin'` can access administrative APIs or routes. Normal customer accounts can never escalate privileges.

### Phase 12.1: Server Runtime, Configuration & Security
- **Task 12.1.1:** Initialize the isolated `server/` workspace with `package.json`, Express application, and npm scripts.
- **Task 12.1.2:** Configure environment variable handling (`dotenv`), security headers (`helmet`), request parsing (`express.json`), and cross-origin resource sharing (`cors`).
- **Task 12.1.3:** Build password hashing utility with `bcryptjs` and token signing/verification utilities using `jsonwebtoken`.
- **Task 12.1.4:** Implement Role-Based Access Control middleware (`requireAuth`, `requireAdmin`).
- **Task 12.1.5:** Implement single-owner database seeding script (`prisma/seed.js`) ensuring the owner's credentials exist securely on first boot.
- **Task 12.1.6:** Implement authentication controllers (`POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`).

### Phase 12.2: Relational Database Modeling (Prisma + PostgreSQL)
- **Task 12.2.1:** Initialize Prisma with PostgreSQL datasource (`npx prisma init`).
- **Task 12.2.2:** Define relational models in `schema.prisma`:
  - `User`: Unique email, hashed password, role (`admin` | `customer`), timestamps.
  - `Category`: Unique slug, display name, display order.
  - `Product`: Title, slug, price, description, material, fit, care, featured toggle, in-stock status, category relation.
  - `ProductImage`: Media URL, public ID, primary flag, relation to product.
  - `ProductVariant`: Garment size (`XS` to `XXL`), color name, color hex code, stock quantity.
  - `SizeGuide`: Garment category, measurement values in Centimeters (CM).
  - `Order` & `OrderItem`: Customer contact, shipping address, fulfillment status history, line item pricing, and totals.
- **Task 12.2.3:** Execute initial database migration to generate tables.
- **Task 12.2.4:** Seed the database with PENNY’s complete 20+ piece ready-to-wear catalogue and default CM size guides.
- **Task 12.2.5 [COMPLETED]:** Connect live **Neon Serverless PostgreSQL** database for cross-device synchronization and auto-provisioning (`users`, `orders`, and `bank_config` tables).

---

## Phase 13: Full-Stack Integration & Cloud Media Storage (Completed)

The objective of Phase 13 is to connect the React storefront and Admin dashboard to the live server API, cloud database, and multi-device persistent storage.

### Completed Architectural Implementations:
- **Neon Cloud Database (`cloudDb.js`):** Connection pooling integration directly syncing orders, user accounts, and bank details across all devices.
- **Multi-Device Persistent Storage Fallback:** Server-side atomic JSON persistence (`orders.json`, `products.json`, `categories.json`, `bankDetails.json`, `users.json`) ensures no data loss upon refresh or server restart.
- **Customer Portal & Session Hydration:**
  - Synchronous session hydration in `AuthContext.jsx` preventing accidental redirects or header name reverts to "Login" upon page refresh.
  - Multi-tiered user registry: synchronizes custom customer profile edits (first name, last name, phone, addresses) between browser localStorage (`penny_registered_users`), local file storage (`users.json`), and Neon Cloud PostgreSQL (`users` table).
  - Asynchronous form submission in `SignIn.jsx` and `CreateAccount.jsx` with loading states to eliminate navigation race conditions.
  - Interactive **Order History** tab with real-time status tracking, item thumbnails, size/color breakdown, and delivery addresses.
  - Multi-address management book (add, set default, delete).
  - Password management and permanent **Account Deletion** (Danger Zone).
  - Route protection guards locking `/account/login` and `/account/register` when authenticated.
- **Shopping Cart & Wishlist Persistence:**
  - Synchronous lazy hydration for `CartContext.jsx` (`penny_cart`) and `WishlistContext.jsx` (`penny_wishlist`) ensuring bag contents and saved items survive browser refresh, navigation, and logout/login cycles until explicitly cleared upon checkout completion.

---

## Phase 14: Payment Workflows & Transactional Email Systems (Completed)

The objective of Phase 14 was to automate purchasing, payment identification, and communications.

### Phase 14.1: Direct Bank Transfer & Payment Identification (Completed)
- **Primary Payment Method:** Direct Bank Transfer configured as the primary active payment option (Paystack deactivated temporarily per store requirements).
- **Dynamic Bank Details Management:** Built dedicated **"Bank & Payments"** tab in Admin Dashboard allowing the single-owner admin to update bank name, account name, account number, and payment narration instructions.
- **Payer Discrepancy Identification:** Added `transferAccountName` field to Checkout Step 3, linking the payer's bank account name with the order in Admin Dashboard to resolve name discrepancies.

### Phase 14.2: Transactional Email Notifications (Completed)
- **Nodemailer Integration (`receiptEmail.js`):** Fully configured transactional notification engine for automated receipt generation.
- **Admin Payment Confirmation Trigger:** Dispatches an official, branded luxury digital purchase receipt to the customer's email as soon as the store admin confirms bank transfer receipt in `/admin`.
- **Ethereal & Production SMTP Support:** Automated instant test preview URLs + production support for Gmail App Passwords and custom SMTP (Resend/SendGrid).

### Phase 14.3: Real-Time Order Tracking & Communication (Completed)
- **Navbar Notification Bell & Red Dot:** Stores real-time tracking milestones with a pulsing red dot badge on the navbar for newly received order updates and support replies.
- **Order Notifications & Delivery Tracking Tab:** Real-time 5-stage progress indicator (Placed, Paid, Processing, Shipped, Delivered) on the user's account dashboard with clear/delete options.
- **Contact Us & Customer Support Inquiries:** Front-end Contact Us form sends notifications directly to the admin dashboard; admin can reply directly via email, and customer receives both an email and an in-app response card.
- **Admin Email Preview Modal:** Live in-dashboard preview for customer receipts and inquiry responses before and after dispatching.
- **Official Logo on Receipts:** Official PENNY logo embedded in print utility and digital receipt layouts.
- **Storefront Persistence & Live Customization:** Dynamic Announcement Bar editor, Size Guide editor, Category Manager, and Bank Details manager all synchronize across client and admin in real time and persist on page reload.

---

## Phase 15: Production Deployment & Optimization

The objective of Phase 15 is to publish PENNY live to the web.

### Phase 15.1: Performance & SEO

- **Task 15.1.1:** Add OpenGraph and Twitter meta tags for rich social sharing cards.
- **Task 15.1.2:** Convert assets to modern formats (`.webp`), implement lazy loading, and compress bundle.
- **Task 15.1.3:** Implement a branded 404 "Page Not Found" screen.

### Phase 15.2: Hosting & Continuous Deployment

- **Task 15.2.1:** Deploy frontend to Vercel / Netlify with GitHub CI/CD automation.
- **Task 15.2.2:** Deploy backend and database to cloud infrastructure (Render, Railway, or Supabase).
- **Task 15.2.3:** Configure custom domain name and verify SSL certificate.

---

## Phase 16: Academic Defense & Final Year Project Deliverables

The objective of Phase 16 is to prepare all required academic documentation and presentation materials.

- **Task 16.1:** System Architecture Diagram (Client-Server data flow and component hierarchy).
- **Task 16.2:** Entity-Relationship Diagram (ERD) with relational cardinalities.
- **Task 16.3:** API Documentation (Swagger / Postman collection).
- **Task 16.4:** Test Suite & Results (Unit tests for cart/delivery calculations and end-to-end checkout flow).
- **Task 16.5:** Final Project Report Chapters (Introduction, Literature Review, Methodology, Implementation, Testing, and Conclusion).
- **Task 16.6:** Presentation slide deck and live defense demonstration script.
