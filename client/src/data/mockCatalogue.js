// PENNY Centralized Mock Product Catalogue
// This structure is designed to be easily replaceable by a real backend API.

export const categories = [
  { id: 'tops', name: 'Tops', slug: 'tops' },
  { id: 'bottoms', name: 'Bottoms', slug: 'bottoms' },
  { id: 'sets', name: 'Two-Piece Sets', slug: 'two-piece-sets' }
];

export const subcategories = {
  tops: ['T-Shirts', 'Henleys', 'Polos', 'Long-Sleeve Shirts', 'Hoodies', 'Sweatshirts', 'Quarter-Zips', 'Sweaters', 'Overshirts'],
  bottoms: ['Trousers', 'Chinos', 'Jeans', 'Shorts', 'Joggers', 'Cargo Pants'],
  sets: ['Linen Sets'] // Future set types can be added here
};

export const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Central catalogue
export const products = [
  {
    id: 'p-001',
    name: 'The Linen Two-Piece Set',
    category: 'sets',
    subcategory: 'Linen Sets',
    price: 45000,
    description: 'An effortlessly refined linen set designed for breathability and comfort. The pieces work perfectly together or as versatile separates.',
    material: '100% Premium European Linen',
    fit: 'Relaxed fit. We recommend your usual size.',
    care: 'Machine wash cold on gentle cycle. Hang to dry. Warm iron if needed.',
    shipping: 'Free delivery on orders above ₦75,000. Ships within 1-3 days in Lagos.',
    images: {
      primary: '/images/products/linen-set-cream-primary.jpg',
      gallery: [
        '/images/products/linen-set-cream-model.jpg',
        '/images/products/linen-set-cream-detail.jpg'
      ]
    },
    colors: ['Cream', 'Black', 'Olive'],
    availableSizes: ['S', 'M', 'L', 'XL'], // XS and XXL are currently unavailable (disabled state demo)
    featured: true,
    createdAt: '2023-10-01T00:00:00Z',
    inStock: true,
  },
  // We will populate the remaining 20-30 products in Phase 2
];
