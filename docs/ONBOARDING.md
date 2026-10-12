# Developer Onboarding Guide

Welcome to PENNY! This guide will help you get familiar with the project, set it up locally, and understand how to start contributing.

## 1. Project Overview

PENNY is a minimal men's capsule wardrobe e-commerce platform. The project features a complete storefront and administrative dashboard, currently backed by a client-side reactive state engine (`ProductContext` + `localStorage`). Full-stack backend integration with PostgreSQL, Prisma, and Cloudinary is underway in Phase 12.

**Current Development Status:**
- **Storefront (Phases 1–10):** Fully implemented with responsive product catalogues, filtering, bag drawer, size guides, and checkout flows.
- **Admin Dashboard (Phase 11):** Fully implemented at `/admin` with live state synchronization, drag-and-drop image uploader, category manager, size guide editor, and order fulfillment drawer.
- **Backend & Database (Phase 12 — Current Target):** Node.js/Express REST API, PostgreSQL database with Prisma ORM, and Cloudinary media storage.

## 2. Technology Stack

### Frontend:
- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Routing:** [React Router DOM](https://reactrouter.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **State Management:** React Context API with LocalStorage caching
- **Linting:** [oxlint](https://oxc-project.github.io/docs/guide/usage/linter.html)

### Backend & Database (Phase 12+):
- **Server Runtime:** [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (hosted on Neon or Render)
- **ORM:** [Prisma](https://www.prisma.io/) (type-safe relational modeling & migrations)
- **Media CDN:** [Cloudinary](https://cloudinary.com/) (automated image optimization & responsive delivery)
- **Authentication:** JWT (JSON Web Tokens), HTTP-Only Cookies, and `bcryptjs` password hashing
- **Security:** Helmet headers, CORS policies, and strictly private single-owner administrative access

## 3. Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` (comes with Node.js)

### Setup & Run
1. Clone the repository and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

*Note: No environment variables or additional configuration are required to run the application currently.*

## 4. Project Structure

All application code is located in the `client/` directory. Here is the breakdown:

- `client/public/`: Static assets (e.g., product images).
- `client/src/`: Main source code.
  - `assets/`: Global CSS and other assets.
  - `components/`: Reusable React components, organized by domain:
    - `admin/`: Administrative components (AdminLayout, Sidebar, Navigation).
    - `cart/`: Cart-related components (CartDrawer, etc.).
    - `layout/`: Main storefront layout components (Navbar, Footer, etc.).
    - `shop/`: Shop-related components (ProductCard, SearchModal, ProductModal, SizeGuideModal).
    - `ui/`: Generic, reusable UI elements (Buttons, Inputs, etc.).
  - `context/`: React Context providers for global state (CartContext, WishlistContext, AuthContext, ModalContext).
  - `data/`: Mock data used by the simulated API (`mockCatalogue.js`).
  - `hooks/`: Custom React hooks.
  - `pages/`: Page-level components corresponding to routes (Home, Shop, Product Details, Checkout, etc.).
  - `services/`: Simulated API service (`api.js`) that handles asynchronous data fetching.
  - `utils/`: Helper functions.

## 5. How the Project Works

- **State Management:** The application uses React Context to manage global state. For example, `CartContext` handles adding/removing items from the cart, while `AuthContext` manages the simulated user login state.
- **Data Flow:** When a component needs data (like the shop page fetching products), it calls a function from `services/api.js`. Currently, `api.js` returns data from `data/mockCatalogue.js` after a simulated delay to mimic a real network request.
- **Navigation:** `react-router-dom` is used for client-side routing. The main routes are defined in the root component, rendering the appropriate page component.

## 6. Development Guide

- **Adding a Component:** Create new components in the appropriate subfolder inside `client/src/components/`. If it's a generic UI element, put it in `ui/`.
- **Styling:** Use Tailwind CSS utility classes directly in your JSX. Avoid writing custom CSS unless absolutely necessary.
- **Linting:** Run `npm run lint` inside the `client` directory to check for code style issues using `oxlint`. Fix any warnings before committing.
- **Committing:** Keep commits small and focused. Use descriptive commit messages.

## 7. Troubleshooting

- **Server won't start:** Ensure you are inside the `client` directory when running `npm run dev`.
- **Changes not reflecting:** Vite's Hot Module Replacement (HMR) is usually fast, but if it gets stuck, restart the development server.
- **Package installation errors:** Try clearing your npm cache (`npm cache clean --force`) or deleting `node_modules` and `package-lock.json` and running `npm install` again.

## 8. Quick Checklist

Before you start your first task, make sure you can answer 'Yes' to these questions:
- [ ] Have I navigated into the `client` folder?
- [ ] Have I run `npm install` without errors?
- [ ] Can I start the development server with `npm run dev`?
- [ ] Does the application load successfully at `http://localhost:5173`?

You are now ready to contribute to PENNY!

