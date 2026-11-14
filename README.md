# PENNY - Minimal Men's Capsule Wardrobe

PENNY is a sleek, modern e-commerce platform designed for a curated collection of men's clothing built around the capsule wardrobe concept. The repository includes both the customer storefront and an owner-exclusive administrative dashboard with live inventory, taxonomy, and order management.

## Technologies
- **Frontend:** React 19, Vite, Tailwind CSS v4, React Router DOM, Framer Motion, Lucide Icons
- **Backend & APIs:** Node.js, Express REST API, Neon Cloud PostgreSQL, Persistent JSON Storage
- **Media & Email:** Cloudinary CDN pipeline, Nodemailer with branded HTML email receipts and live Ethereal testing

## Quick Start

To run the project locally, start both the server and client:

```bash
# 1. Start the backend API server
cd server
npm install
npm run dev
# Server running at http://localhost:5000

# 2. In a separate terminal, start the frontend client
cd client
npm install
npm run dev
# Storefront running at http://localhost:5173
```

## Core Admin Capabilities
- **Product Management & Archiving:** Create, edit, clone, and non-destructively archive products. Archived products are immediately hidden from customer view (Shop, Home, Search) while keeping all imagery, presets, and descriptions safely preserved for easy one-click retrieval anytime.
- **Garment Presets & Accordion Editors:** 1-click auto-fill for descriptions, fabric compositions, care instructions, and sizing tables.
- **Dynamic Taxonomy:** Real-time management of product categories and subcategories.
- **Order Fulfillment & Receipt Generation:** Bank transfer verification, order status progression, and printable receipts.
- **Branded Transactional Emails:** Automated dispatch of HTML customer receipts and support inquiry responses.

## Documentation & Roadmap

- **[Developer Onboarding Guide](docs/ONBOARDING.md)**: Setup instructions, codebase structure, admin testing workflows, and remote device tunneling.
- **[Implementation Phases (Step-by-Step)](docs/IMPLEMENTATION_PHASES.md)**: Breakdown of implemented phases and outstanding production milestones.
- **[Project Roadmap & Architecture Specs](docs/ROADMAP_AND_REMAINING_MODULES.md)**: Technical specifications for the Admin Dashboard, Product Archiving, Backend architecture, Payment Gateways, and Academic Requirements.
- **[Project Overview](docs/PROJECT_OVERVIEW.md)**: Brand ethos, styling foundations, and architectural working rules.

