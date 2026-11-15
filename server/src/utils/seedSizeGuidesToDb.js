import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pg;

export const defaultSizeGuides = [
  {
    category: 'shirts',
    title: 'Shirts',
    subtitle: 'Oxford Shirts, Linen Tops & Shackets',
    columns: [
      { key: 'size', label: 'Size' },
      { key: 'collar', label: 'Collar (CM)' },
      { key: 'chest', label: 'Chest (CM)' },
      { key: 'sleeve', label: 'Sleeve (CM)' }
    ],
    rows: [
      { size: 'XS', collar: '37', chest: '88 - 93', sleeve: '82' },
      { size: 'S', collar: '38 - 39', chest: '93 - 98', sleeve: '84' },
      { size: 'M', collar: '40 - 41', chest: '98 - 103', sleeve: '86' },
      { size: 'L', collar: '42 - 43', chest: '103 - 108', sleeve: '88' },
      { size: 'XL', collar: '44 - 45', chest: '108 - 113', sleeve: '90' },
      { size: 'XXL', collar: '46 - 47', chest: '113 - 118', sleeve: '92' }
    ]
  },
  {
    category: 'shorts',
    title: 'Shorts',
    subtitle: 'Chino Shorts, Sweatshorts, Utility & Linen Shorts',
    columns: [
      { key: 'size', label: 'Size' },
      { key: 'waist', label: 'Waist (CM)' },
      { key: 'hips', label: 'Hips (CM)' },
      { key: 'inseam', label: 'Inseam (CM)' }
    ],
    rows: [
      { size: 'XS', waist: '71 - 76', hips: '88 - 93', inseam: '16' },
      { size: 'S', waist: '76 - 81', hips: '93 - 98', inseam: '17' },
      { size: 'M', waist: '81 - 86', hips: '98 - 103', inseam: '18' },
      { size: 'L', waist: '86 - 91', hips: '103 - 108', inseam: '19' },
      { size: 'XL', waist: '91 - 96', hips: '108 - 113', inseam: '20' },
      { size: 'XXL', waist: '96 - 101', hips: '113 - 118', inseam: '21' }
    ]
  },
  {
    category: 'trousers',
    title: 'Trousers',
    subtitle: 'Classic Tailored Pants, Chinos, Utility Pants & Sweatpants',
    columns: [
      { key: 'size', label: 'Size' },
      { key: 'waist', label: 'Waist (CM)' },
      { key: 'hips', label: 'Hips (CM)' },
      { key: 'inseam', label: 'Inseam (CM)' }
    ],
    rows: [
      { size: 'XS', waist: '71 - 76', hips: '88 - 93', inseam: '78' },
      { size: 'S', waist: '76 - 81', hips: '93 - 98', inseam: '80' },
      { size: 'M', waist: '81 - 86', hips: '98 - 103', inseam: '81' },
      { size: 'L', waist: '86 - 91', hips: '103 - 108', inseam: '82' },
      { size: 'XL', waist: '91 - 96', hips: '108 - 113', inseam: '83' },
      { size: 'XXL', waist: '96 - 101', hips: '113 - 118', inseam: '84' }
    ]
  }
];

export async function seedSizeGuidesToDb() {
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('postgres')) {
    console.warn('[SEED SIZE GUIDES] No postgres DATABASE_URL found.');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  try {
    console.log('[NEON DB] Connected to seed size guides.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS size_guides (
        category VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255),
        subtitle VARCHAR(255),
        columns JSONB DEFAULT '[]'::jsonb,
        rows JSONB DEFAULT '[]'::jsonb,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    for (const guide of defaultSizeGuides) {
      await client.query(`
        INSERT INTO size_guides (category, title, subtitle, columns, rows, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (category) DO UPDATE SET
          title = EXCLUDED.title,
          subtitle = EXCLUDED.subtitle,
          columns = EXCLUDED.columns,
          rows = EXCLUDED.rows,
          updated_at = CURRENT_TIMESTAMP
      `, [
        guide.category,
        guide.title,
        guide.subtitle,
        JSON.stringify(guide.columns),
        JSON.stringify(guide.rows)
      ]);
      console.log(`[NEON DB] Successfully upserted size guide: ${guide.category}`);
    }

    // Also update server/src/data/storage/sizeGuides.json
    const storagePath = path.resolve(__dirname, '../data/storage/sizeGuides.json');
    fs.writeFileSync(storagePath, JSON.stringify(defaultSizeGuides, null, 2), 'utf-8');
    console.log('[SEED SIZE GUIDES] Updated local sizeGuides.json storage.');

    const res = await client.query('SELECT category, title, subtitle, jsonb_array_length(rows) as row_count, updated_at FROM size_guides');
    console.log('[NEON DB] Current size_guides rows in cloud DB:');
    console.table(res.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedSizeGuidesToDb().catch(err => {
    console.error('Failed to seed size guides:', err);
    process.exit(1);
  });
}
