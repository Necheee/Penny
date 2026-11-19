import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { formatProductRow, validateInventoryAdjustmentInput } from '../src/routes/products.js';
import { mapDbOrder, validateOrderItem } from '../src/routes/payments.js';
import { requireAdmin, requireAuth } from '../src/middleware/auth.js';
import { generateToken } from '../src/utils/token.js';
import { minorUnitsToDecimal, toMinorUnits } from '../src/utils/money.js';

const paymentsSource = await readFile(
  fileURLToPath(new URL('../src/routes/payments.js', import.meta.url)),
  'utf8',
);

function responseDouble() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('currency values use exact minor-unit arithmetic', () => {
  assert.equal(toMinorUnits('92000.005'), 9200001n);
  assert.equal(toMinorUnits('5000'), 500000n);
  assert.equal(
    minorUnitsToDecimal(toMinorUnits('92000.005') + toMinorUnits('5000')),
    '97000.01',
  );
});

test('relational product data remains authoritative, including empty relations', () => {
  const product = formatProductRow({
    id: 'p-1',
    name: 'Test Product',
    category: 'tops',
    images: { primary: 'legacy.jpg', gallery: ['legacy-gallery.jpg'] },
    colors: ['Legacy'],
    available_sizes: ['XL'],
    in_stock: true,
    status: 'ACTIVE',
  }, { images: [], variants: [] });

  assert.deepEqual(product.images, { primary: '', gallery: [] });
  assert.deepEqual(product.colors, []);
  assert.deepEqual(product.availableSizes, []);
  assert.equal(product.inStock, false);
});

test('inventory adjustments require a non-zero integer and reason', () => {
  assert.deepEqual(
    validateInventoryAdjustmentInput({ quantityDelta: '3', reason: ' Restock ' }),
    { quantityDelta: 3, reason: 'Restock' },
  );
  assert.equal(
    validateInventoryAdjustmentInput({ quantityDelta: 0, reason: 'Restock' }).error,
    'A non-zero integer quantityDelta and adjustment reason are required.',
  );
  assert.equal(
    validateInventoryAdjustmentInput({ quantityDelta: 1, reason: ' ' }).error,
    'A non-zero integer quantityDelta and adjustment reason are required.',
  );
});

test('checkout items require a product, selected variant, and positive quantity', () => {
  assert.equal(validateOrderItem({
    productId: 'p-1',
    size: 'M',
    color: 'Black',
    quantity: 1,
  }), null);
  assert.match(
    validateOrderItem({ productId: 'p-1', size: 'M', color: 'Black', quantity: 0 }),
    /positive quantity/,
  );
  assert.match(
    validateOrderItem({ productId: 'p-1', size: 'M', quantity: 1 }),
    /size, color/,
  );
});

test('database orders preserve relational immutable item snapshots', () => {
  const order = mapDbOrder({
    id: 'PNY-1',
    reference: 'paystack-1',
    customer: 'Customer',
    email: 'customer@example.com',
    subtotal: '100.00',
    delivery_fee: '5.00',
    total: '105.00',
    payment_confirmed: true,
    order_items: [{
      id: 'item-1',
      product_id: 'p-1',
      name: 'Snapshot Product',
      size: 'M',
      color: 'Black',
      image_url: 'snapshot.jpg',
      quantity: 2,
      unit_price: '50.00',
    }],
  });

  assert.deepEqual(order.items[0], {
    id: 'item-1',
    productId: 'p-1',
    name: 'Snapshot Product',
    size: 'M',
    color: 'Black',
    price: 50,
    quantity: 2,
    image: 'snapshot.jpg',
  });
  assert.equal(order.total, 105);
});

test('checkout transaction retains concurrency, rollback, and duplicate-payment safeguards', () => {
  assert.match(paymentsSource, /pg_advisory_xact_lock\(hashtext\(\$1\)\)/);
  assert.match(paymentsSource, /FROM product_variants[\s\S]+FOR UPDATE/);
  assert.match(paymentsSource, /stock_quantity\) < quantity/);
  assert.match(paymentsSource, /await client\.query\('ROLLBACK'\)/);
  assert.match(paymentsSource, /statusCode: 409/);
  assert.match(paymentsSource, /WHERE id = \$1 OR reference = \$2/);
  assert.match(paymentsSource, /Order was already registered\./);
});

test('admin middleware rejects unauthenticated and non-admin requests', () => {
  const unauthenticated = responseDouble();
  requireAuth({ headers: {} }, unauthenticated, () => {
    assert.fail('unauthenticated request should not continue');
  });
  assert.equal(unauthenticated.statusCode, 401);

  const nonAdmin = responseDouble();
  requireAdmin({ user: { id: 'user-1', role: 'customer' } }, nonAdmin, () => {
    assert.fail('customer request should not continue');
  });
  assert.equal(nonAdmin.statusCode, 403);

  const admin = responseDouble();
  let continued = false;
  requireAdmin({ user: { id: 'admin-1', role: 'admin' } }, admin, () => {
    continued = true;
  });
  assert.equal(continued, true);
});

test('authentication middleware accepts a valid admin token', () => {
  const token = generateToken({
    id: 'admin-1',
    email: 'admin@example.com',
    role: 'admin',
  });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = responseDouble();
  let continued = false;

  requireAuth(req, res, () => {
    continued = true;
  });

  assert.equal(continued, true);
  assert.equal(req.user.role, 'admin');
});
