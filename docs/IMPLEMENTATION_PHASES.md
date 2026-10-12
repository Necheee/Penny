# PENNY — Implementation Phases & Roadmap

This document outlines the structured development phases for **PENNY**, covering the completed frontend work, the imminent **Admin Dashboard**, and subsequent milestones through full backend integration, payment processing, deployment, and final project submission.

---

## High-Level Phase Overview

```
[Phases 1-10: Frontend Storefront]       --> COMPLETED
                 │
                 ▼
[Phase 11: Admin Dashboard UI & Workflows] --> COMPLETED
                 │
                 ▼
[Phase 12: Backend Server & Database Setup] --> CURRENT TARGET
                 │
                 ▼
[Phase 13: Full-Stack Integration & Cloud Media]
                 │
                 ▼
[Phase 14: Payment Gateway & Transactional Emails]
                 │
                 ▼
[Phase 15: Production Deployment & Optimization]
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
- **Phase 11.3 — Product Catalog Management & Image Uploader:** Searchable & filterable catalogue table, Add/Edit modal, drag-and-drop file uploader with live thumbnail preview and URL fallback, instant stock availability switch, and **Homepage Featured Toggle** syncing directly to Homepage Essentials.
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

## Phase 12: Backend Architecture & Database Setup

The objective of Phase 12 is to establish the secure server runtime and persistent database to replace mock datasets.

### Phase 12.1: Server Runtime & Security

- **Task 12.1.1:** Initialize server environment (Node.js/Express or Supabase/PostgreSQL backend).
- **Task 12.1.2:** Configure environment variables, CORS policies, rate limiting, and request validation middleware (Zod).
- **Task 12.1.3:** Implement JWT / Session authentication with bcrypt password hashing.
- **Task 12.1.4:** Establish Role-Based Access Control (`role: 'customer' | 'admin'`).

### Phase 12.2: Relational Database Modeling

- **Task 12.2.1:** Create `Users` and `Addresses` tables.
- **Task 12.2.2:** Create `Categories`, `Subcategories`, and `Products` tables.
- **Task 12.2.3:** Create `ProductVariants` (sizes, colors, inventory counts) and `ProductImages` tables.
- **Task 12.2.4:** Create `SizeGuides` table for dynamic measurements.
- **Task 12.2.5:** Create `Orders` and `OrderItems` tables with status history.
- **Task 12.2.6:** Seed database with PENNY's initial menswear collection.

---

## Phase 13: Full-Stack Integration & Cloud Media Storage

The objective of Phase 13 is to connect the React storefront and Admin dashboard to the live database API.

### Phase 13.1: API Service Layer Refactoring

- **Task 13.1.1:** Replace simulated functions in `client/src/services/api.js` with real `fetch` / `axios` calls.
- **Task 13.1.2:** Implement loading spinners, network error boundaries, and optimistic UI updates.
- **Task 13.1.3:** Connect Storefront filters, categories, search, and product modal to database endpoints.

### Phase 13.2: Cloud Media Upload Service

- **Task 13.2.1:** Integrate Cloudinary, Supabase Storage, or AWS S3 for media uploads.
- **Task 13.2.2:** Connect Admin Product Form to upload images directly to cloud storage and store URLs in the database.
- **Task 13.2.3:** **Single-Point Image Reflection:** Ensure that when an admin uploads actual product photos, the new images instantly reflect across both the storefront collection and the homepage's **"Featured Essentials"** section without requiring manual updates to code or assets.
- **Task 13.2.4:** Replace mock hero carousel slides with an admin-configurable banner media system.

---

## Phase 14: Payment Gateway & Transactional Email Systems

The objective of Phase 14 is to automate end-to-end purchasing and communications.

### Phase 14.1: Paystack Payment Gateway Integration

- **Task 14.1.1:** Configure Paystack API keys (Test Mode).
- **Task 14.1.2:** Trigger Paystack inline checkout popup during checkout Step 3.
- **Task 14.1.3:** Build secure server webhook (`/api/payments/webhook`) listening to `charge.success` to verify real payments.
- **Task 14.1.4:** Update order status to _Paid_ and decrement inventory automatically upon successful payment.

### Phase 14.2: Transactional Email Notifications

- **Task 14.2.1:** Connect email service provider (Resend, SendGrid, or Nodemailer).
- **Task 14.2.2:** Create and send automatic Order Confirmation emails with receipt breakdowns.
- **Task 14.2.3:** Send Shipping / Tracking Notification emails when an order is dispatched in the admin dashboard.

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
