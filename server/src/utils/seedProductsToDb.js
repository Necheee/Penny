import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialProducts } from '../data/initialCatalogue.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pg;

async function setup() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  console.log('[NEON DB] Connected successfully.');

  // 1. Create Products Table
  await client.query(`
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
  `);
  console.log('[NEON DB] Created or verified "products" table.');

  // Merge products from storage and initialCatalogue
  const productsFile = path.resolve(__dirname, '../data/storage/products.json');
  let allList = [];
  if (fs.existsSync(productsFile)) {
    allList = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
  }
  const existingIds = new Set(allList.map(p => p.id));
  initialProducts.forEach(ip => {
    if (!existingIds.has(ip.id)) {
      allList.push(ip);
    }
  });

  console.log('[NEON DB] Syncing all', allList.length, 'products to Neon Cloud DB...');
  for (const p of allList) {
    await client.query(`
      INSERT INTO products (
        id, slug, name, category, subcategory, subtype, price,
        description, material, fit, care, shipping, images,
        colors, available_sizes, featured, in_stock, is_archived, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, CURRENT_TIMESTAMP
      ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        subcategory = EXCLUDED.subcategory,
        subtype = EXCLUDED.subtype,
        price = EXCLUDED.price,
        description = EXCLUDED.description,
        material = EXCLUDED.material,
        fit = EXCLUDED.fit,
        care = EXCLUDED.care,
        shipping = EXCLUDED.shipping,
        images = EXCLUDED.images,
        colors = EXCLUDED.colors,
        available_sizes = EXCLUDED.available_sizes,
        featured = EXCLUDED.featured,
        in_stock = EXCLUDED.in_stock,
        is_archived = EXCLUDED.is_archived,
        updated_at = CURRENT_TIMESTAMP;
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

  const countRes = await client.query('SELECT COUNT(*) FROM products');
  console.log('[NEON DB] Total products in Neon DB now:', countRes.rows[0].count);

  // Write merged list to products.json too
  fs.writeFileSync(productsFile, JSON.stringify(allList, null, 2), 'utf8');

  client.release();
  await pool.end();
  console.log('[NEON DB] Seeding Complete!');
}

setup().catch(err => {
  console.error('[NEON DB] Setup error:', err);
  process.exit(1);
});
