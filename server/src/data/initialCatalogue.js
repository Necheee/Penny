// server/src/data/initialCatalogue.js - Complete PENNY Product & Category Catalogue

export const initialCategories = [
  {
    "id": "tops",
    "name": "Tops",
    "slug": "tops",
    "displayOrder": 1,
    "subcategories": [
      {
        "name": "T-Shirts",
        "subtypes": [
          "Regular Fit Tee",
          "Oversize Fit Tee"
        ]
      },
      {
        "name": "Long Sleeve Tees",
        "subtypes": []
      },
      {
        "name": "Long Sleeve Henleys",
        "subtypes": []
      },
      {
        "name": "Short Sleeve Henleys",
        "subtypes": []
      },
      {
        "name": "Knitwear Polos",
        "subtypes": []
      },
      {
        "name": "Oxford shirts",
        "subtypes": []
      },
      {
        "name": "Sweatshirts & Hoodies",
        "subtypes": [
          "Crewneck sweatshirt",
          "Quarter-Zip",
          "Collared Quarter-Zip",
          "Zip-through Hoodie",
          "Standard Hoodie"
        ]
      }
    ]
  },
  {
    "id": "bottoms",
    "name": "Bottoms",
    "slug": "bottoms",
    "displayOrder": 2,
    "subcategories": [
      {
        "name": "Trousers & Chinos",
        "subtypes": [
          "Classic Tailored Pants",
          "Improved Tailored Pants"
        ]
      },
      {
        "name": "Denim",
        "subtypes": []
      },
      {
        "name": "Corduroy Trousers",
        "subtypes": []
      },
      {
        "name": "Utility Pants",
        "subtypes": [
          "Utility pants in chinos",
          "Utility pants in heavyweight cotton"
        ]
      },
      {
        "name": "Sweatpants",
        "subtypes": [
          "Cuffed",
          "Open-Hem"
        ]
      },
      {
        "name": "Shorts",
        "subtypes": [
          "Sweatshorts",
          "Chino Shorts",
          "Utility Shorts",
          "Pleated Shorts"
        ]
      }
    ]
  },
  {
    "id": "outerwear",
    "name": "Outerwear",
    "slug": "outerwear",
    "displayOrder": 3,
    "subcategories": [
      {
        "name": "Overshirts & Shackets",
        "subtypes": [
          "Denim",
          "Corduroy"
        ]
      },
      {
        "name": "Knitwear Cardigan",
        "subtypes": []
      },
      {
        "name": "Track Suit",
        "subtypes": []
      }
    ]
  },
  {
    "id": "the-linen-shop",
    "name": "The Linen Shop",
    "slug": "the-linen-shop",
    "displayOrder": 4,
    "subcategories": [
      {
        "name": "Linen Tops",
        "subtypes": []
      },
      {
        "name": "Pants",
        "subtypes": []
      },
      {
        "name": "Shorts",
        "subtypes": []
      }
    ]
  },
  {
    "id": "care-accessories",
    "name": "Care & Accessories",
    "slug": "care-accessories",
    "displayOrder": 5,
    "subcategories": [
      {
        "name": "Lint Rollers",
        "subtypes": []
      },
      {
        "name": "Tote Bag",
        "subtypes": []
      }
    ]
  }
];

export const initialSizeGuides = [
  {
    category: 'tops',
    measurements: JSON.stringify([
      { size: 'XS', chest: '86 - 91', length: '68', shoulder: '42' },
      { size: 'S', chest: '91 - 96', length: '70', shoulder: '44' },
      { size: 'M', chest: '96 - 101', length: '72', shoulder: '46' },
      { size: 'L', chest: '101 - 106', length: '74', shoulder: '48' },
      { size: 'XL', chest: '106 - 111', length: '76', shoulder: '50' },
      { size: 'XXL', chest: '111 - 116', length: '78', shoulder: '52' }
    ])
  },
  {
    category: 'shirts',
    measurements: JSON.stringify([
      { size: 'XS', collar: '37', chest: '88 - 93', sleeve: '82' },
      { size: 'S', collar: '38 - 39', chest: '93 - 98', sleeve: '84' },
      { size: 'M', collar: '40 - 41', chest: '98 - 103', sleeve: '86' },
      { size: 'L', collar: '42 - 43', chest: '103 - 108', sleeve: '88' },
      { size: 'XL', collar: '44 - 45', chest: '108 - 113', sleeve: '90' },
      { size: 'XXL', collar: '46 - 47', chest: '113 - 118', sleeve: '92' }
    ])
  },
  {
    category: 'shorts',
    measurements: JSON.stringify([
      { size: 'XS', waist: '71 - 76', hips: '88 - 93', inseam: '16' },
      { size: 'S', waist: '76 - 81', hips: '93 - 98', inseam: '17' },
      { size: 'M', waist: '81 - 86', hips: '98 - 103', inseam: '18' },
      { size: 'L', waist: '86 - 91', hips: '103 - 108', inseam: '19' },
      { size: 'XL', waist: '91 - 96', hips: '108 - 113', inseam: '20' },
      { size: 'XXL', waist: '96 - 101', hips: '113 - 118', inseam: '21' }
    ])
  },
  {
    category: 'trousers',
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
    "id": "p-003",
    "slug": "the-essential-regular-fit-tee",
    "name": "The Essential Regular Fit Tee",
    "category": "tops",
    "subcategory": "T-Shirts",
    "subtype": "Regular Fit Tee",
    "price": 15000,
    "description": "The foundation of any capsule wardrobe. A mid-weight, ultra-soft crewneck that retains its structure wash after wash.",
    "material": "100% Heavyweight Supima Cotton (240 GSM)",
    "fit": "Regular Fit Tee. Tailored silhouette through chest with clean shoulder lines.",
    "care": "Machine wash cold with like colors. Tumble dry low or hang dry.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "slug": "heavyweight-oversize-fit-tee",
    "name": "Heavyweight Oversize Fit Tee",
    "category": "tops",
    "subcategory": "T-Shirts",
    "subtype": "Oversize Fit Tee",
    "price": 18000,
    "description": "A sturdier relaxed alternative to our Essential Tee, featuring a dropped-shoulder drape and single chest pocket.",
    "material": "100% Heavyweight Organic Cotton (280 GSM)",
    "fit": "Oversize Fit Tee. Boxy drape with dropped shoulder seams. Order true to size.",
    "care": "Machine wash cold. Lay flat to dry.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "subtype": "",
    "price": 18000,
    "description": "A versatile long-sleeve crewneck ideal for transitional weather layering or wearing solo with relaxed chinos.",
    "material": "100% Heavyweight Cotton",
    "fit": "Relaxed fit with ribbed cuffs and clean neckline.",
    "care": "Machine wash cold. Tumble dry delicate.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "subtype": "",
    "price": 22000,
    "description": "A textured slub-cotton waffle henley featuring a three-button placket and raw-edge detailing for a subtly rugged aesthetic.",
    "material": "95% Heavyweight Cotton, 5% Elastane",
    "fit": "Body-fit. Contoured through torso without restriction.",
    "care": "Machine wash cold inside out. Lay flat to dry.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "subtype": "",
    "price": 20000,
    "description": "A modern short sleeve henley cut from breathable ribbed cotton with tonal mother-of-pearl buttons.",
    "material": "100% Breathable Ribbed Cotton",
    "fit": "Body-fit. Clean athletic contour.",
    "care": "Machine wash cold. Do not tumble dry.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
    "images": {
      "primary": "/images/products/henley-2.jpg",
      "gallery": [
        "/images/products/henley-1.jpg"
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
    "subtype": "",
    "price": 28000,
    "description": "An elevated take on the classic polo. Made from fine merino wool blend, offering breathability and natural wrinkle resistance.",
    "material": "70% Merino Wool, 30% Silk Knitwear",
    "fit": "Relaxed fit with ribbed hem and buttonless open collar.",
    "care": "Hand wash cold or dry clean only. Dry flat.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "subtype": "",
    "price": 29000,
    "description": "Crafted from heavyweight basket-weave Oxford cotton. Features an authentic rolled button-down collar and chest pocket.",
    "material": "100% Heavyweight Oxford Cotton",
    "fit": "Relaxed classic fit. Easy to wear tucked or untucked.",
    "care": "Machine wash cold. Warm iron while slightly damp.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "name": "Vintage Crewneck Sweatshirt",
    "category": "tops",
    "subcategory": "Sweatshirts & Hoodies",
    "subtype": "Crewneck sweatshirt",
    "price": 32000,
    "description": "A vintage-inspired sweatshirt with modern proportions. Features ribbed side gussets and a sturdy neckline.",
    "material": "100% Heavyweight Cotton (450 GSM Loopback Fleece)",
    "fit": "Relaxed fit with a slightly boxy drape.",
    "care": "Machine wash cold inside out. Hang to dry.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "slug": "ribbed-quarter-zip",
    "name": "Ribbed Quarter-Zip",
    "category": "tops",
    "subcategory": "Sweatshirts & Hoodies",
    "subtype": "Quarter-Zip",
    "price": 42000,
    "description": "A sophisticated layering piece featuring a chunky metal zipper and a textured ribbed knit collar.",
    "material": "80% Cotton, 20% Wool Knitwear",
    "fit": "Relaxed fit. Ideal for layering over fine tees.",
    "care": "Hand wash cold or delicate dry clean. Lay flat to dry.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "slug": "collared-quarter-zip",
    "name": "Collared Quarter-Zip",
    "category": "tops",
    "subcategory": "Sweatshirts & Hoodies",
    "subtype": "Collared Quarter-Zip",
    "price": 44000,
    "description": "Features a structured turn-down collar and concealed zipper placket in brushed French terry cotton.",
    "material": "100% Heavyweight Cotton (420 GSM)",
    "fit": "Relaxed fit with clean tailored shoulders.",
    "care": "Machine wash cold. Do not tumble dry.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "slug": "standard-hoodie",
    "name": "Standard Hoodie",
    "category": "tops",
    "subcategory": "Sweatshirts & Hoodies",
    "subtype": "Standard Hoodie",
    "price": 35000,
    "description": "A clean, logo-free pullover hoodie with a double-lined hood and hidden side-seam pockets.",
    "material": "100% Heavyweight Cotton (450 GSM French Terry)",
    "fit": "Oversized fit. Dropped shoulders with roomy kangaroo pocket.",
    "care": "Machine wash cold. Tumble dry low.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "subtype": "Zip-through Hoodie",
    "price": 38000,
    "description": "Full-zip front with custom matte black metal hardware, dual pouch pockets, and dense ribbed trims.",
    "material": "100% Heavyweight Cotton",
    "fit": "Relaxed fit. Boxy drape through torso.",
    "care": "Machine wash cold inside out.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "subtype": "Classic Tailored Pants",
    "price": 38000,
    "description": "Sharp enough for the office, relaxed enough for dinner. Features single forward pleats and clean waistband extension.",
    "material": "Cotton Twill & Viscose Blend",
    "fit": "Tailored fit. Mid-rise waist.",
    "care": "Dry clean recommended.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "subtype": "Improved Tailored Pants",
    "price": 34000,
    "description": "An elevated chino trouser engineered with subtle internal waistband stretch and a modern slight taper.",
    "material": "100% Heavyweight Cotton Chino Twill",
    "fit": "Relaxed casual fit. True to size.",
    "care": "Machine wash cold. Warm iron.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "subtype": "",
    "price": 55000,
    "description": "Authentic 13.5oz red-line raw selvedge denim that will uniquely fade and mold to your body over time.",
    "material": "100% Japanese Selvedge Denim",
    "fit": "Relaxed straight fit with a slight break over footwear.",
    "care": "Wash sparingly inside out in cold water. Hang dry.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
    "images": {
      "primary": "/images/products/jeans-1.jpg",
      "gallery": [
        "/images/products/jeans-2.jpg"
      ]
    },
    "colors": [
      "Raw Indigo",
      "Washed Black"
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
    "id": "p-025",
    "slug": "wide-wale-corduroy-trousers",
    "name": "Corduroy Trousers",
    "category": "bottoms",
    "subcategory": "Corduroy Trousers",
    "subtype": "",
    "price": 46000,
    "description": "Plush 8-wale cotton corduroy trousers cut with a relaxed straight leg and deep slash pockets.",
    "material": "100% Heavyweight Cotton Corduroy",
    "fit": "Relaxed fit. Sits comfortably on natural waist.",
    "care": "Machine wash cold inside out. Hang dry. Do not iron directly on cords.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "subtype": "Utility pants in chinos",
    "price": 42000,
    "description": "Streamlined cargo pockets engineered to stay flat against the thigh for an uncluttered profile.",
    "material": "100% Cotton Chino Twill",
    "fit": "Relaxed fit with clean ankle taper.",
    "care": "Machine wash cold. Tumble dry low.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "subtype": "Utility pants in heavyweight cotton",
    "price": 44000,
    "description": "Constructed from heavy military-spec cotton canvas with articulated knees and drawstring hems.",
    "material": "100% Heavyweight Cotton Canvas",
    "fit": "Relaxed straight fit with adjustable hem drawcords.",
    "care": "Machine wash cold with like colors.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "subtype": "Cuffed",
    "price": 29000,
    "description": "Dense loopback cotton sweatpants finished with snug ribbed cuffs and braided drawcords.",
    "material": "100% Heavyweight Cotton (420 GSM Loopback)",
    "fit": "Relaxed fit with tapered cuffed ankles.",
    "care": "Machine wash cold. Hang dry.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "subtype": "Open-Hem",
    "price": 32000,
    "description": "Modern straight-leg sweatpants featuring a clean, unribbed open hem that drapes over luxury sneakers.",
    "material": "100% Heavyweight Cotton Fleece",
    "fit": "Relaxed straight leg fit with open hem drape.",
    "care": "Machine wash cold. Tumble dry delicate.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "subtype": "Sweatshorts",
    "price": 22000,
    "description": "Comfortable French terry shorts designed for warm-weather lounge with deep pockets and elastic waistband.",
    "material": "100% Heavyweight Cotton French Terry",
    "fit": "Relaxed fit. 6.5-inch inseam hitting above knee.",
    "care": "Machine wash cold. Hang dry.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "subtype": "Chino Shorts",
    "price": 24000,
    "description": "Tailored casual shorts cut from breathable cotton twill with welted back pockets.",
    "material": "100% Cotton Twill",
    "fit": "Relaxed fit with a 7-inch inseam.",
    "care": "Machine wash cold. Warm iron.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "id": "p-037",
    "slug": "ripstop-utility-shorts",
    "name": "Utility Shorts",
    "category": "bottoms",
    "subcategory": "Shorts",
    "subtype": "Utility Shorts",
    "price": 25000,
    "description": "Rugged ripstop utility shorts fitted with low-profile bellows pockets and quick-dry nylon blend.",
    "material": "100% Heavyweight Cotton Ripstop",
    "fit": "Relaxed fit. Roomy leg opening.",
    "care": "Machine wash cold.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
    "images": {
      "primary": "/images/products/shorts-1.jpg",
      "gallery": [
        "/images/products/shorts-2.jpg"
      ]
    },
    "colors": [
      "Olive",
      "Black"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "featured": false,
    "createdAt": "2023-05-14T00:00:00Z",
    "inStock": true
  },
  {
    "id": "p-029",
    "slug": "pleated-shorts",
    "name": "Pleated Shorts",
    "category": "bottoms",
    "subcategory": "Shorts",
    "subtype": "Pleated Shorts",
    "price": 26000,
    "description": "Double front pleats tailored from pure European flax linen for high-summer sophistication.",
    "material": "100% Premium European Linen",
    "fit": "Relaxed fit. Elegant drape.",
    "care": "Machine wash cold gentle cycle. Warm iron.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
    "images": {
      "primary": "/images/products/shorts-2.jpg",
      "gallery": [
        "/images/products/shorts-1.jpg"
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
    "subtype": "Denim",
    "price": 48000,
    "description": "A rugged yet refined overshirt with twin chest flap pockets. Functions effortlessly as a light jacket.",
    "material": "100% Cotton Denim",
    "fit": "Relaxed boxy fit designed for layering over hoodies or tees.",
    "care": "Machine wash cold inside out. Hang dry.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "slug": "heavyweight-corduroy-shacket",
    "name": "Corduroy Shacket",
    "category": "outerwear",
    "subcategory": "Overshirts & Shackets",
    "subtype": "Corduroy",
    "price": 54000,
    "description": "Warm, textural wide-wale corduroy overshirt jacket featuring horn buttons and satin-lined sleeve interiors.",
    "material": "100% Cotton Corduroy",
    "fit": "Oversized fit. Cut generous through body.",
    "care": "Dry clean or machine wash cold delicate. Do not tumble dry.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "subtype": "",
    "price": 58000,
    "description": "A textural masterpiece. This chunky knit cardigan provides deep warmth, ribbed trims, and authentic horn buttons.",
    "material": "100% Merino Wool Knitwear",
    "fit": "Relaxed fit with ribbed cuffs and hem.",
    "care": "Hand wash only in cold water with wool detergent. Dry flat.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "subtype": "",
    "price": 62000,
    "description": "Matching two-piece heavyweight tracksuit with minimalist zipper jacket and tapered coordinating sweatpants.",
    "material": "100% Heavyweight Cotton Fleece",
    "fit": "Relaxed fit.",
    "care": "Machine wash cold. Hang dry.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "subtype": "",
    "price": 34000,
    "description": "Breathable camp-collar shirt cut from airy, garment-washed linen that drapes naturally in tropical climates.",
    "material": "100% Premium European Linen",
    "fit": "Relaxed fit with vented straight hem.",
    "care": "Machine wash cold on gentle cycle. Hang to dry. Warm iron if desired.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "subtype": "",
    "price": 38000,
    "description": "Easy drawstring trousers made from pure European flax. Keeps you cool all day with an elegant drape.",
    "material": "100% Premium European Linen",
    "fit": "Relaxed fit with internal drawstring waistband.",
    "care": "Machine wash cold on gentle cycle. Hang dry.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "subtype": "",
    "price": 26000,
    "description": "Laid-back resort shorts featuring an elastic drawstring waistband and deep side pockets.",
    "material": "100% Premium European Linen",
    "fit": "Relaxed fit. Hits comfortably above knee.",
    "care": "Machine wash cold gentle cycle. Hang dry.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "id": "p-001",
    "slug": "the-linen-two-piece-set",
    "name": "The Linen Two-Piece Set",
    "category": "the-linen-shop",
    "subcategory": "Linen Tops",
    "subtype": "",
    "price": 45000,
    "description": "An effortlessly refined linen set designed for breathability and comfort. The pieces work together or as versatile separates.",
    "material": "100% Premium European Linen",
    "fit": "Relaxed fit. We recommend ordering your usual size.",
    "care": "Machine wash cold on gentle cycle. Hang to dry. Warm iron if needed.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "id": "p-035",
    "slug": "natural-cedar-wool-lint-roller",
    "name": "Natural Cedar & Wool Lint Roller",
    "category": "care-accessories",
    "subcategory": "Lint Rollers",
    "subtype": "",
    "price": 12000,
    "description": "An heirloom garment care tool. Turned natural cedar wood handle with extra-sticky adhesive sheets to keep garments immaculate.",
    "material": "Turned Natural Cedar Wood & Adhesive Sheets",
    "fit": "Standard One Size Tool",
    "care": "Wipe wooden handle with a damp cloth. Store in dry place.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
    "category": "care-accessories",
    "subcategory": "Tote Bag",
    "subtype": "",
    "price": 16000,
    "description": "Heavyweight 16oz cotton canvas tote with reinforced box-stitched handles and internal key loop.",
    "material": "100% Heavyweight Cotton Canvas (16oz)",
    "fit": "One Size (Dimensions: 42cm H x 38cm W x 10cm D)",
    "care": "Spot clean with mild soap and warm water. Air dry.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
  },
  {
    "id": "p-002",
    "slug": "heavyweight-cotton-lounge-set",
    "name": "Heavyweight Cotton Lounge Set",
    "category": "outerwear",
    "subcategory": "Track Suit",
    "subtype": "",
    "price": 52000,
    "description": "A structured yet comfortable lounge set crafted from heavyweight organic cotton. Perfect for travel or elevated weekend wear.",
    "material": "100% Heavyweight Organic Cotton (420 GSM)",
    "fit": "Relaxed fit with a slightly boxy drape.",
    "care": "Machine wash cold. Tumble dry low.",
    "shipping": "Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.",
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
  }
];
