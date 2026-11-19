-- Store immutable purchase-time line item snapshots separately from the order header.
-- Keep the legacy orders.items JSON column during the application transition.

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "payment_status" TEXT NOT NULL DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS "payment_ref" TEXT,
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "subtotal" TYPE NUMERIC(12, 2) USING ROUND(COALESCE("subtotal", 0)::numeric, 2),
  ALTER COLUMN "delivery_fee" TYPE NUMERIC(12, 2) USING ROUND(COALESCE("delivery_fee", 0)::numeric, 2),
  ALTER COLUMN "total" TYPE NUMERIC(12, 2) USING ROUND(COALESCE("total", 0)::numeric, 2);

CREATE UNIQUE INDEX IF NOT EXISTS "orders_reference_key"
  ON "orders" ("reference");

CREATE TABLE IF NOT EXISTS "order_items" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "product_id" TEXT,
  "name" TEXT NOT NULL,
  "size" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "image_url" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unit_price" NUMERIC(12, 2) NOT NULL,

  CONSTRAINT "order_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "order_items_quantity_check" CHECK ("quantity" > 0),
  CONSTRAINT "order_items_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "order_items_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "order_items" (
  "id", "order_id", "product_id", "name", "size", "color", "image_url", "quantity", "unit_price"
)
SELECT
  md5(o."id" || '|' || item.ordinality),
  o."id",
  (
    SELECT p."id"
    FROM "products" p
    WHERE p."id" = NULLIF(COALESCE(item.value->>'productId', item.value->>'id'), '')
    LIMIT 1
  ),
  COALESCE(NULLIF(item.value->>'name', ''), 'Product'),
  COALESCE(NULLIF(item.value->>'size', ''), 'M'),
  COALESCE(NULLIF(item.value->>'color', ''), 'Standard'),
  NULLIF(COALESCE(item.value->>'imageUrl', item.value->>'image'), ''),
  GREATEST(COALESCE((item.value->>'quantity')::integer, 1), 1),
  ROUND(COALESCE((item.value->>'price')::numeric, (item.value->>'unitPrice')::numeric, 0), 2)
FROM "orders" o
CROSS JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof(o."items") = 'array' THEN o."items"
    ELSE '[]'::jsonb
  END
) WITH ORDINALITY AS item(value, ordinality)
ON CONFLICT ("id") DO NOTHING;

CREATE INDEX IF NOT EXISTS "order_items_order_id_idx"
  ON "order_items" ("order_id");
