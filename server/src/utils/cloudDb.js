import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

const { Pool } = pg;

export let pool = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  return pool;
}

/**
 * Initializes PostgreSQL schema in Neon Cloud
 */
export async function initCloudDatabase() {
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('postgres')) {
    console.log('[DATABASE] Using local persistent storage (no postgres URL configured).');
    return false;
  }

  try {
    const p = getPool();
    const client = await p.connect();
    console.log('[DATABASE] Successfully connected to Neon PostgreSQL Cloud instance!');

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(50),
        password_hash VARCHAR(255),
        role VARCHAR(50) DEFAULT 'customer',
        addresses JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS cart TEXT DEFAULT '[]';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS seen_notifications TEXT DEFAULT '[]';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS dismissed_notifications TEXT DEFAULT '[]';
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(100) PRIMARY KEY,
        reference VARCHAR(100),
        customer VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        state VARCHAR(100),
        city VARCHAR(100),
        address TEXT,
        shipping_method VARCHAR(50),
        payment_method VARCHAR(50),
        transfer_account_name VARCHAR(255),
        payment_confirmed BOOLEAN DEFAULT false,
        items_count INTEGER DEFAULT 1,
        subtotal NUMERIC,
        delivery_fee NUMERIC,
        total NUMERIC,
        status VARCHAR(50) DEFAULT 'Processing',
        items JSONB DEFAULT '[]'::jsonb,
        paid_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id VARCHAR(100);

      CREATE TABLE IF NOT EXISTS bank_config (
        id INTEGER PRIMARY KEY DEFAULT 1,
        bank_name VARCHAR(100),
        account_name VARCHAR(255),
        account_number VARCHAR(50),
        instructions TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100),
        display_order INTEGER DEFAULT 1,
        subcategories JSONB DEFAULT '[]'::jsonb
      );
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS subcategories JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 1;

      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(100) PRIMARY KEY,
        slug VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        subcategory VARCHAR(100) DEFAULT '',
        subtype VARCHAR(100) DEFAULT '',
        price NUMERIC NOT NULL,
        description TEXT DEFAULT '',
        material TEXT DEFAULT '',
        fit TEXT DEFAULT '',
        care TEXT DEFAULT '',
        shipping TEXT DEFAULT '',
        images JSONB DEFAULT '{"primary": "", "gallery": []}'::jsonb,
        colors JSONB DEFAULT '[]'::jsonb,
        available_sizes JSONB DEFAULT '[]'::jsonb,
        featured BOOLEAN DEFAULT false,
        in_stock BOOLEAN DEFAULT true,
        is_archived BOOLEAN DEFAULT false,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';

      CREATE TABLE IF NOT EXISTS product_images (
        id VARCHAR(100) PRIMARY KEY,
        url TEXT NOT NULL,
        public_id VARCHAR(255),
        is_primary BOOLEAN DEFAULT false,
        product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS product_variants (
        id VARCHAR(100) PRIMARY KEY,
        product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        size VARCHAR(50) NOT NULL,
        color_name VARCHAR(100) NOT NULL,
        color_hex VARCHAR(20),
        stock_quantity INTEGER NOT NULL DEFAULT 10 CHECK (stock_quantity >= 0),
        sku VARCHAR(255) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (product_id, size, color_name)
      );

      CREATE TABLE IF NOT EXISTS inventory_adjustments (
        id VARCHAR(100) PRIMARY KEY,
        variant_id VARCHAR(100) NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
        product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity_delta INTEGER NOT NULL CHECK (quantity_delta <> 0),
        reason VARCHAR(100) NOT NULL,
        reference VARCHAR(255),
        actor_id VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS inventory_adjustments_variant_created_idx
        ON inventory_adjustments (variant_id, created_at);

      CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY DEFAULT 1,
        messages JSONB DEFAULT '[]'::jsonb,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS size_guides (
        category VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255),
        subtitle VARCHAR(255),
        columns JSONB DEFAULT '[]'::jsonb,
        rows JSONB DEFAULT '[]'::jsonb,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS contact_inquiries (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        order_number VARCHAR(100),
        subject VARCHAR(255) DEFAULT 'General Inquiry',
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'inquiry',
        status VARCHAR(50) DEFAULT 'unread',
        reply TEXT,
        replied_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS subject VARCHAR(255) DEFAULT 'General Inquiry';
      ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'inquiry';
    `);

    // Seed existing orders and bank config from local files if empty
    const ordersRes = await client.query('SELECT COUNT(*) FROM orders');
    if (parseInt(ordersRes.rows[0].count) === 0) {
      const ordersFile = path.resolve(__dirname, '../data/storage/orders.json');
      if (fs.existsSync(ordersFile)) {
        const ordersData = JSON.parse(fs.readFileSync(ordersFile, 'utf-8'));
        for (const ord of ordersData) {
          await client.query(`
            INSERT INTO orders (id, reference, customer, email, phone, state, city, address, shipping_method, payment_method, transfer_account_name, payment_confirmed, items_count, subtotal, delivery_fee, total, status, items, paid_at, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
            ON CONFLICT (id) DO NOTHING
          `, [
            ord.id, ord.reference, ord.customer, ord.email, ord.phone, ord.state, ord.city, ord.address,
            ord.shippingMethod, ord.paymentMethod, ord.transferAccountName || '', ord.paymentConfirmed,
            ord.itemsCount, ord.subtotal, ord.deliveryFee, ord.total, ord.status, JSON.stringify(ord.items || []),
            ord.paidAt, ord.createdAt
          ]);
        }
        console.log(`[DATABASE] Seeded ${ordersData.length} existing orders to Neon Cloud!`);
      }
    }

    // Seed bank details
    const bankRes = await client.query('SELECT COUNT(*) FROM bank_config');
    if (parseInt(bankRes.rows[0].count) === 0) {
      const bankFile = path.resolve(__dirname, '../data/storage/bankDetails.json');
      let bankData = {
        bankName: 'Zenith Bank Plc',
        accountName: 'PENNY CLOTHING CO',
        accountNumber: '1018924560',
        instructions: 'Please transfer the exact total amount and use your Order Number as payment reference/narration. Once verified by store admin, your receipt and confirmation will be emailed.'
      };
      if (fs.existsSync(bankFile)) {
        bankData = JSON.parse(fs.readFileSync(bankFile, 'utf-8'));
      }
      await client.query(`
        INSERT INTO bank_config (id, bank_name, account_name, account_number, instructions)
        VALUES (1, $1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING
      `, [bankData.bankName, bankData.accountName, bankData.accountNumber, bankData.instructions]);
      console.log('[DATABASE] Seeded bank details to Neon Cloud!');
    }

    // Seed size guides ONLY if table is currently empty
    const sizeGuideCountRes = await client.query('SELECT COUNT(*) as count FROM size_guides');
    const sizeGuideCount = parseInt(sizeGuideCountRes.rows[0]?.count || 0, 10);
    if (sizeGuideCount === 0) {
      const sgFile = path.resolve(__dirname, '../data/storage/sizeGuides.json');
      let sgData = [];
      if (fs.existsSync(sgFile)) {
        try {
          sgData = JSON.parse(fs.readFileSync(sgFile, 'utf-8'));
        } catch {}
      }
      if (Array.isArray(sgData) && sgData.length > 0) {
        for (const g of sgData) {
          await client.query(`
            INSERT INTO size_guides (category, title, subtitle, columns, rows)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (category) DO NOTHING
          `, [
            g.category,
            g.title,
            g.subtitle,
            JSON.stringify(g.columns || []),
            JSON.stringify(g.rows || [])
          ]);
        }
        console.log(`[DATABASE] Seeded ${sgData.length} size guides to Neon Cloud!`);
      }
    }

    client.release();
    return true;
  } catch (err) {
    console.error('[DATABASE] Neon Cloud connection warning:', err.message);
    return false;
  }
}
