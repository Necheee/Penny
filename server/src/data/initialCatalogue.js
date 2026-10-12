// server/src/data/initialCatalogue.js - Complete PENNY Product & Category Catalogue

export const initialCategories = [
  { id: 'sets', name: 'Two-Piece Sets', slug: 'two-piece-sets', displayOrder: 1 },
  { id: 'tops', name: 'Tops', slug: 'tops', displayOrder: 2 },
  { id: 'bottoms', name: 'Bottoms', slug: 'bottoms', displayOrder: 3 },
  { id: 'outerwear', name: 'Outerwear', slug: 'outerwear', displayOrder: 4 }
];

export const initialSizeGuides = [
  {
    category: 'tops',
    measurements: JSON.stringify([
      { size: 'XS', chest: '86 - 91', waist: '71 - 76', shoulder: '42' },
      { size: 'S', chest: '91 - 96', waist: '76 - 81', shoulder: '44' },
      { size: 'M', chest: '96 - 101', waist: '81 - 86', shoulder: '46' },
      { size: 'L', chest: '101 - 106', waist: '86 - 91', shoulder: '48' },
      { size: 'XL', chest: '106 - 111', waist: '91 - 96', shoulder: '50' },
      { size: 'XXL', chest: '111 - 116', waist: '96 - 101', shoulder: '52' }
    ])
  },
  {
    category: 'bottoms',
    measurements: JSON.stringify([
      { size: 'XS', waist: '71 - 76', hips: '88 - 93', inseam: '78' },
      { size: 'S', waist: '76 - 81', hips: '93 - 98', inseam: '80' },
      { size: 'M', waist: '81 - 86', hips: '98 - 103', inseam: '81' },
      { size: 'L', waist: '86 - 91', hips: '103 - 108', inseam: '82' },
      { size: 'XL', waist: '91 - 96', hips: '108 - 113', inseam: '83' },
      { size: 'XXL', waist: '96 - 101', hips: '113 - 118', inseam: '84' }
    ])
  }
];

export const initialProducts = [
  // --- TWO PIECE SETS ---
  {
    id: 'p-001',
    slug: 'the-linen-two-piece-set',
    name: 'The Linen Two-Piece Set',
    category: 'sets',
    subcategory: 'Linen Sets',
    price: 45000,
    description: 'An effortlessly refined linen set designed for breathability and comfort. The pieces work perfectly together or as versatile separates.',
    material: '100% Premium European Linen',
    fit: 'Relaxed fit. We recommend your usual size.',
    care: 'Machine wash cold on gentle cycle. Hang to dry. Warm iron if needed.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 days in Lagos.',
    images: {
      primary: '/images/products/linen-set-1.jpg',
      gallery: ['/images/products/linen-set-2.jpg', '/images/products/linen-set-3.jpg']
    },
    colors: ['Cream', 'Black', 'Olive'],
    availableSizes: ['S', 'M', 'L', 'XL'],
    featured: true,
    createdAt: '2023-10-01T00:00:00Z',
    inStock: true,
  },
  {
    id: 'p-002',
    slug: 'heavyweight-cotton-lounge-set',
    name: 'Heavyweight Cotton Lounge Set',
    category: 'sets',
    subcategory: 'Cotton Lounge Sets',
    price: 52000,
    description: 'A structured yet comfortable lounge set crafted from heavyweight organic cotton. Perfect for travel or elevated weekend wear.',
    material: '100% Organic Heavyweight Cotton',
    fit: 'True to size with a slightly boxy drape.',
    care: 'Machine wash cold. Tumble dry low.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 days in Lagos.',
    images: {
      primary: '/images/products/lounge-set-1.jpg',
      gallery: ['/images/products/lounge-set-2.jpg']
    },
    colors: ['Charcoal', 'Taupe'],
    availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
    featured: false,
    createdAt: '2023-10-05T00:00:00Z',
    inStock: true,
  },

  // --- TOPS ---
  {
    id: 'p-003',
    slug: 'the-essential-t-shirt',
    name: 'The Essential T-Shirt',
    category: 'tops',
    subcategory: 'T-Shirts',
    price: 15000,
    description: 'The foundation of any capsule wardrobe. A mid-weight, ultra-soft crewneck that retains its shape wash after wash.',
    material: '100% Supima Cotton',
    fit: 'Tailored but not tight.',
    care: 'Machine wash cold with like colors.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 days in Lagos.',
    images: {
      primary: '/images/products/essential-tee-1.jpg',
      gallery: ['/images/products/essential-tee-2.jpg']
    },
    colors: ['White', 'Black', 'Heather Grey', 'Navy'],
    availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
    featured: true,
    createdAt: '2023-10-10T00:00:00Z',
    inStock: true,
  },
  {
    id: 'p-004',
    slug: 'waffle-knit-long-sleeve-henley',
    name: 'Waffle-Knit Long-Sleeve Henley',
    category: 'tops',
    subcategory: 'Henleys',
    price: 24000,
    description: 'A textured thermal waffle knit designed for layering or solo wear during cooler evenings.',
    material: '95% Cotton, 5% Elastane',
    fit: 'Regular fit through the chest and arms.',
    care: 'Machine wash cold, dry flat.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 days in Lagos.',
    images: {
      primary: '/images/products/henley-1.jpg',
      gallery: ['/images/products/henley-2.jpg']
    },
    colors: ['Olive', 'Charcoal', 'Sand'],
    availableSizes: ['S', 'M', 'L', 'XL'],
    featured: false,
    createdAt: '2023-10-12T00:00:00Z',
    inStock: true,
  },
  {
    id: 'p-005',
    slug: 'merino-wool-knit-polo',
    name: 'Merino Wool Knit Polo',
    category: 'tops',
    subcategory: 'Polos',
    price: 38000,
    description: 'An elevated polo knit from extra-fine Merino wool. Features a buttonless open collar for modern sophistication.',
    material: '100% Extra-Fine Merino Wool',
    fit: 'Classic, refined drape.',
    care: 'Hand wash cold or dry clean only.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 days in Lagos.',
    images: {
      primary: '/images/products/merino-polo-1.jpg',
      gallery: ['/images/products/merino-polo-2.jpg']
    },
    colors: ['Navy', 'Taupe', 'Black'],
    availableSizes: ['S', 'M', 'L', 'XL'],
    featured: true,
    createdAt: '2023-10-15T00:00:00Z',
    inStock: true,
  },
  {
    id: 'p-006',
    slug: 'the-relaxed-oxford-shirt',
    name: 'The Relaxed Oxford Shirt',
    category: 'tops',
    subcategory: 'Long-Sleeve Shirts',
    price: 28000,
    description: 'A washed Oxford cotton button-down cut with a relaxed shoulder for an effortlessly lived-in look.',
    material: '100% Organic Oxford Cotton',
    fit: 'Relaxed fit with a slightly dropped shoulder.',
    care: 'Machine wash warm, hang dry, medium iron.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 days in Lagos.',
    images: {
      primary: '/images/products/oxford-shirt-1.jpg',
      gallery: ['/images/products/oxford-shirt-2.jpg']
    },
    colors: ['Washed Blue', 'White'],
    availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
    featured: false,
    createdAt: '2023-10-18T00:00:00Z',
    inStock: true,
  },

  // --- BOTTOMS ---
  {
    id: 'p-007',
    slug: 'the-tailored-linen-trouser',
    name: 'The Tailored Linen Trouser',
    category: 'bottoms',
    subcategory: 'Trousers',
    price: 32000,
    description: 'Breathable European linen tailored with front pleats and an elasticated waistband for all-day comfort without sacrificing form.',
    material: '100% Linen',
    fit: 'Slightly tapered leg, mid-rise.',
    care: 'Gentle cycle cold. Line dry in shade.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 days in Lagos.',
    images: {
      primary: '/images/products/linen-trouser-1.jpg',
      gallery: ['/images/products/linen-trouser-2.jpg']
    },
    colors: ['Sand', 'Black', 'Olive'],
    availableSizes: ['S', 'M', 'L', 'XL'],
    featured: true,
    createdAt: '2023-10-20T00:00:00Z',
    inStock: true,
  },
  {
    id: 'p-008',
    slug: 'everyday-slim-chino',
    name: 'Everyday Slim Chino',
    category: 'bottoms',
    subcategory: 'Chinos',
    price: 26000,
    description: 'Crafted from soft stretch cotton twill. Versatile enough for the office or a casual weekend.',
    material: '98% Cotton, 2% Spandex',
    fit: 'Slim through the hip and thigh.',
    care: 'Machine wash cold inside out.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 days in Lagos.',
    images: {
      primary: '/images/products/chino-1.jpg',
      gallery: ['/images/products/chino-2.jpg']
    },
    colors: ['Navy', 'Sand', 'Charcoal'],
    availableSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    featured: false,
    createdAt: '2023-10-22T00:00:00Z',
    inStock: true,
  },
  {
    id: 'p-009',
    slug: 'japanese-selvedge-denim',
    name: 'Japanese Selvedge Denim',
    category: 'bottoms',
    subcategory: 'Jeans',
    price: 48000,
    description: '13.5oz raw selvedge denim woven in Okayama, Japan. Built to fade uniquely with every wear.',
    material: '100% Japanese Selvedge Cotton',
    fit: 'Straight leg with a classic rise.',
    care: 'Wear often, wash rarely. Cold soak inside out.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 days in Lagos.',
    images: {
      primary: '/images/products/selvedge-denim-1.jpg',
      gallery: ['/images/products/selvedge-denim-2.jpg']
    },
    colors: ['Raw Indigo', 'Washed Black'],
    availableSizes: ['S', 'M', 'L', 'XL'],
    featured: false,
    createdAt: '2023-10-25T00:00:00Z',
    inStock: true,
  },
  {
    id: 'p-010',
    slug: 'tailored-swim-walk-short',
    name: 'Tailored Swim & Walk Short',
    category: 'bottoms',
    subcategory: 'Shorts',
    price: 22000,
    description: 'Quick-drying polyamide shorts designed with tailored side adjusters. Transitions seamlessly from pool to patio.',
    material: '100% Recycled Quick-Dry Polyamide',
    fit: '6-inch inseam, tailored hem.',
    care: 'Rinse with fresh water after swim. Machine wash cold.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 days in Lagos.',
    images: {
      primary: '/images/products/swim-short-1.jpg',
      gallery: ['/images/products/swim-short-2.jpg']
    },
    colors: ['Olive', 'Navy', 'Rust'],
    availableSizes: ['S', 'M', 'L', 'XL'],
    featured: false,
    createdAt: '2023-10-28T00:00:00Z',
    inStock: true,
  }
];
