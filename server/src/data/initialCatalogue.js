// server/src/data/initialCatalogue.js - Complete PENNY Product & Category Catalogue

export const initialCategories = [
  {
    "id": "tops",
    "name": "Tops",
    "slug": "tops",
    "displayOrder": 1,
    "subcategories": [
      "T-Shirts",
      "Long Sleeve Tees",
      "Long Sleeve Henleys",
      "Short Sleeve Henleys",
      "Knitwear Polos",
      "Oxford shirts",
      "Sweatshirts & Hoodies"
    ]
  },
  {
    "id": "bottoms",
    "name": "Bottoms",
    "slug": "bottoms",
    "displayOrder": 2,
    "subcategories": [
      "Trousers & Chinos",
      "Denim",
      "Corduroy Trousers",
      "Utility Pants",
      "Sweatpants",
      "Shorts"
    ]
  },
  {
    "id": "outerwear",
    "name": "Outerwear",
    "slug": "outerwear",
    "displayOrder": 3,
    "subcategories": [
      "Overshirts & Shackets",
      "Knitwear Cardigan",
      "Track Suit"
    ]
  },
  {
    "id": "the-linen-shop",
    "name": "The Linen Shop",
    "slug": "the-linen-shop",
    "displayOrder": 4,
    "subcategories": [
      "Linen Tops",
      "Pants",
      "Shorts"
    ]
  },
  {
    "id": "care-essentials",
    "name": "Care & Essentials",
    "slug": "care-essentials",
    "displayOrder": 5,
    "subcategories": [
      "Lint Rollers",
      "Tote Bag"
    ]
  },
  {
    "id": "sets",
    "name": "Two-Piece Sets",
    "slug": "two-piece-sets",
    "displayOrder": 6,
    "subcategories": [
      "Linen Sets",
      "Cotton Lounge Sets"
    ]
  }
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
  {
    "id": "p-001",
    "slug": "the-linen-two-piece-set",
    "name": "The Linen Two-Piece Set",
    "category": "the-linen-shop",
    "subcategory": "Linen Tops",
    "price": 45000,
    "description": "An effortlessly refined linen set designed for breathability and comfort. The pieces work perfectly together or as versatile separates.",
    "material": "100% Premium European Linen",
    "fit": "Relaxed fit. We recommend your usual size.",
    "care": "Machine wash cold on gentle cycle. Hang to dry. Warm iron if needed.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 days in Lagos.",
    "images": {
      "primary": "/images/products/linen-set-1.jpg",
      "gallery": [
        "/images/products/linen-set-2.jpg",
        "/images/products/linen-set-3.jpg"
      ]
    },
    "colors": [
      "Cream",
      "Black",
      "Olive"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "featured": true,
    "createdAt": "2023-10-01T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-002",
    "slug": "heavyweight-cotton-lounge-set",
    "name": "Heavyweight Cotton Lounge Set",
    "category": "sets",
    "subcategory": "Cotton Lounge Sets",
    "price": 52000,
    "description": "A structured yet comfortable lounge set crafted from heavyweight organic cotton. Perfect for travel or elevated weekend wear.",
    "material": "100% Heavyweight Cotton",
    "fit": "Relaxed fit with a slightly boxy drape.",
    "care": "Machine wash cold. Tumble dry low.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 days in Lagos.",
    "images": {
      "primary": "/images/products/lounge-set-1.jpg",
      "gallery": [
        "/images/products/lounge-set-2.jpg"
      ]
    },
    "colors": [
      "Charcoal",
      "Taupe"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "featured": false,
    "createdAt": "2023-10-05T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-003",
    "slug": "the-essential-t-shirt",
    "name": "The Essential Regular Fit Tee",
    "category": "tops",
    "subcategory": "T-Shirts",
    "price": 15000,
    "description": "The foundation of any capsule wardrobe. A mid-weight, ultra-soft crewneck that retains its shape wash after wash.",
    "material": "100% Heavyweight Cotton",
    "fit": "Regular Fit Tee. Tailored silhouette.",
    "care": "Machine wash cold with like colors.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/essential-tee-1.jpg",
      "gallery": [
        "/images/products/essential-tee-2.jpg"
      ]
    },
    "colors": [
      "White",
      "Black",
      "Navy",
      "Sand"
    ],
    "availableSizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "featured": true,
    "createdAt": "2023-09-15T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-019",
    "slug": "heavyweight-oversize-pocket-tee",
    "name": "Heavyweight Oversize Fit Tee",
    "category": "tops",
    "subcategory": "T-Shirts",
    "price": 18000,
    "description": "A sturdier alternative to our Essential Tee, featuring a dropped shoulder drape and single chest pocket.",
    "material": "100% Heavyweight Cotton",
    "fit": "Oversize Fit Tee. Relaxed boxy drape.",
    "care": "Machine wash cold.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/pocket-tee-1.jpg",
      "gallery": [
        "/images/products/pocket-tee-2.jpg"
      ]
    },
    "colors": [
      "White",
      "Olive",
      "Charcoal"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "featured": false,
    "createdAt": "2023-10-20T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-006",
    "slug": "everyday-long-sleeve-tee",
    "name": "Everyday Long Sleeve Tee",
    "category": "tops",
    "subcategory": "Long Sleeve Tees",
    "price": 18000,
    "description": "A versatile long-sleeve crewneck ideal for layering or wearing solo during transitional weather.",
    "material": "100% Organic Heavyweight Cotton",
    "fit": "Regular fit.",
    "care": "Machine wash cold.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/longsleeve-1.jpg",
      "gallery": [
        "/images/products/longsleeve-2.jpg"
      ]
    },
    "colors": [
      "White",
      "Ash/Grey",
      "Black"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "featured": false,
    "createdAt": "2023-08-10T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-004",
    "slug": "waffle-long-sleeve-henley",
    "name": "Waffle Long Sleeve Henley",
    "category": "tops",
    "subcategory": "Long Sleeve Henleys",
    "price": 22000,
    "description": "A slub-cotton waffle henley featuring a three-button placket and raw-edge detailing for a subtly rugged look.",
    "material": "95% Heavyweight Cotton, 5% Elastane",
    "fit": "Body-fit. Clean and structured.",
    "care": "Machine wash cold. Lay flat to dry.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/henley-1.jpg",
      "gallery": [
        "/images/products/henley-2.jpg"
      ]
    },
    "colors": [
      "Off-White",
      "Olive",
      "Charcoal"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "featured": false,
    "createdAt": "2023-09-20T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-024",
    "slug": "short-sleeve-ribbed-henley",
    "name": "Short Sleeve Ribbed Henley",
    "category": "tops",
    "subcategory": "Short Sleeve Henleys",
    "price": 20000,
    "description": "A modern short sleeve henley cut from breathable ribbed cotton with tonal mother-of-pearl buttons.",
    "material": "100% Cotton",
    "fit": "Body-fit.",
    "care": "Machine wash cold.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/henley-1.jpg",
      "gallery": [
        "/images/products/henley-2.jpg"
      ]
    },
    "colors": [
      "Sand",
      "Black",
      "Navy"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "featured": false,
    "createdAt": "2023-09-22T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-005",
    "slug": "fine-merino-knitwear-polo",
    "name": "Fine Merino Knitwear Polo",
    "category": "tops",
    "subcategory": "Knitwear Polos",
    "price": 28000,
    "description": "An elevated take on the classic polo. Made from fine merino wool blend, offering breathability and natural drape.",
    "material": "70% Merino Wool, 30% Silk Knitwear",
    "fit": "Relaxed fit.",
    "care": "Hand wash cold or dry clean.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/polo-1.jpg",
      "gallery": [
        "/images/products/polo-2.jpg"
      ]
    },
    "colors": [
      "Navy",
      "Taupe",
      "Black"
    ],
    "availableSizes": [
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "featured": true,
    "createdAt": "2023-10-10T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-023",
    "slug": "classic-oxford-button-down-shirt",
    "name": "Classic Oxford Button-Down Shirt",
    "category": "tops",
    "subcategory": "Oxford shirts",
    "price": 29000,
    "description": "Crafted from durable basket-weave Oxford cotton. Features an iconic button-down collar and chest pocket.",
    "material": "100% Oxford Cotton",
    "fit": "Relaxed classic fit.",
    "care": "Machine wash cold. Warm iron.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/overshirt-1.jpg",
      "gallery": [
        "/images/products/overshirt-2.jpg"
      ]
    },
    "colors": [
      "Sky Blue",
      "White",
      "Striped Sky Blue"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "featured": true,
    "createdAt": "2023-10-12T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-008",
    "slug": "vintage-crewneck-sweatshirt",
    "name": "Crewneck Sweatshirt",
    "category": "tops",
    "subcategory": "Sweatshirts & Hoodies",
    "price": 32000,
    "description": "A vintage-inspired crewneck sweatshirt with modern proportions. Features ribbed cuffs and a sturdy neckline.",
    "material": "100% Heavyweight Cotton",
    "fit": "Relaxed fit.",
    "care": "Machine wash cold.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/sweatshirt-1.jpg",
      "gallery": [
        "/images/products/sweatshirt-2.jpg"
      ]
    },
    "colors": [
      "Ash/Grey",
      "Navy",
      "Olive"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "featured": false,
    "createdAt": "2023-10-15T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-009",
    "slug": "ribbed-quarter-zip-sweatshirt",
    "name": "Ribbed Quarter-Zip",
    "category": "tops",
    "subcategory": "Sweatshirts & Hoodies",
    "price": 42000,
    "description": "A sophisticated layering piece featuring a chunky metal zipper and a textured ribbed knit collar.",
    "material": "80% Cotton, 20% Wool Knitwear",
    "fit": "Relaxed fit.",
    "care": "Hand wash or delicate cycle.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/quarterzip-1.jpg",
      "gallery": [
        "/images/products/quarterzip-2.jpg"
      ]
    },
    "colors": [
      "Cream",
      "Navy",
      "Coffee Brown"
    ],
    "availableSizes": [
      "M",
      "L",
      "XL"
    ],
    "featured": true,
    "createdAt": "2023-11-05T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-021",
    "slug": "collared-quarter-zip-sweatshirt",
    "name": "Collared Quarter-Zip",
    "category": "tops",
    "subcategory": "Sweatshirts & Hoodies",
    "price": 44000,
    "description": "Clean polo-style collar with a brass quarter-zip. Tailored from dense brushed fleece.",
    "material": "100% Heavyweight Cotton",
    "fit": "Relaxed fit.",
    "care": "Machine wash cold.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/quarterzip-2.jpg",
      "gallery": [
        "/images/products/quarterzip-1.jpg"
      ]
    },
    "colors": [
      "Camel",
      "Black",
      "Forest Green"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "featured": false,
    "createdAt": "2023-11-06T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-007",
    "slug": "standard-heavyweight-hoodie",
    "name": "Standard Hoodie",
    "category": "tops",
    "subcategory": "Sweatshirts & Hoodies",
    "price": 35000,
    "description": "A clean, logo-free pullover hoodie with a double-lined hood and hidden side-seam kangaroo pockets.",
    "material": "100% French Terry Heavyweight Cotton",
    "fit": "Oversized fit.",
    "care": "Machine wash cold. Tumble dry low.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/hoodie-1.jpg",
      "gallery": [
        "/images/products/hoodie-2.jpg"
      ]
    },
    "colors": [
      "Charcoal",
      "Burgundy",
      "Black"
    ],
    "availableSizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "featured": false,
    "createdAt": "2023-11-01T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-022",
    "slug": "zip-through-hoodie",
    "name": "Zip-through Hoodie",
    "category": "tops",
    "subcategory": "Sweatshirts & Hoodies",
    "price": 38000,
    "description": "Full-zip hoodie with matte hardware, custom puller, and heavyweight fleece construction.",
    "material": "100% Heavyweight Cotton",
    "fit": "Relaxed fit.",
    "care": "Machine wash cold.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/hoodie-2.jpg",
      "gallery": [
        "/images/products/hoodie-1.jpg"
      ]
    },
    "colors": [
      "Ash/Grey",
      "Black",
      "Burnt Orange"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "featured": true,
    "createdAt": "2023-11-08T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-012",
    "slug": "classic-tailored-pants",
    "name": "Classic Tailored Pants",
    "category": "bottoms",
    "subcategory": "Trousers & Chinos",
    "price": 38000,
    "description": "Sharp enough for the boardroom, relaxed enough for evening dining. Single front pleat with a crisp taper.",
    "material": "Cotton Twill & Viscose Blend",
    "fit": "Tailored fit. Mid-rise waist.",
    "care": "Dry clean recommended.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/trousers-1.jpg",
      "gallery": [
        "/images/products/trousers-2.jpg"
      ]
    },
    "colors": [
      "Charcoal",
      "Black",
      "Navy"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "featured": true,
    "createdAt": "2023-08-20T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-013",
    "slug": "improved-tailored-pants",
    "name": "Improved Tailored Pants",
    "category": "bottoms",
    "subcategory": "Trousers & Chinos",
    "price": 34000,
    "description": "An updated chino trouser with an elasticated waistband interior for flexible luxury movement.",
    "material": "100% Heavyweight Cotton Chino",
    "fit": "Relaxed casual fit.",
    "care": "Machine wash cold.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/chinos-1.jpg",
      "gallery": [
        "/images/products/chinos-2.jpg"
      ]
    },
    "colors": [
      "Camel",
      "Olive",
      "Navy"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "featured": false,
    "createdAt": "2023-08-25T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-014",
    "slug": "selvedge-denim-jeans",
    "name": "Japanese Selvedge Denim Jeans",
    "category": "bottoms",
    "subcategory": "Denim",
    "price": 55000,
    "description": "Authentic 13.5oz red-line selvedge denim that gracefully conforms to your wear patterns over time.",
    "material": "100% Japanese Selvedge Denim",
    "fit": "Relaxed straight fit.",
    "care": "Wash cold inside out. Hang dry.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/jeans-1.jpg",
      "gallery": [
        "/images/products/jeans-2.jpg"
      ]
    },
    "colors": [
      "Raw Indigo"
    ],
    "availableSizes": [
      "M",
      "L",
      "XL"
    ],
    "featured": true,
    "createdAt": "2023-07-15T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-015",
    "slug": "washed-black-denim-jeans",
    "name": "Washed Black Denim Jeans",
    "category": "bottoms",
    "subcategory": "Denim",
    "price": 45000,
    "description": "Versatile vintage washed black denim with a broken-in drape from the first wear.",
    "material": "99% Cotton Denim, 1% Elastane",
    "fit": "Relaxed fit.",
    "care": "Machine wash cold.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/jeans-black-1.jpg",
      "gallery": [
        "/images/products/jeans-black-2.jpg"
      ]
    },
    "colors": [
      "Washed Black"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "featured": false,
    "createdAt": "2023-09-10T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-025",
    "slug": "wide-wale-corduroy-trousers",
    "name": "Corduroy Trousers",
    "category": "bottoms",
    "subcategory": "Corduroy Trousers",
    "price": 46000,
    "description": "Plush 8-wale corduroy trousers designed with a gentle taper, deep slash pockets, and rich velvet-like luster.",
    "material": "100% Cotton Corduroy",
    "fit": "Relaxed fit.",
    "care": "Machine wash cold inside out.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/trousers-2.jpg",
      "gallery": [
        "/images/products/trousers-1.jpg"
      ]
    },
    "colors": [
      "Coffee Brown",
      "Olive",
      "Camel"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "featured": true,
    "createdAt": "2023-09-12T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-018",
    "slug": "utility-pants-in-chinos",
    "name": "Utility Pants in Chinos",
    "category": "bottoms",
    "subcategory": "Utility Pants",
    "price": 42000,
    "description": "Refined cargo pockets engineered to stay flat against the leg for a sleek silhouette.",
    "material": "100% Cotton Chino Twill",
    "fit": "Relaxed straight fit.",
    "care": "Machine wash cold.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/cargo-1.jpg",
      "gallery": [
        "/images/products/cargo-2.jpg"
      ]
    },
    "colors": [
      "Olive",
      "Sand",
      "Black"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "featured": false,
    "createdAt": "2023-09-25T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-026",
    "slug": "utility-pants-in-heavyweight-cotton",
    "name": "Utility Pants in Heavyweight Cotton",
    "category": "bottoms",
    "subcategory": "Utility Pants",
    "price": 44000,
    "description": "Crafted from rugged heavyweight cotton canvas with reinforced knee paneling and drawstring hem.",
    "material": "100% Heavyweight Cotton",
    "fit": "Relaxed fit.",
    "care": "Machine wash cold.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/cargo-2.jpg",
      "gallery": [
        "/images/products/cargo-1.jpg"
      ]
    },
    "colors": [
      "Charcoal",
      "Forest Green",
      "Camel"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "featured": false,
    "createdAt": "2023-09-28T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-017",
    "slug": "cuffed-sweatpants",
    "name": "Cuffed French Terry Sweatpants",
    "category": "bottoms",
    "subcategory": "Sweatpants",
    "price": 29000,
    "description": "Heavyweight loungewear finished with snug ribbed cuffs and an external braided drawcord.",
    "material": "100% Heavyweight Cotton",
    "fit": "Relaxed tapered fit.",
    "care": "Machine wash cold.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/joggers-1.jpg",
      "gallery": [
        "/images/products/joggers-2.jpg"
      ]
    },
    "colors": [
      "Ash/Grey",
      "Black",
      "Navy"
    ],
    "availableSizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "featured": false,
    "createdAt": "2023-10-02T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-027",
    "slug": "open-hem-sweatpants",
    "name": "Open-Hem Lounge Sweatpants",
    "category": "bottoms",
    "subcategory": "Sweatpants",
    "price": 32000,
    "description": "Modern straight-leg sweatpants with a clean, uncuffed open hem that falls effortlessly over sneakers.",
    "material": "100% Heavyweight Cotton",
    "fit": "Relaxed fit.",
    "care": "Machine wash cold.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/joggers-2.jpg",
      "gallery": [
        "/images/products/joggers-1.jpg"
      ]
    },
    "colors": [
      "Cream",
      "Charcoal",
      "Coffee Brown"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "featured": false,
    "createdAt": "2023-10-04T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-028",
    "slug": "heavyweight-sweatshorts",
    "name": "Heavyweight Sweatshorts",
    "category": "bottoms",
    "subcategory": "Shorts",
    "price": 22000,
    "description": "Comfortable French terry shorts designed for off-duty days with deep pockets and an elastic drawstring.",
    "material": "100% Heavyweight Cotton",
    "fit": "Relaxed fit.",
    "care": "Machine wash cold.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/shorts-1.jpg",
      "gallery": [
        "/images/products/shorts-2.jpg"
      ]
    },
    "colors": [
      "Ash/Grey",
      "Black"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "featured": false,
    "createdAt": "2023-05-12T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-016",
    "slug": "chino-shorts",
    "name": "Chino Shorts",
    "category": "bottoms",
    "subcategory": "Shorts",
    "price": 24000,
    "description": "Tailored chino shorts with a 7-inch inseam that hits cleanly above the knee.",
    "material": "100% Cotton Twill",
    "fit": "Relaxed tailored fit.",
    "care": "Machine wash cold.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/shorts-2.jpg",
      "gallery": [
        "/images/products/shorts-1.jpg"
      ]
    },
    "colors": [
      "Sand",
      "Navy",
      "Olive"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "featured": false,
    "createdAt": "2023-05-10T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-029",
    "slug": "pleated-linen-shorts",
    "name": "Pleated Shorts",
    "category": "bottoms",
    "subcategory": "Shorts",
    "price": 26000,
    "description": "Elevated double-pleated shorts tailored from pure European flax linen.",
    "material": "100% Premium European Linen",
    "fit": "Relaxed fit.",
    "care": "Machine wash cold.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/shorts-1.jpg",
      "gallery": [
        "/images/products/shorts-2.jpg"
      ]
    },
    "colors": [
      "Cream",
      "Charcoal"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "featured": false,
    "createdAt": "2023-05-15T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-011",
    "slug": "selvedge-denim-overshirt",
    "name": "Selvedge Denim Overshirt",
    "category": "outerwear",
    "subcategory": "Overshirts & Shackets",
    "price": 48000,
    "description": "A rugged yet refined overshirt with twin chest flap pockets. Functions as a light jacket or middle layer.",
    "material": "100% Cotton Denim",
    "fit": "Relaxed boxy fit.",
    "care": "Machine wash cold.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/overshirt-1.jpg",
      "gallery": [
        "/images/products/overshirt-2.jpg"
      ]
    },
    "colors": [
      "Raw Indigo",
      "Washed Black"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "featured": true,
    "createdAt": "2023-09-05T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-030",
    "slug": "corduroy-shacket",
    "name": "Corduroy Shacket",
    "category": "outerwear",
    "subcategory": "Overshirts & Shackets",
    "price": 54000,
    "description": "Warm, textural corduroy overshirt with horn buttons and satin-lined sleeves for effortless on/off layering.",
    "material": "100% Cotton Corduroy",
    "fit": "Oversized fit.",
    "care": "Machine wash cold delicate.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/overshirt-2.jpg",
      "gallery": [
        "/images/products/overshirt-1.jpg"
      ]
    },
    "colors": [
      "Camel",
      "Coffee Brown",
      "Olive"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "featured": true,
    "createdAt": "2023-09-08T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-020",
    "slug": "chunky-knitwear-cardigan",
    "name": "Chunky Knitwear Cardigan",
    "category": "outerwear",
    "subcategory": "Knitwear Cardigan",
    "price": 58000,
    "description": "A textural masterpiece. This chunky knit cardigan provides deep warmth, ribbed trims, and real horn buttons.",
    "material": "100% Merino Wool Knitwear",
    "fit": "Relaxed fit.",
    "care": "Hand wash only. Dry flat.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/chunky-sweater-1.jpg",
      "gallery": [
        "/images/products/chunky-sweater-2.jpg"
      ]
    },
    "colors": [
      "Cream",
      "Forest Green",
      "Navy"
    ],
    "availableSizes": [
      "M",
      "L",
      "XL"
    ],
    "featured": true,
    "createdAt": "2023-11-20T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-031",
    "slug": "fleece-lounge-track-suit",
    "name": "Fleece Lounge Track Suit",
    "category": "outerwear",
    "subcategory": "Track Suit",
    "price": 62000,
    "description": "Two-piece matching heavyweight tracksuit with minimalist zipper jacket and tapered coordinating sweatpants.",
    "material": "100% Heavyweight Cotton",
    "fit": "Relaxed fit.",
    "care": "Machine wash cold.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/lounge-set-2.jpg",
      "gallery": [
        "/images/products/lounge-set-1.jpg"
      ]
    },
    "colors": [
      "Black",
      "Ash/Grey",
      "Navy"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "featured": true,
    "createdAt": "2023-11-25T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-032",
    "slug": "the-relaxed-linen-shirt",
    "name": "The Relaxed Linen Shirt",
    "category": "the-linen-shop",
    "subcategory": "Linen Tops",
    "price": 34000,
    "description": "Breathable camp-collar shirt cut from airy, garment-washed linen that drapes naturally in warm climates.",
    "material": "100% Premium European Linen",
    "fit": "Relaxed fit.",
    "care": "Machine wash cold. Hang dry.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/linen-set-2.jpg",
      "gallery": [
        "/images/products/linen-set-1.jpg"
      ]
    },
    "colors": [
      "White",
      "Olive",
      "Cream"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "featured": true,
    "createdAt": "2023-10-02T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-033",
    "slug": "the-relaxed-linen-pants",
    "name": "The Relaxed Linen Pants",
    "category": "the-linen-shop",
    "subcategory": "Pants",
    "price": 38000,
    "description": "Easy drawstring trousers made from pure European flax. Keeps you cool all day with an elegant drape.",
    "material": "100% Premium European Linen",
    "fit": "Relaxed fit.",
    "care": "Machine wash cold.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/linen-set-3.jpg",
      "gallery": [
        "/images/products/linen-set-1.jpg"
      ]
    },
    "colors": [
      "Cream",
      "Black",
      "Olive"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "featured": true,
    "createdAt": "2023-10-03T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-034",
    "slug": "the-linen-drawstring-shorts",
    "name": "The Linen Drawstring Shorts",
    "category": "the-linen-shop",
    "subcategory": "Shorts",
    "price": 26000,
    "description": "Laid-back resort shorts featuring an elastic drawstring waistband and deep side pockets.",
    "material": "100% Premium European Linen",
    "fit": "Relaxed fit.",
    "care": "Machine wash cold.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/shorts-1.jpg",
      "gallery": [
        "/images/products/linen-set-2.jpg"
      ]
    },
    "colors": [
      "Sand",
      "Navy",
      "White"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "featured": false,
    "createdAt": "2023-10-04T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-035",
    "slug": "natural-cedar-wool-lint-roller",
    "name": "Natural Cedar & Wool Lint Roller",
    "category": "care-essentials",
    "subcategory": "Lint Rollers",
    "price": 12000,
    "description": "An heirloom garment care essential. Turned natural cedar handle with extra-sticky adhesive sheets to keep knitwear lint-free.",
    "material": "Natural Cedar Wood & Adhesive",
    "fit": "Standard One Size",
    "care": "Wipe handle with a damp cloth.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/sweater-1.jpg",
      "gallery": [
        "/images/products/sweater-2.jpg"
      ]
    },
    "colors": [
      "Natural Wood"
    ],
    "availableSizes": [
      "One Size"
    ],
    "featured": false,
    "createdAt": "2023-11-15T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-036",
    "slug": "heavyweight-canvas-tote-bag",
    "name": "Heavyweight Canvas Tote Bag",
    "category": "care-essentials",
    "subcategory": "Tote Bag",
    "price": 16000,
    "description": "Heavyweight 16oz cotton canvas tote with reinforced box-stitched handles and internal key loop.",
    "material": "100% Heavyweight Cotton Canvas",
    "fit": "One Size (42cm x 38cm)",
    "care": "Spot clean only.",
    "shipping": "Free delivery on orders above ₦200,000.",
    "images": {
      "primary": "/images/products/pocket-tee-1.jpg",
      "gallery": [
        "/images/products/pocket-tee-2.jpg"
      ]
    },
    "colors": [
      "Cream",
      "Black"
    ],
    "availableSizes": [
      "One Size"
    ],
    "featured": true,
    "createdAt": "2023-11-16T00:00:00Z",
    "inStock": true
  }
];
