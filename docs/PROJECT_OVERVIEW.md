# PENNY — Project Documentation

## 1. Project Overview
**PENNY** is a modern men's essentials e-commerce website built around the capsule wardrobe concept. 

The core brand idea is: **"Effortless dressing by design."**

PENNY focuses on modern men's essentials designed to work together naturally. The website's visual language is minimal, refined, masculine, editorial, warm, modern, and understated. The clothing remains the visual focus at all times.

## 2. Technology Stack
- **Frontend Framework:** React (using Vite)
- **Styling:** Tailwind CSS v4 
- **Routing:** React Router
- **State Management:** React Context API (Cart, Wishlist, UI state)
- **Icons:** Lucide React
- **Animations:** Framer Motion (respecting `prefers-reduced-motion`)
- **Forms & Validation:** React Hook Form + Zod
- **Architecture Base:** The entire frontend is isolated inside the `client/` directory to seamlessly integrate with an eventual backend.

## 3. Core Architecture & Working Rules
- **Mobile-First:** Ensure polished tablet and desktop layouts, but prioritize the mobile experience (e.g., side drawers, full-screen product modals, touch-friendly controls).
- **Centralized Data:** Keep product data centralized (currently established in `client/src/data/mockCatalogue.js`) instead of hardcoding product information directly inside UI components.
- **Reusable Components:** Build modular, reusable UI components instead of large, page-specific monoliths.
- **Imagery:** Use actual suitable product photography (to be stored in `client/public/images/`). No generated placeholders or generic colored rectangles. Do not implement product-card hover image swapping.
- **Purchasing Flow:** Customers *cannot* add arbitrary products directly from a grid card. They must open the Product Modal to choose size/color before adding to the bag.
- **No Fake Backends:** Do not build fake backend or payment verification logic. Prepare the exact UI states required for real integrations (e.g., Paystack flow: Order created → Payment Pending → Paystack → Backend verification → Paid).

## 4. Implementation Phases

### Phase 1 — Foundation (Completed)
- Initialize project with React + Vite inside the `client/` folder.
- Establish design tokens (warm off-white, soft beige, deep charcoal), typography (Cormorant Garamond, Inter), and global styling.
- Create responsive foundations and the routing base.
- Define mock data structure and reusable component architecture.

### Phase 2 — Catalogue and Assets (Completed)
- Create a realistic 20–30 product mock catalogue.
- Source and download high-quality, menswear-focused product imagery into the project folder.
- Define products with categories, subcategories, sizes, colors, availability, and featured status (Must include the signature "Linen Two-Piece Set").

### Phase 3 — Global Layout (Completed)
- Implement the Announcement Bar (with free shipping messaging).
- Build Desktop and Mobile Headers, including the mobile navigation drawer.
- Build the Footer and establish responsive layout behaviors across the application.

### Phase 4 — Homepage (Completed)
- Implement the complete editorial homepage: Hero, Brand Intro, Shop by Category, Featured Collection, Capsule Philosophy, Two-Piece Set Feature, and Newsletter signup.

### Phase 5 — Shop (Completed)
- Implement Shop categories (Tops, Bottoms, Sets) and subcategories grids.
- Add the responsive product grid, filters (Size, Color, Price, Availability), sorting, search capabilities, and empty states.

### Phase 6 — Product Experience (Up Next)
- Implement the Product Card and the primary purchasing interface: the Product Modal.
- Build out the gallery, color selection (including a "custom color request" feature), size selection (with disabled states), quantity adjustments, and expandable info sections.

### Phase 7 — Cart and Checkout
- Build Cart drawer and dedicated Cart review page.
- Implement subtotal calculations and free shipping threshold logic (Free shipping unlocks at ₦75,000).
- Build the Checkout interface to collect Customer details, Delivery information, Order Summary, and display Payment UI states.

### Phase 8 — Account and Wishlist
- Build Authentication screens (Sign In, Create Account, Forgot Password).
- Implement Account dashboard (Profile, Orders, Settings).
- Build the authentication-aware Wishlist (showing prompts for guests).

### Phase 9 — Supporting Pages
- Implement editorial and informational pages: About, Contact, Care Guide, Shipping & Returns, Privacy Policy, and Terms.

### Phase 10 — Refinement
- Comprehensive testing across Mobile, Tablet, and Desktop.
- Accessibility audits (Semantic HTML, keyboard navigation, focus management, ARIA labels, color contrast).
- Polish animations, image loading performance, form validation feedback, and overall visual consistency.

### Phase 11 — Backend Preparation
- Final review of mock-data and service boundaries.
- Ensure the frontend architecture guarantees that the eventual backend can replace mock data and simulated state without requiring a major frontend rewrite.
