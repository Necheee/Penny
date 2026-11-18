-- Add the Prisma catalogue contract without replacing the existing catalogue tables.
-- Existing product/category rows remain intact and can be migrated into variants incrementally.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductStatus') THEN
    CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
  END IF;
END
$$;

ALTER TABLE "categories"
  ADD COLUMN IF NOT EXISTS "subcategories" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT';

ALTER TABLE "products"
  ALTER COLUMN "status" TYPE "ProductStatus"
  USING upper(COALESCE("status", 'DRAFT')::text)::"ProductStatus",
  ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"ProductStatus",
  ALTER COLUMN "status" SET NOT NULL;

UPDATE "products"
SET "status" = CASE
  WHEN "is_archived" = true THEN 'ARCHIVED'::"ProductStatus"
  ELSE 'ACTIVE'::"ProductStatus"
END
WHERE "status" = 'DRAFT'::"ProductStatus";

CREATE TABLE IF NOT EXISTS "product_images" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "public_id" TEXT,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "product_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "product_variants" (
  "id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "size" TEXT NOT NULL,
  "color_name" TEXT NOT NULL,
  "color_hex" TEXT,
  "stock_quantity" INTEGER NOT NULL DEFAULT 10,
  "sku" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "inventory_adjustments" (
  "id" TEXT NOT NULL,
  "variant_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "quantity_delta" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "reference" TEXT,
  "actor_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "inventory_adjustments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "inventory_adjustments_quantity_delta_check" CHECK ("quantity_delta" <> 0)
);

INSERT INTO "product_variants" (
  "id", "product_id", "size", "color_name", "stock_quantity"
)
SELECT
  md5(p."id" || '|' || sizes.value || '|' || colors.value),
  p."id",
  sizes.value,
  colors.value,
  10
FROM "products" p
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE WHEN jsonb_typeof(p."available_sizes") = 'array'
    THEN p."available_sizes"
    ELSE '[]'::jsonb
  END
) AS sizes(value)
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE WHEN jsonb_typeof(p."colors") = 'array'
    THEN p."colors"
    ELSE '[]'::jsonb
  END
) AS colors(value)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "product_images" (
  "id", "url", "is_primary", "product_id"
)
SELECT
  md5(p."id" || '|primary|' || (p."images"->>'primary')),
  p."images"->>'primary',
  true,
  p."id"
FROM "products" p
WHERE jsonb_typeof(p."images") = 'object'
  AND COALESCE(p."images"->>'primary', '') <> ''
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "product_images" (
  "id", "url", "is_primary", "product_id"
)
SELECT
  md5(p."id" || '|gallery|' || gallery.value || '|' || gallery.ordinality),
  gallery.value,
  false,
  p."id"
FROM "products" p
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE WHEN jsonb_typeof(p."images"->'gallery') = 'array'
    THEN p."images"->'gallery'
    ELSE '[]'::jsonb
  END
) WITH ORDINALITY AS gallery(value, ordinality)
WHERE gallery.value <> ''
ON CONFLICT ("id") DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_sku_key"
  ON "product_variants" ("sku");

CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_product_id_size_color_name_key"
  ON "product_variants" ("product_id", "size", "color_name");

CREATE INDEX IF NOT EXISTS "inventory_adjustments_variant_id_created_at_idx"
  ON "inventory_adjustments" ("variant_id", "created_at");

ALTER TABLE "product_images"
  DROP CONSTRAINT IF EXISTS "product_images_product_id_fkey";

ALTER TABLE "product_images"
  ADD CONSTRAINT "product_images_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_variants"
  DROP CONSTRAINT IF EXISTS "product_variants_product_id_fkey";

ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inventory_adjustments"
  DROP CONSTRAINT IF EXISTS "inventory_adjustments_variant_id_fkey";

ALTER TABLE "inventory_adjustments"
  ADD CONSTRAINT "inventory_adjustments_variant_id_fkey"
  FOREIGN KEY ("variant_id") REFERENCES "product_variants" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inventory_adjustments"
  DROP CONSTRAINT IF EXISTS "inventory_adjustments_product_id_fkey";

ALTER TABLE "inventory_adjustments"
  ADD CONSTRAINT "inventory_adjustments_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "user_id" TEXT;
