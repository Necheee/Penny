# PENNY — Developer & User Onboarding Guide

Welcome to **PENNY**, a minimalist men's capsule wardrobe e-commerce platform built with React 19, Vite, Tailwind CSS v4, Node.js, Express, Neon Cloud PostgreSQL, and Nodemailer.

This guide provides everything you need to start, test, and understand the platform in minutes.

---

## 1. Getting the Code from GitHub

### Prerequisites
- **Git** installed on your computer ([Download Git](https://git-scm.com/downloads))
- **Node.js** (v18 or higher recommended) ([Download Node.js](https://nodejs.org/))
- **npm** (included with Node.js)

#### Linux and WSL users

Install and run Node.js inside Linux rather than using a Windows Node.js installation from a WSL terminal. Mixing the two can make `npm` start Windows `cmd.exe`, which cannot resolve Linux/WSL paths and may produce errors such as `UNC paths are not supported` or `Cannot find module 'C:\Windows\src\index.js'`.

The recommended approach is [`nvm`](https://github.com/nvm-sh/nvm):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 22
nvm alias default 22
nvm use 22
```

Verify that both commands resolve to Linux paths:

```bash
command -v node
command -v npm
node --version
npm --version
```

The `node` and `npm` paths should begin with `~/.nvm/versions/node/`, not `/mnt/c/Program Files/nodejs/`.

---

### Step 1: Clone or Pull the Repository

#### Option A: First-Time Setup (Clone from GitHub)
If you are setting up the project on your computer for the first time:
```bash
# 1. Clone the repository
git clone https://github.com/Necheee/Penny.git

# 2. Move into the project directory
cd Penny
```

#### Option B: Updating Existing Code (Pull Latest Changes)
If you already cloned the repository previously and want the latest commits:
```bash
# 1. Ensure you are on the main branch
git checkout main

# 2. Pull the newest updates from GitHub
git pull origin main
```
> [!TIP]
> If you have local uncommitted changes that prevent pulling, run `git stash`, then `git pull origin main`, then `git stash pop`.

---

### Step 2: Install Dependencies
Open two terminal windows (one for the backend server, one for the frontend client):

```bash
# Terminal 1: Backend
cd server
npm install

# Terminal 2: Frontend
cd client
npm install
```

---

### Step 3: Configure Environment Variables
Inside `server/`, create or verify your `.env` file (you can copy the provided `server/.env.example`):

```bash
PORT=5000
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=owner@penny.com
ADMIN_PASSWORD=your_secure_password_here
ADMIN_NAME="PENNY Owner"
```
*(If no external PostgreSQL `DATABASE_URL` or Gmail SMTP credentials are provided, PENNY automatically falls back to persistent local JSON storage and live Ethereal test inbox preview URLs without crashing).*

---

### Step 4: Start the Development Servers
```bash
# In Terminal 1 (Backend):
cd server
npm run dev
# Running on http://localhost:5000

# In Terminal 2 (Frontend):
cd client
npm run dev
# Running on http://localhost:5173
```

Open your browser to `http://localhost:5173` to explore the storefront!

---

## 2. Default Access & Accounts

| Role | URL | Email | Password | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Storefront Customer** | `/account/login` | *Register any email* | *Your password* | Full cart, wishlist, orders, and real-time notifications |
| **Store Administrator** | `/admin/login` | `owner@penny.com` | Set in `server/.env` | Single-owner secured management dashboard |

---

## 3. Key Features & How to Test Them

### A. Storefront & Shopping Flow
1. Browse products on `/shop`.
2. Filter by category or search instantly using the search icon (`SearchModal`).
3. Click any product to view garment details or click **Size Guide** to view the live measurement chart.
4. Add items to bag and open the sliding cart drawer (`CartDrawer`).
5. Proceed to **Checkout** (`/checkout`).

### B. Order Placement & Bank Transfer
1. At checkout, fill in the shipping address and select **Direct Bank Transfer**.
2. Click **Complete Order**. You will receive an official **Order Number** (e.g. `#PNY-892140`).
3. The order details, bank account narration, and transfer instructions will display on screen.
4. Click **Print Official Receipt** to open the branded printable receipt featuring the PENNY logo.

### C. Real-Time Navbar Notifications & Red Dot
1. Look at the top navigation bar: notice the **Bell notification icon**.
2. Whenever an order is placed, or when the store admin updates the order's status (e.g., from *Awaiting Payment* to *Processing*, *Shipped*, or *Delivered*), a **pulsing red dot** lights up on the navbar bell icon.
3. Clicking the bell icon takes the customer directly to **Order Notifications & Tracking** (`/account?tab=notifications`).
4. Viewing the notifications automatically marks them as seen, clearing the red dot.
5. Customers can also **Dismiss / Delete** individual notifications or order records from their history.

### D. Admin Dashboard (`/admin`)
Log in at `/admin/login` with your admin credentials to access:
- **Overview:** High-level metrics (revenue, active orders, total products breakdown showing active vs. archived counts) and recent transactions.
- **Catalogue & Inventory (with Product Archiving):**
  - Add new products, edit descriptions, adjust pricing, and upload images.
  - **Archive / Soft-Hide Products:** Archive any product with one click using the archive icon button in the table or the archive checkbox inside the Add/Edit modal.
  - **Storefront Isolation:** Archived products are instantly hidden from the live website (Shop collection, Homepage essentials, and Search modal) without losing any photos, descriptions, or presets.
  - **Status Filter:** Switch between **All**, **Active**, and **Archived** views to easily manage current versus seasonal/inactive inventory.
  - **1-Click Retrieval & Restore:** Click the restore icon on any archived piece to instantly unarchive and reactivate it on the storefront.
- **Categories Manager:** Add or delete garment categories. Changes persist across page reloads and instantly sync with the storefront navigation.
- **Announcement Bar Editor:** Edit the top announcement banner text and link in real time.
- **Size Guide Editor:** Edit sizing headings, garment descriptions, and measurement tables.
- **Bank Transfer Settings:** Customize the store's bank name, account number, and beneficiary name for customer transfers.
- **Order Fulfillment:**
  - Inspect any customer order.
  - Confirm received bank transfers with one click.
  - Update delivery status (*Processing*, *Shipped*, *Delivered*).
  - Print packing slips / official receipts.
  - **Preview Email Receipt:** Admins can preview the branded digital receipt email sent to the customer before or after confirming payment.
- **Messages & Inquiries:**
  - Review messages submitted via the storefront **Contact Us** page.
  - Click **Reply via Email** to compose a response.
  - Switch to **Live Email Preview** to see the branded email layout before dispatching.
  - Access live **Ethereal Inbox** links to view sent emails in a browser.

### E. Customer Support Contact Flow
1. Visit `/contact` on the storefront.
2. Fill out the contact form with an inquiry (and optional order number).
3. The inquiry is delivered instantly to the admin dashboard (`/admin?tab=messages`).
4. The admin replies; an email is dispatched to the customer, and the reply appears in the customer's account portal (`/account?tab=inquiries`).

---

## 4. Mobile & Remote Testing with ngrok

To test the application on a mobile phone or share it with reviewers outside your local WiFi:

1. **Tunnel the Frontend:**
   ```bash
   ngrok http 5173
   ```
   Copy the generated URL (e.g. `https://your-frontend.ngrok-free.dev`).

2. **Tunnel the Backend:**
   ```bash
   ngrok http 5000
   ```
   Copy the generated URL (e.g. `https://your-backend.ngrok-free.dev`).

3. **Update Frontend API Target:**
   In `client/vite.config.js`, set the proxy target to your backend ngrok URL:
   ```javascript
   server: {
     proxy: {
       '/api': {
         target: 'https://your-backend.ngrok-free.dev',
         changeOrigin: true,
       }
     }
   }
   ```
   Now open your frontend ngrok URL on any mobile device or tablet!

---

## 5. Project Directory Structure

```text
Penny/
├── client/                     # Frontend (React 19 + Vite + Tailwind CSS)
│   ├── public/                 # Static assets (logo.png, etc.)
│   └── src/
│       ├── components/
│       │   ├── admin/          # AdminLayout, AdminProtectedRoute
│       │   ├── cart/           # CartDrawer
│       │   ├── layout/         # Header (with Notification Bell), Footer, AnnouncementBar
│       │   └── shop/           # ProductCard, SearchModal, SizeGuideModal
│       ├── context/            # AuthContext, CartContext, ProductContext, WishlistContext, NotificationContext
│       ├── pages/              # Home, Shop, Account, Checkout, Contact, AdminDashboard, AdminLogin, etc.
│       └── utils/              # printReceipt.js, emailPreviewGenerator.js
│
├── server/                     # Backend (Node.js + Express REST API)
│   ├── src/
│   │   ├── data/storage/       # Persistent JSON fallbacks (orders.json, inquiries.json, users.json, etc.)
│   │   ├── routes/             # auth.js, categories.js, payments.js, contact.js
│   │   └── utils/              # cloudDb.js (Neon PostgreSQL), persistentStorage.js, receiptEmail.js
│   ├── .env                    # Active server environment variables
│   └── .env.example            # Example configuration template
│
└── docs/                       # Project documentation
    ├── IMPLEMENTATION_PHASES.md# Detailed project development roadmap
    └── ONBOARDING.md           # This onboarding guide
```

---

## 6. Common Troubleshooting

- **Categories or products disappear on page refresh?**  
  Make sure the backend server (`server/`) is running on port 5000. The frontend communicates with the backend to persist all product and category modifications.
- **Where are test emails sent?**  
  If you have not set Gmail or custom SMTP in `server/.env`, PENNY uses **Ethereal Mail**. When an email or reply is dispatched, look at the terminal output or the Admin Dashboard for a link starting with `https://ethereal.email/message/...` to view the exact rendered email online.
- **Port 5000 or 5173 is already in use?**  
  Close any other running node processes, or edit `PORT` in `server/.env` and adjust the proxy in `client/vite.config.js`.
- **`sh: 1: vite: Permission denied` on Linux or WSL?**
  The Vite launcher in `client/node_modules/.bin` is not executable. From the `client/` directory, run `chmod +x node_modules/.bin/vite node_modules/vite/bin/vite.js`, then run `npm run dev` again. If the problem returns after reinstalling dependencies, confirm that you are using Linux-native `node` and `npm` rather than the Windows installation.

---

You are now fully set up to develop, test, or demonstrate the PENNY capsule platform!
