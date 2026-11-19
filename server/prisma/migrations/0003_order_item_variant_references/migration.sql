-- Persist the exact variant selected at checkout so inventory can be restored safely.

ALTER TABLE "order_items"
  ADD COLUMN IF NOT EXISTS "variant_id" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'order_items_variant_id_fkey'
  ) THEN
    ALTER TABLE "order_items"
      ADD CONSTRAINT "order_items_variant_id_fkey"
      FOREIGN KEY ("variant_id") REFERENCES "product_variants" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

WITH legacy_variants AS (
  SELECT
    md5(o."id" || '|' || item.ordinality) AS "order_item_id",
    NULLIF(item.value->>'variantId', '') AS "variant_id"
  FROM "orders" o
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(o."items") = 'array' THEN o."items"
      ELSE '[]'::jsonb
    END
  ) WITH ORDINALITY AS item(value, ordinality)
)
UPDATE "order_items" oi
SET "variant_id" = lv."variant_id"
FROM legacy_variants lv
JOIN "product_variants" v ON v."id" = lv."variant_id"
WHERE oi."id" = lv."order_item_id"
  AND oi."variant_id" IS NULL;

CREATE INDEX IF NOT EXISTS "order_items_variant_id_idx"
  ON "order_items" ("variant_id");
