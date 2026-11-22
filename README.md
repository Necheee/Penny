# PENNY - Minimal Men's Capsule Wardrobe

PENNY is a sleek, modern e-commerce platform designed for a curated collection of men's clothing built around the capsule wardrobe concept. The repository includes both the customer storefront and an owner-exclusive administrative dashboard with live inventory, taxonomy, and order management.

## Technologies
- **Frontend:** React 19, Vite, Tailwind CSS v4, React Router DOM, Framer Motion, Lucide Icons
- **Backend & APIs:** Node.js, Express REST API, Neon Cloud PostgreSQL, Connection Pooling (`pg`), Prisma ORM migrations
- **Media & Storage:** Cloudflare R2 object storage with global CDN delivery, pre-upload payload validation, and Multer limits
- **Email & Communications:** Nodemailer with automated branded luxury HTML receipts, inquiry replies, and live Ethereal testing
- **Security:** Strict signed JWT sessions, bcryptjs password hashing, RBAC middleware (`requireAuth`, `requireAdmin`), and authoritative server-side price recalculation

## Quick Start

For complete setup instructions, including backend configuration and Linux/WSL guidance, see the **[Developer Onboarding Guide](docs/ONBOARDING.md)**.

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

## Core Capabilities
- **Product Management & Archiving:** Create, edit, clone, and non-destructively archive products with atomic transactions and cryptographic UUIDs. Archived products are immediately hidden from customer view while keeping all imagery and variants safely preserved for easy one-click retrieval.
- **Multi-Image Manager:** Drag-and-drop file uploader, individual image deletion (down to 1 photo), cover image selector, and upload-in-progress protections.
- **Direct Bank Transfer Fulfillment:** Admin reviews incoming orders with payer bank account names, verifies transfers, and clicks **Confirm Payment** to trigger automated receipt generation.
- **Authoritative Database Pricing:** Server-side price and delivery fee recalculation from PostgreSQL prevents client-side price tampering.
- **Dynamic Taxonomy & Size Guides:** Real-time management of product categories and dynamic CM size guides for shirts, shorts, and trousers.
- **Customer Account Portal:** Authenticated profile, multi-address book, 5-stage order tracking, notifications state, and custom support inquiries.

## Documentation & Roadmap

- **[Pre-Upload Audit & Security Report](docs/PRE_UPLOAD_AUDIT_AND_SECURITY_REPORT.md)**: Full verification report resolving all 15 audit concerns across catalog data integrity, application security, and operational scaling.
- **[Developer Onboarding Guide](docs/ONBOARDING.md)**: Setup instructions, codebase structure, admin testing workflows, and remote device tunneling.
- **[Implementation Phases (Step-by-Step)](docs/IMPLEMENTATION_PHASES.md)**: Breakdown of implemented phases (Phases 1–15) and remaining production milestones.
- **[Project Roadmap & Architecture Specs](docs/ROADMAP_AND_REMAINING_MODULES.md)**: Technical specifications for the Admin Dashboard, Product Archiving, Backend architecture, Payment Gateways, and Academic Requirements.
- **[Project Overview](docs/PROJECT_OVERVIEW.md)**: Brand ethos, styling foundations, and architectural working rules.
