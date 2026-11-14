import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

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

    // Seed initial categories ONLY if table is currently empty
    const catCountRes = await client.query('SELECT COUNT(*) as count FROM categories');
    const catCount = parseInt(catCountRes.rows[0]?.count || 0, 10);
    if (catCount === 0) {
      const catFile = path.resolve(__dirname, '../data/storage/categories.json');
      if (fs.existsSync(catFile)) {
        const catData = JSON.parse(fs.readFileSync(catFile, 'utf-8'));
        for (const cat of catData) {
          await client.query(`
            INSERT INTO categories (id, name, slug, display_order, subcategories)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO NOTHING
          `, [
            cat.id,
            cat.name,
            cat.slug || cat.id,
            cat.displayOrder || 1,
            JSON.stringify(cat.subcategories || [])
          ]);
        }
        console.log(`[DATABASE] Seeded ${catData.length} categories to Neon Cloud!`);
      }
    }

    // Seed initial products ONLY if table is currently empty
    const prodCountRes = await client.query('SELECT COUNT(*) as count FROM products');
    const prodCount = parseInt(prodCountRes.rows[0]?.count || 0, 10);
    if (prodCount === 0) {
      const prodFile = path.resolve(__dirname, '../data/storage/products.json');
      let prodData = [];
      if (fs.existsSync(prodFile)) {
        prodData = JSON.parse(fs.readFileSync(prodFile, 'utf-8'));
      }
      for (const p of prodData) {
        await client.query(`
          INSERT INTO products (
            id, slug, name, category, subcategory, subtype, price,
            description, material, fit, care, shipping, images,
            colors, available_sizes, featured, in_stock, is_archived, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13,
            $14, $15, $16, $17, $18, CURRENT_TIMESTAMP
          ) ON CONFLICT (id) DO NOTHING
        `, [
          p.id,
          p.slug || p.id,
          p.name,
          p.category || 'tops',
          typeof p.subcategory === 'string' ? p.subcategory : p.subcategory?.name || '',
          p.subtype || '',
          Number(p.price) || 0,
          p.description || '',
          p.material || '',
          p.fit || '',
          p.care || '',
          p.shipping || '',
          JSON.stringify(p.images || { primary: '', gallery: [] }),
          JSON.stringify(p.colors || []),
          JSON.stringify(p.availableSizes || []),
          !!p.featured,
          p.inStock !== false,
          !!p.isArchived
        ]);
      }
      console.log(`[DATABASE] Seeded ${prodData.length} products to Neon Cloud!`);
    }

    client.release();
    return true;
  } catch (err) {
    console.error('[DATABASE] Neon Cloud connection warning:', err.message);
    return false;
  }
}
