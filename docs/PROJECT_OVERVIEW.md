# PENNY — Project Documentation

## 1. Project Overview
**PENNY** is a modern men's essentials e-commerce website built around the capsule wardrobe concept. 

The core brand idea is: **"Effortless dressing by design."**

PENNY focuses on modern men's essentials designed to work together naturally. The website's visual language is minimal, refined, masculine, editorial, warm, modern, and understated. The clothing remains the visual focus at all times.

## 2. Technology Stack
- **Frontend Framework:** React 19 (using Vite)
- **Styling:** Tailwind CSS v4 
- **Routing:** React Router DOM (with clean auth aliases `/signin`, `/login`, `/create-account`, `/register`)
- **State Management:** React Context API (Cart, Wishlist, Auth, Products, Notifications, Dialog, Modal)
- **Icons:** Lucide React
- **Animations:** Framer Motion (respecting `prefers-reduced-motion`)
- **Backend Runtime:** Node.js with Express.js REST API
- **Database:** Neon Serverless PostgreSQL with connection pooling (`pg`) and Prisma ORM migrations
- **Media Asset Storage:** Cloudflare R2 (S3-compatible object storage with global CDN delivery)
- **Email & Communications:** Nodemailer with automated luxury HTML receipts and Ethereal preview testing

## 3. Core Architecture & Working Rules
- **Mobile-First:** Ensure polished tablet and desktop layouts, but prioritize the mobile experience (e.g., side drawers, full-screen product modals, touch-friendly controls).
- **Centralized Data:** Keep product data centralized and synchronized directly with the Neon PostgreSQL database via connection pooling.
- **Reusable Components:** Build modular, reusable UI components instead of large, page-specific monoliths.
- **Imagery:** High-resolution menswear photography served via Cloudflare R2 CDN. No generated placeholders or generic colored rectangles. Multi-image management UI allows individual photo deletion and cover selection.
- **Purchasing Flow:** Customers select their size and color in the Product Modal with live stock indicators and 60+ fashion color swatches before adding to the bag.
- **Product Lifecycle & Non-Destructive Archiving:** Store administrators can archive products to soft-hide them from the live storefront without deleting them. Archived pieces retain all their images, colorways, and pricing data, allowing effortless seasonal retrieval and one-click reactivation.
- **Authoritative Server Pricing:** Order totals and shipping fees are calculated server-side from PostgreSQL records to prevent client-side price manipulation.
- **Direct Bank Transfer Verification:** Primary active checkout flow uses direct bank transfer; orders are marked pending until verified by the admin in `/admin`, which automatically dispatches an official receipt.

## 4. Implementation Phases

### Phase 1 — Foundation (Completed)
- Initialize project with React + Vite inside the `client/` folder.
- Establish design tokens (warm off-white, soft beige, deep charcoal), typography (Cormorant Garamond, Inter), and global styling.
- Create responsive foundations and routing base.
- Define data structure and reusable component architecture.

### Phase 2 — Catalogue and Assets (Completed)
- Source and integrate high-quality menswear product imagery.
- Define products with categories, subcategories, sizes, colors, availability, and featured status (including signature linen pieces).

### Phase 3 — Global Layout (Completed)
- Implement Announcement Bar (with free shipping messaging on orders $\ge$ ₦200,000).
- Build Desktop and Mobile Headers, including the mobile navigation drawer.
- Build Footer and establish responsive layout behaviors across the application.

### Phase 4 — Homepage (Completed)
- Implement complete editorial homepage: Hero, Brand Intro, Shop by Category, Featured Collection, Capsule Philosophy, and Newsletter signup.

### Phase 5 — Shop (Completed)
- Implement Shop categories (Tops, Bottoms, Sets, etc.) and subcategory filters.
- Add responsive product grid, filters (Size, Color, Price, Availability), sorting, and search capabilities.

### Phase 6 — Product Experience (Completed)
- Implement Product Card and primary purchasing interface: Product Modal.
- Build gallery, color selection (with custom color request feature and 60+ swatches), size selection, and quantity adjustments.

### Phase 7 — Cart and Checkout (Completed)
- Build Cart drawer and dedicated Cart review page.
- Implement subtotal calculations and free shipping threshold logic (Free shipping unlocks at ₦200,000).
- Build multi-step Checkout interface to collect Customer details, Delivery information (Lagos vs. nationwide), Order Summary, and Direct Bank Transfer details.

### Phase 8 — Account and Wishlist (Completed)
- Build Authentication screens (Sign In, Create Account, Forgot Password).
- Implement Account dashboard (Profile, Address Book, Order History, Notifications, Messages).
- Build authentication-aware Wishlist.

### Phase 9 — Supporting Pages (Completed)
- Implement editorial and informational pages: About, Contact, Care Guide, Shipping & Returns, Privacy Policy, and Terms.

### Phase 10 — Storefront Polish (Completed)
- Interactive Size Guide modal with CM measurement tables.
- Global Search modal, brand logo integration, and accessibility refinements.

### Phase 11 — Admin Dashboard (Completed)
- Complete management interface: Overview KPIs, Product Catalogue table, Categories manager, Size Guide editor, and Orders feed.

### Phase 12 & 13 — Backend & Cloud Database (Completed)
- Express server runtime, Neon PostgreSQL integration, JWT authentication with RBAC (`requireAuth`, `requireAdmin`), and multi-device persistence.

### Phase 14 — Payment Workflows & Emails (Completed)
- Direct Bank Transfer workflow, admin payment confirmation trigger, Nodemailer transactional email receipts, and real-time navbar notification bell.

### Phase 15 — Pre-Upload Audit, Security & Scaling Hardening (Completed)
- **Phase 1:** BigInt cart crash fixed; atomic UUID product creation; non-destructive variant upsert; Multi-Image Manager with individual delete and cover selection; R2 public URL validation.
- **Phase 2:** Unsigned JWT bypass removed; order dumps/deletions/replies locked behind admin auth; customer data scoping; guest account takeover prevented; authoritative server-side price recalculation from PostgreSQL.
- **Phase 3:** Storefront draft/archive isolation; server-side pagination; persistent variant stock toggles; removal of runtime DDL statements; route aliases; 60+ fashion color swatches.
