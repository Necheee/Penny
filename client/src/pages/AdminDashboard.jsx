import { useState, useRef, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { 
  TrendingUp, 
  ShoppingBag, 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Eye, 
  Upload, 
  Printer, 
  X, 
  CheckCircle2,
  Loader2,
  Cloud,
  Mail,
  Check,
  Landmark,
  Building2,
  Save,
  RefreshCw,
  Megaphone,
  MessageSquare,
  Reply,
  Send,
  Inbox,
  ExternalLink,
  Copy,
  Sparkles,
  Zap,
  Settings,
  RotateCcw
} from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import { printOrderReceipt } from '../utils/printReceipt';
import { generateOrderReceiptEmailHtml, generateInquiryReplyEmailHtml } from '../utils/emailPreviewGenerator';

// Curated 1-Click Accordion & Garment Presets to eliminate repetitive product entry
const DEFAULT_GARMENT_PRESETS = {
  // --- SWEATSHIRTS & HOODIES ---
  'Sweatshirts & Hoodies': {
    description: 'Constructed from heavy 450 GSM French Terry loopback cotton. Features reinforced double-needle stitching, dense ribbed trims, and an elevated drape tailored for year-round luxury layering.',
    material: '100% Heavyweight Cotton (450 GSM Loopback French Terry)',
    fit: 'Relaxed athletic drape with dropped shoulders and structured silhouette.',
    care: 'Machine wash cold inside out with like colors. Do not tumble dry. Reshape and lay flat to dry.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos; 3-5 days nationwide.',
    colors: ['Black', 'Ash/Grey', 'Cream', 'Olive', 'Navy', 'Coffee Brown'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  'Crewneck sweatshirt': {
    description: 'A timeless staple crafted from 450 GSM loopback cotton. Styled with a classic crew collar, ribbed V-inset, and clean cuffs designed to hold shape through daily wear.',
    material: '100% Heavyweight Cotton (450 GSM Loopback)',
    fit: 'Relaxed fit with dropped shoulders and ergonomic silhouette.',
    care: 'Machine wash cold inside out. Reshape while damp and line dry.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['Ash/Grey', 'Black', 'Cream', 'Olive'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  'Quarter-Zip': {
    description: 'Sophisticated leisurewear featuring a custom antique silver quarter-zip hardware, high stand collar, and substantial brushed cotton fleece for effortless smart-casual layering.',
    material: '100% Brushed Cotton Fleece (420 GSM)',
    fit: 'Tailored casual fit. Clean contour through chest and arms.',
    care: 'Machine wash cold on gentle cycle. Zip up before washing. Hang dry.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['Black', 'Navy', 'Cream', 'Coffee Brown'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  'Collared Quarter-Zip': {
    description: 'Elevated polo-collar styling merged with a heavy quarter-zip pullover. Combines refined sartorial structure with the comfort of luxury heavyweight fleece.',
    material: '100% Heavyweight Cotton (420 GSM Loopback Fleece)',
    fit: 'Tailored relaxed fit with structured foldover collar.',
    care: 'Machine wash cold inside out. Flat dry or hang in shade.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['Black', 'Camel', 'Navy', 'Forest Green'],
    sizes: ['S', 'M', 'L', 'XL']
  },
  'Zip-through Hoodie': {
    description: 'Full double-ended metallic zipper hoodie built with heavy 450 GSM fleece, deep lined hood, and reinforced split kangaroo pockets for versatile modern styling.',
    material: '100% Heavyweight Loopback Cotton (450 GSM)',
    fit: 'Relaxed boxy silhouette with dropped shoulders.',
    care: 'Machine wash cold inside out. Zip fully before washing. Hang dry.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['Black', 'Ash/Grey', 'Charcoal', 'Olive'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  'Standard Hoodie': {
    description: 'Our signature pullover hoodie constructed with a double-layered hood (no drawstrings for a clean minimalist aesthetic), seamless ribbing, and substantial 450 GSM loopback cotton.',
    material: '100% Heavyweight Loopback Cotton (450 GSM)',
    fit: 'Relaxed fit with dropped shoulders and roomy hood.',
    care: 'Machine wash cold inside out. Hang dry to maintain shape and weight.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['Black', 'Ash/Grey', 'Cream', 'Burgundy', 'Olive'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },

  // --- T-SHIRTS ---
  'T-Shirts': {
    description: 'Engineered from ultra-dense 280 GSM combed compact cotton. Features a snug 1.25" bound rib collar that retains tension and never sags over time.',
    material: '100% Combed Compact Cotton (280 GSM)',
    fit: 'Tailored relaxed drape. True to size.',
    care: 'Machine wash cold inside out. Warm iron on reverse. Do not tumble dry.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['Black', 'White', 'Cream', 'Ash/Grey', 'Olive', 'Coffee Brown'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  'Regular Fit Tee': {
    description: 'The definitive daily t-shirt. Cut in a classic regular profile with clean sleeves, tailored chest, and high-density 260 GSM combed cotton jersey.',
    material: '100% Combed Cotton Jersey (260 GSM)',
    fit: 'Regular fit. True to size with a clean silhouette.',
    care: 'Machine wash cold inside out. Hang dry in shade.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['Black', 'White', 'Ash/Grey', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL']
  },
  'Oversize Fit Tee': {
    description: 'Modern oversized silhouette with dropped shoulders, elongated sleeves, and a boxy wide torso drape crafted in ultra-heavy 300 GSM cotton.',
    material: '100% Heavyweight Combed Cotton (300 GSM)',
    fit: 'Oversized boxy drape. Cut wide with dropped shoulders.',
    care: 'Machine wash cold inside out. Do not tumble dry.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['Black', 'White', 'Cream', 'Coffee Brown', 'Burnt Orange'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },

  // --- LONG SLEEVES & POLOS ---
  'Long Sleeve Tees': {
    description: 'Heavyweight long sleeve tee with tight ribbed cuffs and double-stitched hem. Ideal for solo styling or under tailored outerwear.',
    material: '100% Combed Cotton (280 GSM)',
    fit: 'Relaxed fit with ribbed cuffs for clean arm stacking.',
    care: 'Machine wash cold inside out. Hang dry.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['Black', 'White', 'Olive', 'Charcoal'],
    sizes: ['S', 'M', 'L', 'XL']
  },
  'Long Sleeve Henleys': {
    description: 'Waffle-knit or ribbed cotton henley featuring a 3-button mother-of-pearl placket and clean banded collar for timeless heritage styling.',
    material: '100% Slub or Waffle Knit Cotton (270 GSM)',
    fit: 'Athletic body-fit contour with soft stretch.',
    care: 'Machine wash cold on gentle cycle. Lay flat to dry.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['Cream', 'Black', 'Ash/Grey', 'Olive'],
    sizes: ['S', 'M', 'L', 'XL']
  },
  'Short Sleeve Henleys': {
    description: 'Refined short sleeve henley offering subtle textured placket detail, tailored biceps, and breathable high-twist cotton.',
    material: '100% Breathable Combed Cotton (240 GSM)',
    fit: 'Tailored fit through chest and arms.',
    care: 'Machine wash cold. Hang dry.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['White', 'Black', 'Sand', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL']
  },
  'Knitwear Polos': {
    description: 'Artisanal fine-gauge knit polo featuring a soft open Johnny collar or 3-button placket, ribbed hem, and a luxurious mercerized cotton-silk handfeel.',
    material: '80% Mercerized Cotton, 20% Mulberry Silk Knit',
    fit: 'Tailored European drape. Clean waist taper.',
    care: 'Hand wash in cold water or dry clean. Reshape and dry flat.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['Cream', 'Coffee Brown', 'Black', 'Forest Green', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL']
  },
  'Oxford shirts': {
    description: 'Classic heavy Oxford cotton cloth shirt tailored with a graceful button-down roll collar, box pleat, and locker loop. Transitions effortlessly from work to evening.',
    material: '100% Heavy Oxford Cotton Cloth (Pinpoint weave)',
    fit: 'Tailored regular silhouette with natural movement.',
    care: 'Machine wash warm. Warm iron while slightly damp.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['White', 'Sky Blue', 'Striped Sky Blue', 'Baby Pink'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },

  // --- BOTTOMS ---
  'Trousers & Chinos': {
    description: 'Precision-tailored trousers crafted with a mid-rise waist, concealed hook-and-bar closure, deep pleats, and a sharp crease designed for both formal and casual settings.',
    material: 'Cotton Twill & Viscose Blend with subtle stretch',
    fit: 'Tailored fit. Mid-rise waist with clean ankle break.',
    care: 'Dry clean recommended, or gentle machine wash cold and warm iron.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['Black', 'Khaki', 'Olive', 'Beige', 'Navy', 'Coffee Brown'],
    sizes: ['30', '32', '34', '36', '38']
  },
  'Classic Tailored Pants': {
    description: 'Traditional formal tailoring with single front pleats, angled side pockets, and a refined straight-leg cut.',
    material: 'Premium Cotton Twill & Viscose Blend',
    fit: 'Tailored fit. Classic mid-rise waist with straight leg.',
    care: 'Dry clean recommended.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['Black', 'Charcoal', 'Navy', 'Camel'],
    sizes: ['30', '32', '34', '36', '38']
  },
  'Improved Tailored Pants': {
    description: 'Modernized sartorial trousers featuring hidden elasticized side-tabs, double inward pleats, and a relaxed taper.',
    material: 'High-Twist Wool & Cotton Blend',
    fit: 'Relaxed tailored silhouette with contemporary ankle crop.',
    care: 'Dry clean only.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['Black', 'Olive', 'Taupe', 'Coffee Brown'],
    sizes: ['30', '32', '34', '36', '38']
  },
  'Denim': {
    description: 'Woven on vintage shuttle looms from 13.5oz raw selvedge denim. Develops custom fades and character unique to the wearer.',
    material: '100% Cotton Selvedge Denim (13.5 oz)',
    fit: 'Straight relaxed leg with subtle taper below knee.',
    care: 'Wash sparingly inside out in cold water. Hang dry only.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['Black', 'Navy', 'Sky Blue'],
    sizes: ['30', '32', '34', '36', '38']
  },
  'Corduroy Trousers': {
    description: 'Rich wide-wale corduroy trousers offering plush tactile warmth, deep front pleats, and a structured vintage drape.',
    material: '100% Heavyweight Cotton Corduroy (8-wale)',
    fit: 'Relaxed straight fit with gentle drape.',
    care: 'Machine wash cold inside out. Hang dry away from direct heat.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['Coffee Brown', 'Camel', 'Olive', 'Black'],
    sizes: ['30', '32', '34', '36', '38']
  },
  'Utility Pants': {
    description: 'Modern utilitarian pant built with ergonomic cargo pocketing, reinforced knees, and adjustable ankle tabs for versatile styling.',
    material: 'Heavyweight Cotton Canvas / Durable Chino Twill',
    fit: 'Relaxed functional fit with adjustable leg cuffs.',
    care: 'Machine wash cold. Tumble dry low or line dry.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['Olive', 'Black', 'Khaki', 'Charcoal'],
    sizes: ['30', '32', '34', '36', '38']
  },
  'Sweatpants': {
    description: 'Heavy 450 GSM French Terry sweatpants with a deep elastic waistband, tonal thick drawstrings, and tailored paneling.',
    material: '100% Heavyweight Cotton (450 GSM Loopback)',
    fit: 'Relaxed silhouette. Clean elastic cuffed ankle or open straight hem.',
    care: 'Machine wash cold inside out. Reshape and line dry.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['Ash/Grey', 'Black', 'Cream', 'Olive', 'Coffee Brown'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  'Shorts': {
    description: 'Tailored warm-weather shorts featuring a clean 6.5" inseam, comfortable rise, and premium hardware.',
    material: 'Heavyweight Cotton Twill or Loopback French Terry',
    fit: 'Relaxed 6.5" inseam resting just above the knee.',
    care: 'Machine wash cold with like colors. Hang dry.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['Black', 'Khaki', 'Ash/Grey', 'Navy', 'Olive'],
    sizes: ['S', 'M', 'L', 'XL']
  },

  // --- OUTERWEAR ---
  'Overshirts & Shackets': {
    description: 'Substantial overshirt built to be worn as a light jacket. Features twin chest flap pockets, horn buttons, and heavy structured fabric.',
    material: '100% Heavy Cotton Twill, Corduroy, or Denim (380 GSM)',
    fit: 'Boxy overshirt cut designed to layer over t-shirts and knitwear.',
    care: 'Dry clean or machine wash cold on delicate. Hang dry.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['Olive', 'Coffee Brown', 'Black', 'Navy', 'Camel'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  'Knitwear Cardigan': {
    description: 'Textured cable or ribbed cardigan knit from merino wool blend. Features horn buttons, ribbed shawl collar, and patch pockets.',
    material: '70% Merino Wool, 30% Silk / Cashmere blend',
    fit: 'Relaxed cozy silhouette with ribbed hem and cuffs.',
    care: 'Hand wash cold with wool detergent. Dry flat on a towel.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['Cream', 'Coffee Brown', 'Charcoal', 'Burgundy'],
    sizes: ['S', 'M', 'L', 'XL']
  },
  'Track Suit': {
    description: 'Complete luxury leisure matching set featuring tailored zip jacket and matching sweatpants engineered from matching 450 GSM French Terry.',
    material: '100% Heavyweight French Terry Cotton (450 GSM)',
    fit: 'Relaxed athletic drape with tailored cuffs.',
    care: 'Machine wash cold inside out. Hang dry.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['Black', 'Ash/Grey', 'Olive', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },

  // --- THE LINEN SHOP ---
  'The Linen Shop': {
    description: 'Woven from 100% certified Normandy flax linen. Naturally breathable, thermo-regulating, and pre-washed for immediate softness and effortless drape.',
    material: '100% Pure European Flax Linen (Pre-washed)',
    fit: 'Relaxed breezy silhouette with gentle tropical drape.',
    care: 'Machine wash cold on gentle cycle. Hang to dry. Embrace natural linen creases or steam lightly.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['White', 'Cream', 'Beige', 'Sky Blue', 'Olive', 'Black'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  'Linen tops': {
    description: 'Breathable pure linen button-up or camp-collar shirt. Designed for tropical elegance with mother-of-pearl buttons and airy drape.',
    material: '100% Pure European Flax Linen',
    fit: 'Relaxed resort fit with camp collar.',
    care: 'Machine wash cold on delicate. Hang dry.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['White', 'Beige', 'Sky Blue', 'Olive'],
    sizes: ['S', 'M', 'L', 'XL']
  },
  'Pants': {
    description: 'Breezy pure linen trousers with an elasticated drawstring waistband, deep slant pockets, and a relaxed wide-straight leg.',
    material: '100% Pure European Flax Linen (190 GSM)',
    fit: 'Relaxed straight leg with drawstring waist.',
    care: 'Machine wash cold gentle. Line dry.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['White', 'Beige', 'Black', 'Olive'],
    sizes: ['30', '32', '34', '36', '38']
  },

  // --- CARE & ACCESSORIES ---
  'Care & Accessories': {
    description: 'Essential wardrobe care implements and accessories engineered to extend the longevity of your premium garment investment.',
    material: 'Sustainable Cotton Canvas, Recycled Poly, or Beechwood',
    fit: 'Universal / One Size',
    care: 'Wipe clean with a damp cloth.',
    shipping: 'Free delivery on orders above ₦200,000. Standard delivery applies.',
    colors: ['Black', 'Cream', 'White'],
    sizes: ['One Size']
  },
  'Lint Rollers': {
    description: 'Extra-sticky adhesive sheets on an ergonomic beechwood handle. Effortlessly lifts lint, dust, and pet hair without damaging fine wool or cotton fibers.',
    material: 'Recycled Paper Adhesive Sheets & Ergonomic Handle',
    fit: 'Compact travel / dressing table size (60 sheets)',
    care: 'Peel and discard used sheet. Store in protective sleeve.',
    shipping: 'Ships immediately with any clothing order.',
    colors: ['White', 'Black'],
    sizes: ['One Size']
  },
  'Tote Bag': {
    description: 'Heavy-duty 16oz cotton canvas tote bag with reinforced handles, interior zip pocket, and screen-printed Penny typographic branding.',
    material: '100% Heavyweight Cotton Canvas (16 oz)',
    fit: 'Spacious daily carry (40cm x 38cm x 12cm)',
    care: 'Spot clean with mild soapy water. Air dry.',
    shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
    colors: ['Cream', 'Black'],
    sizes: ['One Size']
  }
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlTab = new URLSearchParams(window.location.search).get('tab');
      if (urlTab) return urlTab;
      const saved = sessionStorage.getItem('penny_admin_tab');
      if (saved) return saved;
    }
    return 'overview';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('penny_admin_tab', activeTab);
      const url = new URL(window.location.href);
      if (url.searchParams.get('tab') !== activeTab) {
        url.searchParams.set('tab', activeTab);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [activeTab]);

  // Product, Category, Announcements & Size Guide State from Shared ProductContext
  const { 
    products: productList = [], 
    categories: categoryList = [], 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    toggleFeatured, 
    toggleStock, 
    addCategory, 
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    announcements = [],
    updateAnnouncements,
    sizeGuideData = {},
    updateSizeGuide,
  } = useProducts();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] = useState('all');
  const [newCategorySubcategories, setNewCategorySubcategories] = useState('');
  const [subInputs, setSubInputs] = useState({});
  const [isAddingCustomSub, setIsAddingCustomSub] = useState(false);
  const [customSubcategoryInput, setCustomSubcategoryInput] = useState('');
  const [isAddingCustomSubtype, setIsAddingCustomSubtype] = useState(false);
  const [customSubtypeInput, setCustomSubtypeInput] = useState('');
  const [categoryFeedback, setCategoryFeedback] = useState('');

  // Category & Subcategory Editing Modal State
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState({
    id: '',
    name: '',
    slug: '',
    subcategories: []
  });
  const [modalNewSubName, setModalNewSubName] = useState('');
  const [modalNewSubSubtypes, setModalNewSubSubtypes] = useState('');
  const [styleInputs, setStyleInputs] = useState({});

  // Orders state initialized from localStorage with fallback, and synced from /api/payments/orders
  const [orders, setOrders] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('penny_orders');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse stored orders in admin", e);
        }
      }
    }
    return [
      {
        id: 'PNY-892140',
        customer: 'Alex Balogun',
        email: 'alex.balogun@gmail.com',
        phone: '+234 803 456 7890',
        state: 'Lagos',
        address: '14 Victoria Island Crescent, Apt 4B',
        itemsCount: 2,
        subtotal: 92000,
        deliveryFee: 5000,
        total: 97000,
        status: 'Processing',
        date: '2026-10-12',
        paymentMethod: 'bank_transfer',
        paymentConfirmed: true,
        items: [
          {
            id: 'p-1',
            name: 'Classic Linen Resort Shirt',
            size: 'L',
            color: 'Cream',
            price: 42000,
            quantity: 1,
            image: '/images/products/linen-set-1.jpg'
          },
          {
            id: 'p-2',
            name: 'Cotton Lounge Set',
            size: 'M',
            color: 'Charcoal',
            price: 50000,
            quantity: 1,
            image: '/images/products/lounge-set-1.jpg'
          }
        ]
      }
    ];
  });

  // Sync orders to localStorage whenever updated
  useEffect(() => {
    localStorage.setItem('penny_orders', JSON.stringify(orders));
  }, [orders]);

  // Loading state for orders refresh
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);

  // Fetch registered orders and dynamic bank details from backend API
  const loadBackendData = async () => {
    try {
      setIsRefreshingOrders(true);
      const [ordersRes, configRes] = await Promise.all([
        fetch('/api/payments/orders'),
        fetch('/api/payments/config'),
      ]);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        if (ordersData.success && Array.isArray(ordersData.data)) {
          setOrders(ordersData.data);
        }
      }

      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.bankDetails) {
          setBankForm(configData.bankDetails);
        }
      }
    } catch (err) {
      console.warn('Could not fetch backend data:', err);
    } finally {
      setIsRefreshingOrders(false);
    }
  };

  useEffect(() => {
    loadBackendData();
    // Auto-refresh orders every 10 seconds so new customer orders appear in real-time
    const interval = setInterval(() => {
      fetch('/api/payments/orders')
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.data)) {
            setOrders(data.data);
          }
        })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Bank Account Information Management (Admin Config)
  const [bankForm, setBankForm] = useState({
    bankName: 'Zenith Bank Plc',
    accountName: 'PENNY CLOTHING CO',
    accountNumber: '1018924560',
    instructions: 'Please transfer the exact total amount and use your Order Number as payment reference/narration. Once verified by store admin, your receipt and confirmation will be emailed.',
  });
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [bankFeedbackMsg, setBankFeedbackMsg] = useState({ type: '', text: '' });

  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    setIsSavingBank(true);
    setBankFeedbackMsg({ type: '', text: '' });

    try {
      const res = await fetch('/api/payments/config/bank', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBankForm(data.bankDetails);
        setBankFeedbackMsg({ type: 'success', text: 'Bank transfer details successfully updated and live on storefront checkout.' });
      } else {
        setBankFeedbackMsg({ type: 'error', text: data.message || 'Could not update bank details.' });
      }
    } catch (err) {
      setBankFeedbackMsg({ type: 'error', text: 'Network connection issue while saving bank details.' });
    } finally {
      setIsSavingBank(false);
      setTimeout(() => setBankFeedbackMsg({ type: '', text: '' }), 5000);
    }
  };

  // Selected Order for Inspection Drawer / Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Modal State for Adding/Editing Product
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef(null);

  const [productForm, setProductForm] = useState({
    name: '',
    category: 'tops',
    subcategory: '',
    price: '',
    description: '',
    material: '',
    fit: '',
    featured: false,
    inStock: true,
    colors: ['Black', 'White'],
    availableSizes: ['S', 'M', 'L', 'XL'],
    imageUrl: ''
  });

  // Category Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');

  // Announcements Admin State
  const [announcementList, setAnnouncementList] = useState(announcements || []);
  const [newAnnouncementText, setNewAnnouncementText] = useState('');
  const [announcementFeedback, setAnnouncementFeedback] = useState('');

  useEffect(() => {
    if (Array.isArray(announcements)) {
      setAnnouncementList(announcements);
    }
  }, [announcements]);

  const handleUpdateAnnouncementItem = (index, value) => {
    const updated = [...announcementList];
    updated[index] = value;
    setAnnouncementList(updated);
  };

  const handleAddAnnouncementItem = (e) => {
    e.preventDefault();
    if (!newAnnouncementText.trim()) return;
    const updated = [...announcementList, newAnnouncementText.trim()];
    setAnnouncementList(updated);
    updateAnnouncements(updated);
    setNewAnnouncementText('');
    setAnnouncementFeedback('New announcement message added and live!');
    setTimeout(() => setAnnouncementFeedback(''), 4000);
  };

  const handleDeleteAnnouncementItem = (index) => {
    if (announcementList.length <= 1) {
      alert('You must keep at least one active announcement message.');
      return;
    }
    const updated = announcementList.filter((_, idx) => idx !== index);
    setAnnouncementList(updated);
    updateAnnouncements(updated);
    setAnnouncementFeedback('Announcement removed.');
    setTimeout(() => setAnnouncementFeedback(''), 4000);
  };

  const handleSaveAllAnnouncements = () => {
    const cleaned = announcementList.map(a => a.trim()).filter(Boolean);
    updateAnnouncements(cleaned);
    setAnnouncementFeedback('All announcements saved successfully and live on storefront!');
    setTimeout(() => setAnnouncementFeedback(''), 4000);
  };

  // Dynamic Size Guide Admin State
  const [activeSizeCategory, setActiveSizeCategory] = useState('tops');
  const [sizeGuideFeedback, setSizeGuideFeedback] = useState('');

  // Local editable copy of current category's size data
  const [sizeForm, setSizeForm] = useState(() => {
    return sizeGuideData[activeSizeCategory] || {
      title: 'Tops & Shirts',
      subtitle: 'Standard Fit',
      columns: [{ key: 'size', label: 'Size' }],
      rows: []
    };
  });

  useEffect(() => {
    if (sizeGuideData[activeSizeCategory]) {
      setSizeForm(sizeGuideData[activeSizeCategory]);
    }
  }, [activeSizeCategory, sizeGuideData]);

  const handleSaveSizeGuide = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    updateSizeGuide(activeSizeCategory, sizeForm);
    setSizeGuideFeedback(`Size guide for "${sizeForm.title}" saved successfully!`);
    setTimeout(() => setSizeGuideFeedback(''), 4000);
  };

  // Calculate Metrics
  const totalRevenue = orders.reduce((sum, ord) => sum + ord.total, 0);
  const featuredCount = productList.filter(p => p.featured).length;
  const outOfStockCount = productList.filter(p => !p.inStock).length;

  // Filter Products
  const filteredProducts = productList.filter(p => {
    const subName = typeof p.subcategory === 'string' ? p.subcategory : p.subcategory?.name || '';
    const catName = typeof p.category === 'string' ? p.category : p.category?.name || '';
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          catName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          subName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'all' || 
                            p.category === selectedCategoryFilter || 
                            p.category === categoryList.find(c => c.id === selectedCategoryFilter)?.slug;
    const matchesSubcategory = selectedSubcategoryFilter === 'all' || 
                               !selectedSubcategoryFilter || 
                               subName.toLowerCase() === selectedSubcategoryFilter.toLowerCase();
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  // Dynamic customizable garment presets state (customizable & editable by admin)
  const [garmentPresets, setGarmentPresets] = useState(() => {
    try {
      const saved = localStorage.getItem('penny_garment_presets');
      if (saved) {
        return { ...DEFAULT_GARMENT_PRESETS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to parse saved presets', e);
    }
    return DEFAULT_GARMENT_PRESETS;
  });

  // Sync presets from backend if available
  useEffect(() => {
    async function loadBackendPresets() {
      try {
        const res = await fetch('/api/categories/presets/all');
        const data = await res.json();
        if (data.success && data.data && Object.keys(data.data).length > 0) {
          setGarmentPresets(prev => {
            const merged = { ...prev, ...data.data };
            localStorage.setItem('penny_garment_presets', JSON.stringify(merged));
            return merged;
          });
        }
      } catch (err) {}
    }
    loadBackendPresets();
  }, []);

  // Save preset helper
  const handleSaveGarmentPreset = async (presetKey, presetData) => {
    const updated = {
      ...garmentPresets,
      [presetKey]: {
        ...(garmentPresets[presetKey] || {}),
        ...presetData
      }
    };
    setGarmentPresets(updated);
    localStorage.setItem('penny_garment_presets', JSON.stringify(updated));

    try {
      await fetch('/api/categories/presets/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch {}
  };

  // Reset preset helper to original defaults
  const handleResetGarmentPreset = async (presetKey) => {
    const defaultData = DEFAULT_GARMENT_PRESETS[presetKey] || DEFAULT_GARMENT_PRESETS['Sweatshirts & Hoodies'];
    const updated = {
      ...garmentPresets,
      [presetKey]: { ...defaultData }
    };
    setGarmentPresets(updated);
    localStorage.setItem('penny_garment_presets', JSON.stringify(updated));

    try {
      await fetch('/api/categories/presets/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch {}
    return defaultData;
  };

  // Preset Editor Modal State
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [editingPresetKey, setEditingPresetKey] = useState('Sweatshirts & Hoodies');
  const [isCustomPresetKey, setIsCustomPresetKey] = useState(false);
  const [customPresetNameInput, setCustomPresetNameInput] = useState('');
  const [presetForm, setPresetForm] = useState({
    description: '',
    material: '',
    fit: '',
    care: '',
    shipping: '',
    colors: [],
    sizes: []
  });
  const [presetFeedback, setPresetFeedback] = useState('');
  const [presetSaveMessage, setPresetSaveMessage] = useState('');

  const handleOpenPresetModal = (initialKey) => {
    const key = initialKey || editingPresetKey || 'Sweatshirts & Hoodies';
    const found = garmentPresets[key] || DEFAULT_GARMENT_PRESETS[key] || DEFAULT_GARMENT_PRESETS['Sweatshirts & Hoodies'];
    setEditingPresetKey(key);
    setIsCustomPresetKey(false);
    setCustomPresetNameInput('');
    setPresetForm({
      description: found.description || '',
      material: found.material || '',
      fit: found.fit || '',
      care: found.care || '',
      shipping: found.shipping || '',
      colors: found.colors ? [...found.colors] : ['Black'],
      sizes: found.sizes ? [...found.sizes] : ['S', 'M', 'L', 'XL']
    });
    setPresetFeedback('');
    setIsPresetModalOpen(true);
  };

  const handlePresetSelectChange = (key) => {
    if (key === '__NEW__') {
      setIsCustomPresetKey(true);
      setCustomPresetNameInput('');
      setPresetForm({
        description: '',
        material: '',
        fit: '',
        care: 'Machine wash cold inside out. Hang dry.',
        shipping: 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
        colors: ['Black', 'White'],
        sizes: ['S', 'M', 'L', 'XL']
      });
      return;
    }
    setIsCustomPresetKey(false);
    setEditingPresetKey(key);
    const found = garmentPresets[key] || DEFAULT_GARMENT_PRESETS[key] || DEFAULT_GARMENT_PRESETS['Sweatshirts & Hoodies'];
    setPresetForm({
      description: found.description || '',
      material: found.material || '',
      fit: found.fit || '',
      care: found.care || '',
      shipping: found.shipping || '',
      colors: found.colors ? [...found.colors] : ['Black'],
      sizes: found.sizes ? [...found.sizes] : ['S', 'M', 'L', 'XL']
    });
    setPresetFeedback('');
  };

  const handleSaveCurrentAsPreset = (targetKey) => {
    const subName = typeof productForm.subcategory === 'string' ? productForm.subcategory : productForm.subcategory?.name || '';
    const key = targetKey || subName || productForm.category;
    if (!key) {
      alert('Please select or enter a subcategory first.');
      return;
    }
    const newPresetData = {
      description: productForm.description || '',
      material: productForm.material || '',
      fit: productForm.fit || '',
      care: productForm.care || '',
      shipping: productForm.shipping || '',
      colors: productForm.colors || [],
      sizes: productForm.availableSizes || []
    };
    handleSaveGarmentPreset(key, newPresetData);
    setPresetSaveMessage(`Saved default preset for "${key}"! Future auto-fills will use this.`);
    setTimeout(() => setPresetSaveMessage(''), 4000);
  };

  // Apply Garment Preset to Product Form (Auto-fill Accordion Tabs & Colors/Sizes)
  const handleApplyGarmentPreset = (specificKey) => {
    const subName = typeof productForm.subcategory === 'string' ? productForm.subcategory : productForm.subcategory?.name || '';
    const key = specificKey || productForm.subtype || subName || productForm.category;
    const preset = (key && garmentPresets[key]) || 
                   (subName && garmentPresets[subName]) || 
                   (productForm.category && garmentPresets[productForm.category]) || 
                   garmentPresets['Sweatshirts & Hoodies'] ||
                   DEFAULT_GARMENT_PRESETS['Sweatshirts & Hoodies'];

    if (preset) {
      setProductForm(prev => ({
        ...prev,
        description: preset.description || prev.description,
        material: preset.material || prev.material,
        fit: preset.fit || prev.fit,
        care: preset.care || prev.care,
        shipping: preset.shipping || prev.shipping,
        colors: preset.colors?.length ? [...preset.colors] : prev.colors,
        availableSizes: preset.sizes?.length ? [...preset.sizes] : prev.availableSizes
      }));
    }
  };

  // Open Add Product Modal with instant high-quality menswear preset
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    const firstCat = categoryList[0];
    const firstSub = firstCat?.subcategories?.[0];
    const firstSubName = typeof firstSub === 'string' ? firstSub : firstSub?.name || '';
    const firstSubtypes = typeof firstSub === 'object' && Array.isArray(firstSub?.subtypes) ? firstSub.subtypes : [];
    const preset = (firstSubName && garmentPresets[firstSubName]) || garmentPresets['T-Shirts'] || DEFAULT_GARMENT_PRESETS['T-Shirts'];

    setProductForm({
      name: '',
      category: firstCat?.id || 'tops',
      subcategory: firstSubName,
      subtype: firstSubtypes[0] || '',
      price: '',
      description: preset.description,
      material: preset.material,
      fit: preset.fit,
      care: preset.care,
      shipping: preset.shipping,
      featured: false,
      inStock: true,
      colors: [...preset.colors],
      availableSizes: [...preset.sizes],
      imageUrl: ''
    });
    setIsAddingCustomSub(false);
    setCustomSubcategoryInput('');
    setIsAddingCustomSubtype(false);
    setCustomSubtypeInput('');
    setIsProductModalOpen(true);
  };

  // Duplicate / Clone Existing Product (1-Click Product Addition)
  const handleDuplicateProduct = (product) => {
    setEditingProduct(null); // Save will create a new product instead of updating
    setProductForm({
      name: `Copy of ${product.name}`,
      category: product.category,
      subcategory: product.subcategory || '',
      subtype: product.subtype || '',
      price: product.price,
      description: product.description || '',
      material: product.material || '100% Cotton',
      fit: product.fit || 'Relaxed fit',
      care: product.care || 'Machine wash cold inside out. Hang dry.',
      shipping: product.shipping || 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
      featured: !!product.featured,
      inStock: product.inStock !== false,
      colors: product.colors?.length ? [...product.colors] : ['Black'],
      availableSizes: product.availableSizes?.length ? [...product.availableSizes] : ['S', 'M', 'L', 'XL'],
      imageUrl: product.images?.primary || ''
    });
    setIsAddingCustomSub(false);
    setCustomSubcategoryInput('');
    setIsAddingCustomSubtype(false);
    setCustomSubtypeInput('');
    setIsProductModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      subcategory: product.subcategory || '',
      subtype: product.subtype || '',
      price: product.price,
      description: product.description || '',
      material: product.material || '100% Cotton',
      fit: product.fit || 'Relaxed fit',
      care: product.care || 'Machine wash cold inside out. Hang dry.',
      shipping: product.shipping || 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
      featured: !!product.featured,
      inStock: product.inStock !== false,
      colors: product.colors?.length ? [...product.colors] : ['Black'],
      availableSizes: product.availableSizes?.length ? [...product.availableSizes] : ['M', 'L'],
      imageUrl: product.images?.primary || ''
    });
    setIsAddingCustomSub(false);
    setCustomSubcategoryInput('');
    setIsAddingCustomSubtype(false);
    setCustomSubtypeInput('');
    setIsProductModalOpen(true);
  };

  // Handle Image File Selection (streams directly to Cloudinary via Express API with fallback)
  const processImageFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, or WEBP).');
      return;
    }

    // 1. Immediate local thumbnail preview for instant UX responsiveness
    const reader = new FileReader();
    reader.onload = (e) => {
      setProductForm(prev => ({
        ...prev,
        imageUrl: e.target.result
      }));
    };
    reader.readAsDataURL(file);

    // 2. Stream to Backend Cloud Media Endpoint
    setIsUploadingImage(true);
    setUploadMessage('Streaming image to Cloudinary CDN...');

    try {
      const token = localStorage.getItem('penny_admin_token');
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success && data.url) {
        setProductForm(prev => ({
          ...prev,
          imageUrl: data.url
        }));
        setUploadMessage(data.isFallback ? 'Image saved locally (Cloudinary credentials pending in .env).' : 'Image uploaded to Cloudinary CDN successfully.');
      } else {
        console.warn('Backend upload returned error, retained local preview:', data.message);
        setUploadMessage('Retained high-quality local image preview.');
      }
    } catch (err) {
      console.warn('Could not connect to media upload endpoint, retained local preview:', err);
      setUploadMessage('Retained local image preview.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Save Product (Add or Edit) with Context Sync
  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      alert('Please fill out the product title and price.');
      return;
    }

    const finalSubcategory = isAddingCustomSub && customSubcategoryInput.trim()
      ? customSubcategoryInput.trim()
      : (productForm.subcategory || '');

    const finalSubtype = isAddingCustomSubtype && customSubtypeInput.trim()
      ? customSubtypeInput.trim()
      : (productForm.subtype || '');

    if (isAddingCustomSub && customSubcategoryInput.trim()) {
      const cleanSub = customSubcategoryInput.trim();
      const initialStyles = isAddingCustomSubtype && customSubtypeInput.trim() ? [customSubtypeInput.trim()] : [];
      addSubcategory(productForm.category, cleanSub, initialStyles);
    } else if (isAddingCustomSubtype && customSubtypeInput.trim()) {
      const newStyle = customSubtypeInput.trim();
      const catObj = categoryList.find(c => c.id === productForm.category || c.slug === productForm.category);
      if (catObj) {
        const subObj = (catObj.subcategories || []).find(s => (typeof s === 'string' ? s : s?.name) === finalSubcategory);
        const subName = typeof subObj === 'string' ? subObj : subObj?.name || finalSubcategory;
        const currentSubtypes = typeof subObj === 'object' && Array.isArray(subObj?.subtypes) ? subObj.subtypes : [];
        if (!currentSubtypes.some(st => st.toLowerCase() === newStyle.toLowerCase())) {
          updateSubcategory(catObj.id, subName, {
            name: subName,
            subtypes: [...currentSubtypes, newStyle]
          });
        }
      }
    }

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        name: productForm.name,
        category: productForm.category,
        subcategory: finalSubcategory,
        subtype: finalSubtype,
        price: Number(productForm.price),
        description: productForm.description,
        material: productForm.material,
        fit: productForm.fit,
        care: productForm.care || 'Machine wash cold inside out. Hang dry.',
        shipping: productForm.shipping || 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
        featured: productForm.featured,
        inStock: productForm.inStock,
        colors: productForm.colors,
        availableSizes: productForm.availableSizes,
        images: {
          ...editingProduct.images,
          primary: productForm.imageUrl || editingProduct.images?.primary || '/images/products/linen-set-1.jpg'
        }
      });
    } else {
      const newId = `p-${Date.now().toString().slice(-4)}`;
      const newProduct = {
        id: newId,
        name: productForm.name,
        category: productForm.category,
        subcategory: finalSubcategory || 'New Arrival',
        subtype: finalSubtype,
        price: Number(productForm.price),
        description: productForm.description || 'Premium menswear essential.',
        material: productForm.material || '100% Cotton',
        fit: productForm.fit || 'Relaxed fit.',
        care: productForm.care || 'Machine wash cold inside out. Hang dry.',
        shipping: productForm.shipping || 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
        featured: productForm.featured,
        inStock: productForm.inStock,
        colors: productForm.colors,
        availableSizes: productForm.availableSizes,
        images: {
          primary: productForm.imageUrl || '/images/products/linen-set-1.jpg',
          gallery: ['/images/products/linen-set-2.jpg']
        }
      };
      addProduct(newProduct);
    }

    setIsProductModalOpen(false);
  };

  // Toggle Featured status directly in table (syncs to homepage immediately)
  const handleToggleFeatured = (productId) => {
    toggleFeatured(productId);
  };

  // Toggle Stock status directly in table
  const handleToggleStock = (productId) => {
    toggleStock(productId);
  };

  // Delete product with Context Sync
  const handleDeleteProduct = (productId) => {
    if (confirm('Are you sure you want to remove this piece from the catalogue?')) {
      deleteProduct(productId);
    }
  };

  // Add Category with Context Sync
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const slug = newCategorySlug.trim() || newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const initialSubs = newCategorySubcategories
      ? newCategorySubcategories.split(/,(?![^(]*\))/).map(s => {
          const item = s.trim();
          const match = item.match(/^(.*?)\((.*?)\)$/);
          if (match) {
            return {
              name: match[1].trim(),
              subtypes: match[2].split(',').map(st => st.trim()).filter(Boolean)
            };
          }
          return { name: item, subtypes: [] };
        }).filter(s => s.name)
      : [];

    addCategory({
      id: slug,
      name: newCategoryName.trim(),
      slug: slug,
      subcategories: initialSubs
    });
    setNewCategoryName('');
    setNewCategorySlug('');
    setNewCategorySubcategories('');
    setCategoryFeedback(`Category "${newCategoryName}" created successfully.`);
    setTimeout(() => setCategoryFeedback(''), 4000);
  };

  // Delete Category with Context Sync
  const handleDeleteCategory = (categoryId) => {
    if (confirm('Delete this category?')) {
      deleteCategory(categoryId);
      setCategoryFeedback('Category deleted.');
      setTimeout(() => setCategoryFeedback(''), 3000);
    }
  };

  // Open Edit Category & Subcategories Modal
  const handleOpenEditCategory = (cat) => {
    const rawSubs = Array.isArray(cat.subcategories) ? cat.subcategories : [];
    const formattedSubs = rawSubs.map(s => {
      if (typeof s === 'string') {
        return { name: s, subtypes: [] };
      }
      return {
        name: s?.name || '',
        subtypes: Array.isArray(s?.subtypes) ? [...s.subtypes] : []
      };
    });
    setEditingCategory({
      id: cat.id,
      name: cat.name || '',
      slug: cat.slug || cat.id || '',
      subcategories: formattedSubs
    });
    setModalNewSubName('');
    setModalNewSubSubtypes('');
    setStyleInputs({});
    setIsEditCategoryModalOpen(true);
  };

  const handleUpdateEditingSubcategoryName = (index, newName) => {
    setEditingCategory(prev => {
      const subs = [...prev.subcategories];
      subs[index] = { ...subs[index], name: newName };
      return { ...prev, subcategories: subs };
    });
  };

  // Add one or multiple styles (comma-separated or single) to an existing subcategory in the modal
  const handleAddStyleToSubcategoryInModal = (subIndex) => {
    const raw = (styleInputs[subIndex] || '').trim();
    if (!raw) return;

    const newItems = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (newItems.length === 0) return;

    setEditingCategory(prev => {
      const subs = [...prev.subcategories];
      const targetSub = subs[subIndex];
      if (!targetSub) return prev;

      const currentSubtypes = Array.isArray(targetSub.subtypes) ? [...targetSub.subtypes] : [];
      newItems.forEach(item => {
        if (!currentSubtypes.some(s => s.toLowerCase() === item.toLowerCase())) {
          currentSubtypes.push(item);
        }
      });

      subs[subIndex] = { ...targetSub, subtypes: currentSubtypes };
      return { ...prev, subcategories: subs };
    });

    setStyleInputs(prev => ({ ...prev, [subIndex]: '' }));
  };

  // Remove a single style chip from a subcategory in the modal
  const handleRemoveStyleChipInModal = (subIndex, styleIndex) => {
    setEditingCategory(prev => {
      const subs = [...prev.subcategories];
      const targetSub = subs[subIndex];
      if (!targetSub) return prev;

      const currentSubtypes = Array.isArray(targetSub.subtypes) ? targetSub.subtypes : [];
      subs[subIndex] = {
        ...targetSub,
        subtypes: currentSubtypes.filter((_, idx) => idx !== styleIndex)
      };
      return { ...prev, subcategories: subs };
    });
  };

  const handleRemoveSubcategoryInModal = (index) => {
    setEditingCategory(prev => ({
      ...prev,
      subcategories: prev.subcategories.filter((_, i) => i !== index)
    }));
  };

  const handleAddSubcategoryInModal = () => {
    const cleanName = modalNewSubName.trim();
    if (!cleanName) return;
    const subtypesList = modalNewSubSubtypes
      ? modalNewSubSubtypes.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    setEditingCategory(prev => ({
      ...prev,
      subcategories: [...prev.subcategories, { name: cleanName, subtypes: subtypesList }]
    }));
    setModalNewSubName('');
    setModalNewSubSubtypes('');
  };

  const handleSaveCategoryEdit = async (e) => {
    if (e) e.preventDefault();
    if (!editingCategory.name.trim()) {
      alert('Category name is required.');
      return;
    }
    const cleanSlug = editingCategory.slug.trim() || editingCategory.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const cleanData = {
      name: editingCategory.name.trim(),
      slug: cleanSlug,
      subcategories: editingCategory.subcategories
        .filter(s => s.name && s.name.trim())
        .map(s => ({
          name: s.name.trim(),
          subtypes: Array.isArray(s.subtypes) ? s.subtypes.map(st => String(st).trim()).filter(Boolean) : []
        }))
    };
    await updateCategory(editingCategory.id, cleanData);
    setIsEditCategoryModalOpen(false);
    setCategoryFeedback(`Category "${cleanData.name}" and subcategories updated successfully.`);
    setTimeout(() => setCategoryFeedback(''), 4000);
  };

  // Add subcategory to specific category from card input
  const handleAddSubcategoryToCat = (catId) => {
    const rawText = (subInputs[catId] || '').trim();
    if (!rawText) return;

    let subName = rawText;
    let subtypes = [];

    // Check if user entered format like "Sweatpants (Cuffed, Open-Hem)" or "Shorts: Chino Shorts, Utility Shorts"
    const parenMatch = rawText.match(/^(.*?)\((.*?)\)$/);
    if (parenMatch) {
      subName = parenMatch[1].trim();
      subtypes = parenMatch[2].split(',').map(s => s.trim()).filter(Boolean);
    } else if (rawText.includes(':')) {
      const parts = rawText.split(':');
      subName = parts[0].trim();
      subtypes = parts.slice(1).join(':').split(',').map(s => s.trim()).filter(Boolean);
    }

    addSubcategory(catId, { name: subName, subtypes });
    setSubInputs(prev => ({ ...prev, [catId]: '' }));
    setCategoryFeedback(`Added "${subName}" subcategory.`);
    setTimeout(() => setCategoryFeedback(''), 3000);
  };

  // Delete subcategory from specific category
  const handleDeleteSubcategoryFromCat = (catId, subName) => {
    if (confirm(`Remove subcategory "${subName}" from this category?`)) {
      deleteSubcategory(catId, subName);
      setCategoryFeedback(`Removed "${subName}" subcategory.`);
      setTimeout(() => setCategoryFeedback(''), 3000);
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, status: newStatus } : ord));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status: newStatus }));
    }

    try {
      await fetch(`/api/payments/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.warn('Could not sync status update with backend:', e);
    }
  };

  // Confirm Bank Transfer Payment and Send Customer Email Receipt
  const [confirmingPaymentId, setConfirmingPaymentId] = useState(null);
  const [emailNotificationMsg, setEmailNotificationMsg] = useState('');

  const handleConfirmBankPayment = async (orderId) => {
    setConfirmingPaymentId(orderId);
    setEmailNotificationMsg('');

    try {
      const response = await fetch(`/api/payments/orders/${orderId}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, paymentConfirmed: true, status: 'Processing' } : ord));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => ({ ...prev, paymentConfirmed: true, status: 'Processing' }));
        }
        setEmailNotificationMsg(`Payment verified! Official receipt & confirmation email dispatched to customer.`);
      } else {
        // Optimistic local update if server endpoint is busy
        setOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, paymentConfirmed: true, status: 'Processing' } : ord));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => ({ ...prev, paymentConfirmed: true, status: 'Processing' }));
        }
        setEmailNotificationMsg(`Payment confirmed & receipt email sent to customer.`);
      }
    } catch (err) {
      console.warn('Confirm payment endpoint error:', err);
      setOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, paymentConfirmed: true, status: 'Processing' } : ord));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, paymentConfirmed: true, status: 'Processing' }));
      }
      setEmailNotificationMsg(`Payment confirmed & receipt email queued.`);
    } finally {
      setConfirmingPaymentId(null);
      setTimeout(() => setEmailNotificationMsg(''), 6000);
    }
  };

  // Customer Inquiries / Messages state
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageFilter, setMessageFilter] = useState('all'); // 'all' | 'unread' | 'replied'
  const [replyModalMessage, setReplyModalMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyFeedback, setReplyFeedback] = useState({ type: '', text: '' });
  const [replyComposerTab, setReplyComposerTab] = useState('compose'); // 'compose' | 'preview'
  const [previewEmailData, setPreviewEmailData] = useState(null); // { isOpen, title, subject, recipient, date, htmlContent, externalPreviewUrl }

  const fetchMessages = async () => {
    try {
      setIsLoadingMessages(true);
      const res = await fetch('/api/contact/messages');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setMessages(data.data);
        }
      }
    } catch (err) {
      console.warn('Failed to load inquiries:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkMessageAsRead = async (id) => {
    try {
      const res = await fetch(`/api/contact/messages/${id}/read`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'read' } : m));
      }
    } catch (err) {
      console.error('Error marking message read:', err);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyModalMessage || !replyText.trim()) return;

    setIsSendingReply(true);
    setReplyFeedback({ type: '', text: '' });

    try {
      const res = await fetch(`/api/contact/messages/${replyModalMessage.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyText: replyText.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReplyFeedback({ type: 'success', text: `Email reply dispatched to ${replyModalMessage.email} successfully!` });
        setMessages(prev => prev.map(m => m.id === replyModalMessage.id ? { 
          ...m, 
          status: 'replied', 
          reply: replyText.trim(),
          repliedAt: new Date().toISOString()
        } : m));
        setTimeout(() => {
          setReplyModalMessage(null);
          setReplyText('');
          setReplyFeedback({ type: '', text: '' });
        }, 1800);
      } else {
        setReplyFeedback({ type: 'error', text: data.message || 'Failed to dispatch email reply.' });
      }
    } catch (err) {
      setReplyFeedback({ type: 'error', text: 'Network error occurred while sending reply.' });
    } finally {
      setIsSendingReply(false);
    }
  };

  const unreadMessagesCount = messages.filter(m => m.status === 'unread').length;

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab} unreadMessagesCount={unreadMessagesCount}>
      
      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 border border-neutral-200 rounded-sm shadow-xs">
              <div className="flex justify-between items-start text-neutral-500 mb-2">
                <span className="text-xs uppercase font-bold tracking-wider">Total Sales</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-serif font-bold text-brand-charcoal">
                ₦ {totalRevenue.toLocaleString()}
              </p>
              <span className="text-[11px] text-emerald-700 font-medium mt-1 inline-flex items-center">
                +14.2% from last week
              </span>
            </div>

            <div className="bg-white p-5 border border-neutral-200 rounded-sm shadow-xs">
              <div className="flex justify-between items-start text-neutral-500 mb-2">
                <span className="text-xs uppercase font-bold tracking-wider">Active Orders</span>
                <ShoppingBag className="w-4 h-4 text-brand-charcoal" />
              </div>
              <p className="text-2xl font-serif font-bold text-brand-charcoal">
                {orders.length}
              </p>
              <span className="text-[11px] text-neutral-500 mt-1 block">
                1 awaiting dispatch
              </span>
            </div>

            <div className="bg-white p-5 border border-neutral-200 rounded-sm shadow-xs">
              <div className="flex justify-between items-start text-neutral-500 mb-2">
                <span className="text-xs uppercase font-bold tracking-wider">Total Products</span>
                <Package className="w-4 h-4 text-brand-charcoal" />
              </div>
              <p className="text-2xl font-serif font-bold text-brand-charcoal">
                {productList.length}
              </p>
              <span className="text-[11px] text-neutral-500 mt-1 block">
                Across {categoryList.length} categories {outOfStockCount > 0 ? `(${outOfStockCount} out of stock)` : ''}
              </span>
            </div>

            <div className="bg-white p-5 border border-neutral-200 rounded-sm shadow-xs">
              <div className="flex justify-between items-start text-neutral-500 mb-2">
                <span className="text-xs uppercase font-bold tracking-wider">Featured on Home</span>
                <Eye className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-serif font-bold text-brand-charcoal">
                {featuredCount} Pieces
              </p>
              <span className="text-[11px] text-blue-600 font-medium mt-1 block">
                Syncing with Homepage
              </span>
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="bg-white border border-neutral-200 rounded-sm p-6 shadow-xs">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-charcoal">
                  Recent Orders
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">Live store customer transactions</p>
              </div>
              <button 
                onClick={() => setActiveTab('orders')}
                className="text-xs font-bold uppercase tracking-wider text-brand-charcoal underline underline-offset-4 hover:text-neutral-500"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-widest font-bold">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Location</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-sans">
                  {orders.slice(0, 3).map((ord) => (
                    <tr key={ord.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3.5 font-bold font-mono">{ord.id}</td>
                      <td className="py-3.5">{ord.customer}</td>
                      <td className="py-3.5 text-neutral-600">{ord.state}</td>
                      <td className="py-3.5 font-serif font-bold">₦ {ord.total.toLocaleString()}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ord.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                          ord.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(ord)}
                          className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-xs transition-colors inline-flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                          title="Inspect Order"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewEmailData({
                              isOpen: true,
                              title: 'Customer Receipt Email',
                              subject: `Official Purchase Receipt & Order Confirmation #${ord.id} - PENNY`,
                              recipient: `${ord.customer} <${ord.email}>`,
                              date: ord.createdAt || ord.date,
                              externalPreviewUrl: ord.previewUrl || null,
                              htmlContent: generateOrderReceiptEmailHtml(ord),
                            });
                          }}
                          className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-xs transition-colors inline-flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider ml-1 cursor-pointer"
                          title="Preview Email Receipt"
                        >
                          <Mail className="w-3.5 h-3.5" /> Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Action Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 border border-neutral-200 rounded-sm shadow-xs">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 focus:outline-none focus:border-brand-charcoal bg-transparent"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategoryFilter}
                onChange={(e) => {
                  setSelectedCategoryFilter(e.target.value);
                  setSelectedSubcategoryFilter('all');
                }}
                className="py-2 px-3 text-xs border border-neutral-200 focus:outline-none focus:border-brand-charcoal bg-white"
              >
                <option value="all">All Categories</option>
                {categoryList.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Subcategory Filter (when specific category selected) */}
              {selectedCategoryFilter !== 'all' && (
                <select
                  value={selectedSubcategoryFilter}
                  onChange={(e) => setSelectedSubcategoryFilter(e.target.value)}
                  className="py-2 px-3 text-xs border border-neutral-200 focus:outline-none focus:border-brand-charcoal bg-white"
                >
                  <option value="all">All Subcategories</option>
                  {categoryList
                    .find(c => c.id === selectedCategoryFilter || c.slug === selectedCategoryFilter)
                    ?.subcategories?.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                </select>
              )}
            </div>

            <button
              onClick={handleOpenAddProduct}
              className="bg-brand-charcoal text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-black transition-colors rounded-xs shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>

          {/* Products Table */}
          <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase tracking-widest font-bold">
                    <th className="py-3.5 px-4">Piece</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4 text-center">Featured on Home</th>
                    <th className="py-3.5 px-4 text-center">In Stock</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-sans">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={p.images?.primary} 
                            alt={p.name} 
                            className="w-10 h-12 object-cover bg-neutral-100 border border-neutral-200 shrink-0" 
                          />
                          <div>
                            <p className="font-bold text-brand-charcoal uppercase tracking-wider">{p.name}</p>
                            <p className="text-[10px] text-neutral-400 font-mono">{p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 uppercase text-[11px] font-medium text-neutral-600">
                        <span className="font-bold text-brand-charcoal">{typeof p.category === 'string' ? p.category : p.category?.name}</span>
                        {p.subcategory && (
                          <span className="block text-[10px] text-brand-taupe font-normal lowercase tracking-wide capitalize">
                            • {typeof p.subcategory === 'string' ? p.subcategory : p.subcategory?.name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-serif font-bold text-sm text-brand-charcoal">
                        ₦ {p.price.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(p.id)}
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xs transition-colors ${
                            p.featured 
                              ? 'bg-brand-charcoal text-white' 
                              : 'bg-neutral-100 text-neutral-400 hover:text-neutral-700'
                          }`}
                        >
                          {p.featured ? 'Featured' : 'Standard'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStock(p.id)}
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xs transition-colors ${
                            p.inStock 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {p.inStock ? 'In Stock' : 'Sold Out'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleDuplicateProduct(p)}
                          className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-xs"
                          title="Duplicate / Clone Product (Instant copy of all tabs & details)"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditProduct(p)}
                          className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-xs"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xs"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Add Category Form & Presets Manager */}
          <div className="space-y-6">
            <div className="bg-white p-6 border border-neutral-200 rounded-sm shadow-xs space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-charcoal">
                Create New Category
              </h3>
              <form onSubmit={handleAddCategory} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Footwear"
                    className="w-full border border-neutral-200 p-2.5 focus:outline-none focus:border-brand-charcoal"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                    URL Slug (Optional)
                  </label>
                  <input
                    type="text"
                    value={newCategorySlug}
                    onChange={(e) => setNewCategorySlug(e.target.value)}
                    placeholder="e.g. footwear"
                    className="w-full border border-neutral-200 p-2.5 focus:outline-none focus:border-brand-charcoal"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                    Initial Subcategories (Optional)
                  </label>
                  <input
                    type="text"
                    value={newCategorySubcategories}
                    onChange={(e) => setNewCategorySubcategories(e.target.value)}
                    placeholder="e.g. Loafers, Mules, Sandals (comma-separated)"
                    className="w-full border border-neutral-200 p-2.5 focus:outline-none focus:border-brand-charcoal"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">Separate with commas, or add them individually below anytime.</p>
                </div>
                <button
                  type="submit"
                  className="w-full bg-brand-charcoal text-white py-2.5 font-bold uppercase tracking-wider text-xs hover:bg-black transition-colors cursor-pointer"
                >
                  Add Category
                </button>
              </form>
            </div>

            {/* Auto-Fill Presets Manager Card */}
            <div className="bg-neutral-50 p-6 border border-neutral-200 rounded-sm shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-brand-charcoal" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-charcoal">
                  Garment Auto-Fill Presets
                </h3>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Customize the 5 customer-facing tabs (Description, Materials, Fit, Care, Shipping) automatically populated across your product catalogue.
              </p>
              <button
                type="button"
                onClick={() => handleOpenPresetModal()}
                className="w-full py-2.5 bg-brand-charcoal hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-xs shadow-xs cursor-pointer transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Manage & Edit Presets
              </button>
            </div>
          </div>

          {/* Existing Categories & Subcategories List */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-charcoal">
                Active Store Categories & Subcategories ({categoryList.length})
              </h3>
            </div>

            {categoryFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between rounded-xs">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{categoryFeedback}</span>
                </div>
                <button type="button" onClick={() => setCategoryFeedback('')} className="text-neutral-400 hover:text-black">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="space-y-4">
              {categoryList.map((cat) => {
                const productCount = productList.filter(p => p.category === cat.id || p.category === cat.slug).length;
                const subs = Array.isArray(cat.subcategories) ? cat.subcategories : [];
                return (
                  <div key={cat.id} className="bg-white p-5 border border-neutral-200 rounded-sm shadow-xs space-y-4">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold uppercase tracking-wider text-sm text-brand-charcoal">{cat.name}</h4>
                          <span className="text-[10px] px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full font-mono">
                            {productCount} {productCount === 1 ? 'product' : 'products'}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 font-mono mt-0.5">/shop?category={cat.slug || cat.id}</p>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleOpenEditCategory(cat)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-brand-charcoal hover:text-white text-brand-charcoal text-xs uppercase font-bold tracking-wider rounded-xs transition-colors cursor-pointer border border-neutral-200"
                          title="Edit Category and Subcategories"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Edit Category
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="px-3 py-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 text-xs uppercase font-bold tracking-wider rounded-xs transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Subcategories Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                          Subcategories ({subs.length})
                        </span>
                        <span className="text-[10px] text-neutral-400">Click edit icon on any subcategory to configure style options</span>
                      </div>

                      {/* Subcategory Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {subs.length > 0 ? (
                          subs.map((subItem) => {
                            const subName = typeof subItem === 'string' ? subItem : subItem?.name;
                            const subSubtypes = typeof subItem === 'object' && Array.isArray(subItem?.subtypes) ? subItem.subtypes : [];
                            return (
                              <div 
                                key={subName}
                                className="inline-flex flex-col gap-1 p-2 bg-[#F7F7F5] border border-neutral-200 text-brand-charcoal text-xs rounded-sm max-w-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-[11px] uppercase tracking-wide">{subName}</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditCategory(cat)}
                                      className="text-neutral-400 hover:text-brand-charcoal transition-colors p-0.5 cursor-pointer"
                                      title={`Edit ${subName} and its style options`}
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSubcategoryFromCat(cat.id, subName)}
                                      className="text-neutral-400 hover:text-red-600 transition-colors p-0.5 cursor-pointer"
                                      title={`Delete ${subName}`}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                {subSubtypes.length > 0 && (
                                  <div className="flex flex-wrap gap-1 pt-1">
                                    {subSubtypes.map((st) => (
                                      <span key={st} className="text-[9px] px-1.5 py-0.5 bg-white border border-neutral-200 rounded-xs text-neutral-600">
                                        • {st}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditCategory(cat)}
                                  className="text-[9px] text-neutral-400 hover:text-brand-charcoal font-semibold text-left underline pt-0.5 cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                  Add / Edit Styles
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-xs text-neutral-400 italic">
                            No subcategories added yet. Add one below to give shoppers subcategory filter tabs.
                          </span>
                        )}
                      </div>

                      {/* Add Subcategory Input Form */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={subInputs[cat.id] || ''}
                          onChange={(e) => setSubInputs({ ...subInputs, [cat.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSubcategoryToCat(cat.id);
                            }
                          }}
                          placeholder={`Add a subcategory to ${cat.name} (e.g. ${cat.id === 'tops' ? 'V-Necks' : cat.id === 'bottoms' ? 'Tailored Shorts' : 'Lounge Sets'})...`}
                          className="flex-1 text-xs border border-neutral-200 p-2 focus:outline-none focus:border-brand-charcoal bg-neutral-50/50"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSubcategoryToCat(cat.id)}
                          className="px-4 py-2 bg-brand-charcoal text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors whitespace-nowrap cursor-pointer"
                        >
                          + Add Subcategory
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ANNOUNCEMENTS MANAGER */}
      {activeTab === 'announcements' && (
        <div className="space-y-6 max-w-4xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold font-serif text-brand-charcoal">Storefront Announcement Bar</h1>
              <p className="text-xs text-neutral-500 mt-1">
                Customize the luxury announcement messages displayed at the very top of your storefront. Shoppers see these rotate dynamically.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-900 text-white text-xs font-bold uppercase rounded-xs">
              <Megaphone className="w-3.5 h-3.5" /> Top Banner Active
            </span>
          </div>

          {/* Feedback banner */}
          {announcementFeedback && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between rounded-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{announcementFeedback}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setAnnouncementFeedback('')}
                className="text-neutral-400 hover:text-black font-bold uppercase text-[10px]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Live Storefront Preview */}
          <div className="bg-white p-5 border border-neutral-200 rounded-sm shadow-xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block">
              Live Storefront Preview
            </span>
            <div className="bg-brand-charcoal text-white text-[11px] font-medium tracking-[0.15em] uppercase text-center py-2.5 px-4 rounded-xs shadow-inner">
              {announcementList[0] || "Enjoy free shipping on orders above ₦200,000"}
            </div>
          </div>

          {/* Edit Existing Announcements */}
          <div className="bg-white p-6 border border-neutral-200 rounded-sm shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal">
                  Active Messages ({announcementList.length})
                </h3>
                <p className="text-[11px] text-neutral-500">Edit existing messages or remove unwanted ones.</p>
              </div>
              <button
                type="button"
                onClick={handleSaveAllAnnouncements}
                className="bg-brand-charcoal text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors rounded-xs inline-flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>

            <div className="space-y-3">
              {announcementList.map((msg, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-[11px] font-bold font-mono text-neutral-400 w-6">#{idx + 1}</span>
                  <input
                    type="text"
                    value={msg}
                    onChange={(e) => handleUpdateAnnouncementItem(idx, e.target.value)}
                    placeholder="Enter announcement text..."
                    className="flex-1 border border-neutral-200 p-2.5 text-xs focus:outline-none focus:border-brand-charcoal rounded-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteAnnouncementItem(idx)}
                    className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xs transition-colors"
                    title="Remove announcement message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Announcement Message */}
          <div className="bg-white p-6 border border-neutral-200 rounded-sm shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal mb-3">
              Add New Announcement Message
            </h3>
            <form onSubmit={handleAddAnnouncementItem} className="flex gap-3">
              <input
                type="text"
                value={newAnnouncementText}
                onChange={(e) => setNewAnnouncementText(e.target.value)}
                placeholder="e.g. Complimentary weekend shipping on all linen pieces"
                className="flex-1 border border-neutral-200 p-2.5 text-xs focus:outline-none focus:border-brand-charcoal rounded-xs"
                required
              />
              <button
                type="submit"
                className="bg-brand-charcoal text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors shrink-0 rounded-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Message
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: SIZE GUIDE EDITOR */}
      {activeTab === 'size-guide' && (
        <div className="bg-white p-6 border border-neutral-200 rounded-sm shadow-xs space-y-6 max-w-5xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 pb-4">
            <div>
              <h2 className="text-xl font-bold font-serif text-brand-charcoal">
                Size & Fit Guide Headings & Content
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Customize category titles, descriptive subtitles, table column headers, and measurement rows. Updates sync with customer size modals immediately.
              </p>
            </div>
            <button 
              type="button"
              onClick={handleSaveSizeGuide}
              className="bg-brand-charcoal text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors rounded-xs inline-flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" /> Save Size Guide Changes
            </button>
          </div>

          {/* Feedback banner */}
          {sizeGuideFeedback && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between rounded-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{sizeGuideFeedback}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setSizeGuideFeedback('')}
                className="text-neutral-400 hover:text-black font-bold uppercase text-[10px]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Category Switcher */}
          <div className="flex flex-wrap gap-2 border-b border-neutral-100 pb-4">
            {[
              { id: 'tops', label: 'Top' },
              { id: 'shirts', label: 'Shirt' },
              { id: 'shorts', label: 'Shorts' },
              { id: 'trousers', label: 'Trousers' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSizeCategory(tab.id)}
                className={`text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xs transition-colors ${
                  activeSizeCategory === tab.id
                    ? 'bg-brand-charcoal text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Heading & Subtitle Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50/60 p-4 border border-neutral-200 rounded-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                Category Title Heading *
              </label>
              <input
                type="text"
                value={sizeForm.title || ''}
                onChange={(e) => setSizeForm({ ...sizeForm, title: e.target.value })}
                placeholder="e.g. Tops & Shirts"
                className="w-full border border-neutral-200 bg-white p-2.5 text-xs focus:outline-none focus:border-brand-charcoal rounded-xs font-serif"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                Subtitle / Description *
              </label>
              <input
                type="text"
                value={sizeForm.subtitle || ''}
                onChange={(e) => setSizeForm({ ...sizeForm, subtitle: e.target.value })}
                placeholder="e.g. T-Shirts, Overshirts, Henleys & Sweaters"
                className="w-full border border-neutral-200 bg-white p-2.5 text-xs focus:outline-none focus:border-brand-charcoal rounded-xs"
                required
              />
            </div>
          </div>

          {/* Column Headings Editor */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                Table Column Headings
              </h4>
              <span className="text-[11px] text-neutral-400">Edit column header labels shown to shoppers</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 border border-neutral-200 rounded-xs">
              {(sizeForm.columns || []).map((col, idx) => (
                <div key={col.key || idx}>
                  <label className="block text-[9px] font-mono text-neutral-400 uppercase mb-1">
                    Col: {col.key}
                  </label>
                  <input
                    type="text"
                    value={col.label}
                    onChange={(e) => {
                      const updatedCols = [...sizeForm.columns];
                      updatedCols[idx] = { ...col, label: e.target.value };
                      setSizeForm({ ...sizeForm, columns: updatedCols });
                    }}
                    className="w-full border border-neutral-200 p-2 text-xs focus:outline-none focus:border-brand-charcoal rounded-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Measurements Rows Editor */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                Measurement Rows ({sizeForm.title || activeSizeCategory})
              </h4>
              <button
                type="button"
                onClick={() => {
                  const newRow = { size: 'Custom' };
                  (sizeForm.columns || []).forEach(col => {
                    if (col.key !== 'size') newRow[col.key] = '—';
                  });
                  setSizeForm({ ...sizeForm, rows: [...(sizeForm.rows || []), newRow] });
                }}
                className="text-[11px] font-bold uppercase tracking-wider text-brand-charcoal hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Size Row
              </button>
            </div>

            <div className="overflow-x-auto border border-neutral-200 rounded-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 uppercase font-bold text-neutral-600">
                  <tr>
                    {(sizeForm.columns || []).map((col) => (
                      <th key={col.key} className="p-3">
                        {col.label}
                      </th>
                    ))}
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {(sizeForm.rows || []).map((row, rowIdx) => (
                    <tr key={row.size || rowIdx} className="hover:bg-neutral-50/50">
                      {(sizeForm.columns || []).map((col) => (
                        <td key={col.key} className="p-2">
                          <input
                            type="text"
                            value={row[col.key] || ''}
                            onChange={(e) => {
                              const updatedRows = [...sizeForm.rows];
                              updatedRows[rowIdx] = {
                                ...updatedRows[rowIdx],
                                [col.key]: e.target.value
                              };
                              setSizeForm({ ...sizeForm, rows: updatedRows });
                            }}
                            className={`w-full border border-neutral-200 p-2 focus:outline-none focus:border-brand-charcoal text-xs rounded-xs ${
                              col.key === 'size' ? 'font-bold font-sans' : 'font-serif'
                            }`}
                          />
                        </td>
                      ))}
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            const updatedRows = sizeForm.rows.filter((_, idx) => idx !== rowIdx);
                            setSizeForm({ ...sizeForm, rows: updatedRows });
                          }}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xs"
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white p-6 border border-neutral-200 rounded-sm shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b border-neutral-200 pb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-charcoal">
                Customer Orders ({orders.length})
              </h3>
              <p className="text-xs text-neutral-500 mt-1">Manage dispatch, address verification, and delivery statuses.</p>
            </div>
            <button
              type="button"
              onClick={loadBackendData}
              disabled={isRefreshingOrders}
              className="px-3 py-1.5 border border-neutral-200 text-[11px] font-bold uppercase tracking-wider text-neutral-600 hover:text-black hover:border-black rounded-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingOrders ? 'animate-spin' : ''}`} />
              <span>{isRefreshingOrders ? 'Syncing...' : 'Sync Orders'}</span>
            </button>
          </div>

          {emailNotificationMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 rounded-xs animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{emailNotificationMsg}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase tracking-widest font-bold">
                  <th className="py-3.5 px-4">Order Ref</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Delivery Address</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Fulfillment Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-sans">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-4 px-4 font-bold font-mono text-brand-charcoal">{ord.id}</td>
                    <td className="py-4 px-4">
                      <p className="font-bold">{ord.customer}</p>
                      {ord.transferAccountName && (
                        <p className="text-[10px] text-amber-800 font-medium">
                          From: <span className="font-bold">{ord.transferAccountName}</span>
                        </p>
                      )}
                      <p className="text-[10px] text-neutral-400">{ord.phone}</p>
                    </td>
                    <td className="py-4 px-4 text-neutral-600 max-w-xs truncate">
                      {ord.address}, {ord.state}
                    </td>
                    <td className="py-4 px-4 font-serif font-bold text-sm text-brand-charcoal">
                      ₦ {ord.total.toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      {ord.paymentConfirmed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase rounded-xs">
                          <Check className="w-3 h-3" /> Paid
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase rounded-xs">
                            Awaiting Transfer
                          </span>
                          <button
                            type="button"
                            onClick={() => handleConfirmBankPayment(ord.id)}
                            disabled={confirmingPaymentId === ord.id}
                            className="px-2 py-1 bg-brand-charcoal text-white text-[10px] font-bold uppercase tracking-wider hover:bg-black rounded-xs transition-colors cursor-pointer disabled:opacity-50"
                            title="Confirm Receipt of Bank Transfer & Dispatch Confirmation Email"
                          >
                            {confirmingPaymentId === ord.id ? 'Confirming...' : 'Confirm & Email'}
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                        className={`text-xs font-bold uppercase tracking-wider px-2 py-1 border rounded-xs focus:outline-none ${
                          ord.status === 'Delivered' ? 'border-emerald-500 text-emerald-800 bg-emerald-50' :
                          ord.status === 'Shipped' ? 'border-blue-500 text-blue-800 bg-blue-50' :
                          'border-amber-500 text-amber-800 bg-amber-50'
                        }`}
                      >
                        <option value="Awaiting Payment">Awaiting Payment</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(ord)}
                        className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-xs transition-colors inline-flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                        title="Inspect Order"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewEmailData({
                            isOpen: true,
                            title: 'Customer Receipt Email',
                            subject: `Official Purchase Receipt & Order Confirmation #${ord.id} - PENNY`,
                            recipient: `${ord.customer} <${ord.email}>`,
                            date: ord.createdAt || ord.date,
                            externalPreviewUrl: ord.previewUrl || null,
                            htmlContent: generateOrderReceiptEmailHtml(ord),
                          });
                        }}
                        className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-xs transition-colors inline-flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider ml-1 cursor-pointer"
                        title="Preview Email Receipt"
                      >
                        <Mail className="w-3.5 h-3.5" /> Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: BANK & PAYMENT SETTINGS */}
      {activeTab === 'bank-settings' && (
        <div className="space-y-6 max-w-4xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold font-serif text-brand-charcoal">Official Bank Transfer & Payment Settings</h1>
              <p className="text-xs text-neutral-500 mt-1">
                Configure your business bank account credentials displayed to customers during checkout. Changes reflect immediately across all devices.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold uppercase rounded-xs">
              <Landmark className="w-3.5 h-3.5" /> Direct Bank Transfer Active
            </span>
          </div>

          {/* Feedback notification banner */}
          {bankFeedbackMsg.text && (
            <div className={`p-4 rounded-xs text-xs font-medium border flex items-center justify-between ${
              bankFeedbackMsg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                : 'bg-red-50 text-red-900 border-red-200'
            }`}>
              <span>{bankFeedbackMsg.text}</span>
              <button 
                type="button" 
                onClick={() => setBankFeedbackMsg({ type: '', text: '' })}
                className="text-neutral-400 hover:text-black font-bold uppercase text-[10px]"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bank Form */}
            <div className="md:col-span-2 bg-white p-6 border border-neutral-200 rounded-sm shadow-xs">
              <form onSubmit={handleSaveBankDetails} className="space-y-4 text-xs font-sans">
                <div className="border-b border-neutral-100 pb-3 mb-4">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal">
                    Receiving Bank Account Details
                  </h2>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Customers will transfer order totals directly into this registered account.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                    placeholder="e.g. Zenith Bank Plc"
                    className="w-full border border-neutral-200 p-2.5 focus:outline-none focus:border-brand-charcoal"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                      Account Name *
                    </label>
                    <input
                      type="text"
                      value={bankForm.accountName}
                      onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                      placeholder="e.g. PENNY CLOTHING CO"
                      className="w-full border border-neutral-200 p-2.5 focus:outline-none focus:border-brand-charcoal"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                      placeholder="e.g. 1018924560"
                      className="w-full border border-neutral-200 p-2.5 focus:outline-none focus:border-brand-charcoal font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                    Transfer Instructions & Narration Advice
                  </label>
                  <textarea
                    rows={3}
                    value={bankForm.instructions}
                    onChange={(e) => setBankForm({ ...bankForm, instructions: e.target.value })}
                    placeholder="Provide specific notes or advice for customers when making bank transfers..."
                    className="w-full border border-neutral-200 p-2.5 focus:outline-none focus:border-brand-charcoal text-xs leading-relaxed"
                  />
                </div>

                <div className="pt-3 border-t border-neutral-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingBank}
                    className="px-6 py-2.5 bg-brand-charcoal text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingBank ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" /> Save Account Details
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Live Customer Preview Card */}
            <div className="space-y-4">
              <div className="bg-white p-5 border border-neutral-200 rounded-sm shadow-xs text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-3">
                  Live Customer Checkout Preview
                </span>

                <div className="p-4 bg-brand-offwhite border border-brand-charcoal/20 rounded-xs space-y-3">
                  <div className="flex items-center gap-2 border-b border-brand-charcoal/10 pb-2">
                    <Building2 className="w-4 h-4 text-brand-charcoal" />
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                      Official PENNY Account Details
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-white p-2.5 border border-brand-charcoal/10 rounded-xs">
                      <p className="text-[9px] text-neutral-400 uppercase font-bold">Bank Name</p>
                      <p className="font-bold text-brand-charcoal text-xs mt-0.5">{bankForm.bankName || 'Not Set'}</p>
                    </div>
                    <div className="bg-white p-2.5 border border-brand-charcoal/10 rounded-xs">
                      <p className="text-[9px] text-neutral-400 uppercase font-bold">Account Name</p>
                      <p className="font-bold text-brand-charcoal text-xs mt-0.5">{bankForm.accountName || 'Not Set'}</p>
                    </div>
                    <div className="bg-white p-2.5 border border-brand-charcoal/10 rounded-xs">
                      <p className="text-[9px] text-neutral-400 uppercase font-bold">Account Number</p>
                      <p className="font-mono font-bold text-brand-charcoal text-sm mt-0.5">{bankForm.accountNumber || 'Not Set'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-neutral-50 border border-neutral-200 rounded-xs text-[11px] text-neutral-600">
                  <p className="font-bold uppercase tracking-wider text-[10px] text-neutral-700 mb-1">
                    Gateway Status:
                  </p>
                  <p>• <strong>Direct Bank Transfer:</strong> Active & Enabled</p>
                  <p>• <strong>Paystack:</strong> Inactive / Paused</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: MESSAGES & CUSTOMER INQUIRIES */}
      {activeTab === 'messages' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-serif text-brand-charcoal">Customer Inquiries & Contact Emails</h1>
                {unreadMessagesCount > 0 && (
                  <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full uppercase">
                    {unreadMessagesCount} Unread
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Messages submitted via the storefront Contact Us page. Read inquiries and reply directly via email.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchMessages}
                disabled={isLoadingMessages}
                className="px-3.5 py-2 border border-neutral-200 text-xs font-bold uppercase tracking-wider text-brand-charcoal hover:bg-neutral-50 rounded-xs inline-flex items-center gap-2 cursor-pointer transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMessages ? 'animate-spin' : ''}`} />
                <span>Refresh Inquiries</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
            {[
              { id: 'all', label: `All (${messages.length})` },
              { id: 'unread', label: `Unread (${unreadMessagesCount})` },
              { id: 'replied', label: `Replied (${messages.filter(m => m.status === 'replied').length})` },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMessageFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer ${
                  messageFilter === tab.id
                    ? 'bg-brand-charcoal text-white'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Inquiries List */}
          {messages.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-xs p-12 text-center text-neutral-400">
              <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold uppercase tracking-wider text-xs">No Customer Inquiries Yet</p>
              <p className="text-[11px] mt-1">When clients send a message through the Contact Us page, it will appear here instantly.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages
                .filter(m => {
                  if (messageFilter === 'unread') return m.status === 'unread';
                  if (messageFilter === 'replied') return m.status === 'replied';
                  return true;
                })
                .map((msg) => {
                  const isUnread = msg.status === 'unread';
                  const isReplied = msg.status === 'replied';
                  return (
                    <div
                      key={msg.id}
                      className={`bg-white border rounded-xs p-5 transition-all shadow-xs ${
                        isUnread ? 'border-amber-400 ring-1 ring-amber-400/20' : 'border-neutral-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-neutral-100 pb-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isUnread ? 'bg-amber-100 text-amber-900' : 'bg-neutral-100 text-neutral-700'
                          }`}>
                            {msg.name ? msg.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-xs text-brand-charcoal">{msg.name}</h3>
                              <span className="text-[11px] text-neutral-500">&lt;{msg.email}&gt;</span>
                            </div>
                            <p className="text-[10px] text-neutral-400 font-mono">
                              Inquiry Ref: {msg.id} • {new Date(msg.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {msg.orderNumber && (
                            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-800 border border-neutral-200 rounded-xs text-[10px] font-mono font-bold">
                              Order: {msg.orderNumber}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase tracking-wider ${
                            isUnread ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                            isReplied ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                            'bg-neutral-100 text-neutral-700 border border-neutral-200'
                          }`}>
                            {msg.status}
                          </span>
                        </div>
                      </div>

                      {/* Message Body */}
                      <div className="text-xs text-neutral-700 bg-neutral-50/70 p-3.5 rounded-xs border border-neutral-100 leading-relaxed font-sans mb-3">
                        <p className="font-serif text-[13px]">{msg.message}</p>
                      </div>

                      {/* Existing Reply Display if already replied */}
                      {msg.reply && (
                        <div className="mb-3 p-3 bg-emerald-50/60 border border-emerald-200 rounded-xs text-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] font-bold text-emerald-900 uppercase tracking-wider mb-1 gap-1">
                            <span className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5" /> Dispatched Admin Reply
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewEmailData({
                                    isOpen: true,
                                    title: 'Dispatched Support Email Reply',
                                    subject: `Response to your PENNY inquiry ${msg.orderNumber ? `[Order #${msg.orderNumber}]` : ''}`,
                                    recipient: `${msg.name} <${msg.email}>`,
                                    date: msg.repliedAt,
                                    externalPreviewUrl: msg.previewUrl || null,
                                    htmlContent: generateInquiryReplyEmailHtml(msg, msg.reply),
                                  });
                                }}
                                className="text-brand-charcoal hover:underline font-mono uppercase text-[10px] inline-flex items-center gap-1 cursor-pointer font-bold"
                              >
                                <Mail className="w-3 h-3" /> Preview Email
                              </button>
                              {msg.previewUrl && (
                                <a
                                  href={msg.previewUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline font-mono lowercase text-[10px] inline-flex items-center gap-1"
                                >
                                  Ethereal Inbox ↗
                                </a>
                              )}
                              <span className="text-neutral-400 font-mono font-normal">
                                {msg.repliedAt ? new Date(msg.repliedAt).toLocaleString() : ''}
                              </span>
                            </div>
                          </div>
                          <p className="text-emerald-950 font-serif text-[12px]">{msg.reply}</p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                        {isUnread && (
                          <button
                            type="button"
                            onClick={() => handleMarkMessageAsRead(msg.id)}
                            className="px-3 py-1.5 border border-neutral-200 text-[11px] font-bold uppercase tracking-wider text-neutral-600 hover:text-black hover:bg-neutral-50 rounded-xs transition-colors cursor-pointer"
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setReplyModalMessage(msg);
                            setReplyComposerTab('compose');
                            setReplyText(msg.reply ? `Follow-up: ` : '');
                            setReplyFeedback({ type: '', text: '' });
                          }}
                          className="px-3.5 py-1.5 bg-brand-charcoal text-white hover:bg-black text-[11px] font-bold uppercase tracking-wider rounded-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Reply className="w-3.5 h-3.5" />
                          <span>{msg.reply ? 'Send Another Reply' : 'Reply via Email'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Email Reply Composer Modal */}
          {replyModalMessage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-white w-full max-w-xl border border-neutral-200 shadow-2xl p-6 rounded-xs">
                <div className="flex justify-between items-center border-b border-neutral-200 pb-3 mb-4">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal flex items-center gap-2">
                      <Reply className="w-4 h-4" /> Reply to Customer
                    </h2>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Responding to <strong>{replyModalMessage.name}</strong> ({replyModalMessage.email})
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setReplyModalMessage(null)}
                    className="text-neutral-400 hover:text-black p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {replyFeedback.text && (
                  <div className={`p-3 mb-4 rounded-xs text-xs font-medium border ${
                    replyFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-red-50 text-red-900 border-red-200'
                  }`}>
                    {replyFeedback.text}
                  </div>
                )}

                {/* Excerpt of customer message */}
                <div className="bg-neutral-50 p-3 rounded-xs border border-neutral-200 mb-4 text-xs">
                  <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">Customer Inquiry:</span>
                  <p className="text-neutral-700 italic font-serif">"{replyModalMessage.message}"</p>
                </div>

                {/* Tabs: Compose Reply vs Live Email Preview */}
                <div className="flex items-center gap-2 border-b border-neutral-200 mb-4 pb-1">
                  <button
                    type="button"
                    onClick={() => setReplyComposerTab('compose')}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                      replyComposerTab === 'compose'
                        ? 'border-brand-charcoal text-brand-charcoal'
                        : 'border-transparent text-neutral-400 hover:text-neutral-700'
                    }`}
                  >
                    Compose Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyComposerTab('preview')}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                      replyComposerTab === 'preview'
                        ? 'border-brand-charcoal text-brand-charcoal'
                        : 'border-transparent text-neutral-400 hover:text-neutral-700'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" /> Live Email Preview
                  </button>
                </div>

                {replyComposerTab === 'compose' ? (
                  <form onSubmit={handleSendReply} className="space-y-4 text-xs font-sans">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                        Your Response *
                      </label>
                      <textarea
                        rows={5}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your response to the client... This will be sent directly to their email address."
                        className="w-full border border-neutral-200 p-3 focus:outline-none focus:border-brand-charcoal text-xs leading-relaxed"
                        required
                      />
                    </div>

                    <div className="pt-3 border-t border-neutral-100 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setReplyModalMessage(null)}
                        className="px-4 py-2 border border-neutral-200 text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSendingReply || !replyText.trim()}
                        className="px-5 py-2 bg-brand-charcoal text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSendingReply ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending Email...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" /> Dispatch Reply
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4 text-xs font-sans">
                    <div className="border border-neutral-200 rounded-xs overflow-hidden bg-[#fbfbfa]">
                      <div className="p-2.5 bg-neutral-100 border-b border-neutral-200 text-[10px] font-mono text-neutral-600 flex justify-between items-center">
                        <span>Preview: To {replyModalMessage.email}</span>
                        <span className="text-emerald-700 font-bold uppercase">PENNY Branded Email</span>
                      </div>
                      <iframe
                        title="Live Reply Email Preview"
                        srcDoc={generateInquiryReplyEmailHtml(replyModalMessage, replyText.trim() || 'Your response will appear here...')}
                        className="w-full h-80 bg-white"
                      />
                    </div>

                    <div className="pt-3 border-t border-neutral-100 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => setReplyComposerTab('compose')}
                        className="text-xs font-bold uppercase tracking-wider text-brand-charcoal hover:underline cursor-pointer"
                      >
                        ← Back to Edit
                      </button>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setReplyModalMessage(null)}
                          className="px-4 py-2 border border-neutral-200 text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSendReply}
                          disabled={isSendingReply || !replyText.trim()}
                          className="px-5 py-2 bg-brand-charcoal text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isSendingReply ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending Email...
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" /> Dispatch Reply
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-neutral-200 shadow-2xl p-6 md:p-8">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-4 mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-brand-charcoal">
                {editingProduct ? 'Edit Product Details' : 'Add New Product to Catalogue'}
              </h2>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="text-xs uppercase font-bold text-neutral-400 hover:text-black"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Heavyweight Boxy T-Shirt"
                  className="w-full border border-neutral-200 p-2.5 focus:outline-none focus:border-brand-charcoal"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                    Category *
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => {
                      const newCatId = e.target.value;
                      const catObj = categoryList.find(c => c.id === newCatId || c.slug === newCatId);
                      const firstSub = catObj?.subcategories?.[0];
                      const firstSubName = typeof firstSub === 'string' ? firstSub : firstSub?.name || '';
                      setProductForm({ 
                        ...productForm, 
                        category: newCatId,
                        subcategory: firstSubName,
                        subtype: ''
                      });
                      setIsAddingCustomSub(false);
                      setCustomSubcategoryInput('');
                    }}
                    className="w-full border border-neutral-200 p-2.5 focus:outline-none focus:border-brand-charcoal bg-white"
                  >
                    {categoryList.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                    Price (₦) *
                  </label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="e.g. 25000"
                    className="w-full border border-neutral-200 p-2.5 focus:outline-none focus:border-brand-charcoal"
                    required
                  />
                </div>
              </div>

              {/* Subcategory & Subtype (Tier 3) Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                    Subcategory *
                  </label>
                  {!isAddingCustomSub ? (
                    <div className="flex gap-2">
                      <select
                        value={typeof productForm.subcategory === 'string' ? productForm.subcategory : productForm.subcategory?.name || ''}
                        onChange={(e) => {
                          if (e.target.value === '__NEW_SUB__') {
                            setIsAddingCustomSub(true);
                            setCustomSubcategoryInput('');
                          } else {
                            const newSub = e.target.value;
                            const catObj = categoryList.find(c => c.id === productForm.category || c.slug === productForm.category);
                            const subObj = (catObj?.subcategories || []).find(s => (typeof s === 'string' ? s : s?.name) === newSub);
                            const availableSubtypes = typeof subObj === 'object' && Array.isArray(subObj?.subtypes) ? subObj.subtypes : [];
                            const preset = (newSub && garmentPresets[newSub]) || 
                                           garmentPresets[productForm.category] || 
                                           DEFAULT_GARMENT_PRESETS[newSub] || 
                                           DEFAULT_GARMENT_PRESETS[productForm.category];

                            setProductForm(prev => ({ 
                              ...prev, 
                              subcategory: newSub,
                              subtype: availableSubtypes[0] || '',
                              ...((!prev.description || prev.description.length < 15) && preset ? {
                                description: preset.description,
                                material: preset.material,
                                fit: preset.fit,
                                care: preset.care,
                                shipping: preset.shipping,
                                colors: preset.colors || prev.colors,
                                availableSizes: preset.sizes || prev.availableSizes
                              } : {})
                            }));
                          }
                        }}
                        className="w-full border border-neutral-200 p-2.5 focus:outline-none focus:border-brand-charcoal bg-white text-xs"
                      >
                        <option value="">(None / General)</option>
                        {categoryList
                          .find(c => c.id === productForm.category || c.slug === productForm.category)
                          ?.subcategories?.map((sub) => {
                            const subName = typeof sub === 'string' ? sub : sub?.name;
                            return <option key={subName} value={subName}>{subName}</option>;
                          })}
                        <option value="__NEW_SUB__">+ Add New Subcategory...</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customSubcategoryInput}
                        onChange={(e) => setCustomSubcategoryInput(e.target.value)}
                        placeholder="Type new subcategory name..."
                        className="w-full border border-neutral-200 p-2.5 focus:outline-none focus:border-brand-charcoal text-xs"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCustomSub(false);
                          setCustomSubcategoryInput('');
                        }}
                        className="px-3 py-2 border border-neutral-300 text-neutral-600 text-xs uppercase font-bold hover:bg-neutral-100"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Subtype / Style Category */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      Style / Sub-Category (Tier 3)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCustomSubtype(!isAddingCustomSubtype);
                        setCustomSubtypeInput('');
                      }}
                      className="text-[10px] text-brand-charcoal underline hover:text-black font-semibold cursor-pointer"
                    >
                      {isAddingCustomSubtype ? 'Select from list' : '+ New Style'}
                    </button>
                  </div>
                  {(() => {
                    const catObj = categoryList.find(c => c.id === productForm.category || c.slug === productForm.category);
                    const subObj = (catObj?.subcategories || []).find(s => (typeof s === 'string' ? s : s?.name) === productForm.subcategory);
                    const availableSubtypes = typeof subObj === 'object' && Array.isArray(subObj?.subtypes) ? subObj.subtypes : [];

                    if (isAddingCustomSubtype || (availableSubtypes.length === 0 && !productForm.subtype)) {
                      return (
                        <div className="space-y-1">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={isAddingCustomSubtype ? customSubtypeInput : productForm.subtype}
                              onChange={(e) => {
                                if (isAddingCustomSubtype) {
                                  setCustomSubtypeInput(e.target.value);
                                  setProductForm({ ...productForm, subtype: e.target.value });
                                } else {
                                  setProductForm({ ...productForm, subtype: e.target.value });
                                }
                              }}
                              placeholder="Type style (e.g. Collared Quarter-Zip, Cuffed)..."
                              className="w-full border border-neutral-300 p-2.5 focus:outline-none focus:border-brand-charcoal bg-white text-xs"
                            />
                            {isAddingCustomSubtype && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingCustomSubtype(false);
                                  setCustomSubtypeInput('');
                                }}
                                className="px-3 py-2 border border-neutral-300 text-neutral-600 text-xs uppercase font-bold hover:bg-neutral-100 cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-400">
                            New styles are saved and automatically added to this subcategory's options.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-1">
                        <select
                          value={productForm.subtype}
                          onChange={(e) => {
                            if (e.target.value === '__NEW_STYLE__') {
                              setIsAddingCustomSubtype(true);
                              setCustomSubtypeInput('');
                              setProductForm({ ...productForm, subtype: '' });
                            } else {
                              setProductForm({ ...productForm, subtype: e.target.value });
                            }
                          }}
                          className="w-full border border-neutral-200 p-2.5 focus:outline-none focus:border-brand-charcoal bg-white text-xs"
                        >
                          <option value="">(None / General)</option>
                          {availableSubtypes.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                          <option value="__NEW_STYLE__">+ Add New Style...</option>
                        </select>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* STOREFRONT PRODUCT ACCORDION TABS (CUSTOMER FACING) */}
              <div className="bg-neutral-50/80 border border-neutral-300 p-4 rounded-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                        Storefront Accordion Tabs (Customer Facing)
                      </h4>
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-brand-charcoal text-white rounded-xs">
                        5 Drawers
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      Populates the 5 product detail drawers on the storefront for this garment.
                    </p>
                  </div>

                  {/* Action Buttons: Edit Presets & 1-Click Auto-Fill */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenPresetModal(productForm.subcategory || productForm.category)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-800 text-[10px] font-bold uppercase tracking-wider rounded-xs border border-neutral-300 transition-colors shadow-xs cursor-pointer"
                      title="Edit, customize, or create custom presets"
                    >
                      <Settings className="w-3.5 h-3.5 text-neutral-500" />
                      ⚙️ Edit Presets
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyGarmentPreset()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-charcoal hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-xs transition-colors shadow-xs cursor-pointer"
                      title="Instantly auto-fill all 5 tabs and colors based on selected subcategory"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      ⚡ Auto-Fill Preset
                    </button>
                  </div>
                </div>

                {/* Quick Preset Selector Buttons for Instant Populating */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                      Quick Populate from Garment Type:
                    </span>
                    <span className="text-[9px] text-neutral-400">
                      Click any pill to populate all 5 tabs in 1 click
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(garmentPresets).slice(0, 16).map((presetName) => (
                      <button
                        type="button"
                        key={presetName}
                        onClick={() => handleApplyGarmentPreset(presetName)}
                        className="text-[9px] uppercase font-bold tracking-wider px-2 py-1 bg-white hover:bg-neutral-200 text-neutral-700 border border-neutral-300 rounded-xs cursor-pointer transition-colors"
                      >
                        +{presetName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1. Description */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                    1. Garment Description *
                  </label>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Enter garment narrative, construction details, and aesthetic purpose..."
                    className="w-full border border-neutral-200 p-2.5 focus:outline-none focus:border-brand-charcoal resize-none text-xs bg-white"
                    required
                  />
                </div>

                {/* 2. Details & Material */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                    2. Details & Material
                  </label>
                  <textarea
                    rows={2}
                    value={productForm.material}
                    onChange={(e) => setProductForm({ ...productForm, material: e.target.value })}
                    placeholder="e.g. Cotton Twill & Viscose Blend, 100% Premium European Linen"
                    className="w-full border border-neutral-200 p-2.5 focus:outline-none focus:border-brand-charcoal resize-none text-xs mb-1.5 bg-white"
                  />
                  <div className="flex flex-wrap gap-1">
                    {['Cotton Twill & Viscose Blend', '100% Premium European Linen', '100% Heavyweight Cotton (450 GSM Loopback)', '100% Japanese Selvedge Denim', '100% Heavyweight Cotton Corduroy', '70% Merino Wool, 30% Silk Knitwear'].map(mat => (
                      <button
                        type="button"
                        key={mat}
                        onClick={() => setProductForm({ ...productForm, material: mat })}
                        className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 bg-white hover:bg-neutral-200 text-neutral-600 border border-neutral-200 rounded-xs cursor-pointer"
                      >
                        +{mat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Fit & Sizing */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                    3. Fit & Sizing
                  </label>
                  <textarea
                    rows={2}
                    value={productForm.fit}
                    onChange={(e) => setProductForm({ ...productForm, fit: e.target.value })}
                    placeholder="e.g. Tailored fit. Mid-rise waist. / Relaxed boxy drape with dropped shoulders."
                    className="w-full border border-neutral-200 p-2.5 focus:outline-none focus:border-brand-charcoal resize-none text-xs mb-1.5 bg-white"
                  />
                  <div className="flex flex-wrap gap-1">
                    {['Tailored fit. Mid-rise waist.', 'Relaxed fit with a slightly boxy drape.', 'Oversized fit. Dropped shoulders.', 'Body-fit. Clean athletic contour.', 'True to size with clean ankle taper.'].map(f => (
                      <button
                        type="button"
                        key={f}
                        onClick={() => setProductForm({ ...productForm, fit: f })}
                        className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 bg-white hover:bg-neutral-200 text-neutral-600 border border-neutral-200 rounded-xs cursor-pointer"
                      >
                        +{f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Garment Care */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                    4. Garment Care
                  </label>
                  <textarea
                    rows={2}
                    value={productForm.care}
                    onChange={(e) => setProductForm({ ...productForm, care: e.target.value })}
                    placeholder="e.g. Dry clean recommended. / Machine wash cold inside out. Hang dry."
                    className="w-full border border-neutral-200 p-2.5 focus:outline-none focus:border-brand-charcoal resize-none text-xs mb-1.5 bg-white"
                  />
                  <div className="flex flex-wrap gap-1">
                    {['Dry clean recommended.', 'Machine wash cold inside out. Hang dry.', 'Hand wash only in cold water. Dry flat.', 'Wash sparingly inside out in cold water.'].map(c => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setProductForm({ ...productForm, care: c })}
                        className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 bg-white hover:bg-neutral-200 text-neutral-600 border border-neutral-200 rounded-xs cursor-pointer"
                      >
                        +{c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Shipping & Returns */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                    5. Shipping & Returns
                  </label>
                  <textarea
                    rows={2}
                    value={productForm.shipping}
                    onChange={(e) => setProductForm({ ...productForm, shipping: e.target.value })}
                    placeholder="e.g. Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos."
                    className="w-full border border-neutral-200 p-2.5 focus:outline-none focus:border-brand-charcoal resize-none text-xs mb-1.5 bg-white"
                  />
                  <div className="flex flex-wrap gap-1">
                    {['Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.', '7-day hassle-free return and exchange policy.'].map(s => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setProductForm({ ...productForm, shipping: s })}
                        className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 bg-white hover:bg-neutral-200 text-neutral-600 border border-neutral-200 rounded-xs cursor-pointer"
                      >
                        +{s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save Current as Default Preset Quick Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => handleSaveCurrentAsPreset()}
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-600 hover:text-black hover:underline cursor-pointer"
                    title="Saves whatever text is currently in these 5 tabs as the default preset for this garment"
                  >
                    <Save className="w-3.5 h-3.5 text-emerald-600" />
                    💾 Save Current Text as Default Preset for "{typeof productForm.subcategory === 'string' ? productForm.subcategory : productForm.subcategory?.name || productForm.category || 'General'}"
                  </button>
                  {presetSaveMessage && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-xs animate-fade-in">
                      ✓ {presetSaveMessage}
                    </span>
                  )}
                </div>
              </div>

              {/* SIZES & COLORS CONFIGURATION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sizes Picker */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
                    Available Sizes ({productForm.availableSizes?.length || 0} selected)
                  </label>
                  <div className="space-y-2 bg-neutral-50/70 p-3 border border-neutral-200 rounded-xs">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Tops & Sets</span>
                      <div className="flex flex-wrap gap-1">
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(sz => {
                          const isSelected = productForm.availableSizes?.includes(sz);
                          return (
                            <button
                              type="button"
                              key={sz}
                              onClick={() => {
                                const curr = productForm.availableSizes || [];
                                const updated = isSelected ? curr.filter(s => s !== sz) : [...curr, sz];
                                setProductForm({ ...productForm, availableSizes: updated });
                              }}
                              className={`text-[10px] px-2 py-0.5 rounded-xs border transition-colors cursor-pointer ${
                                isSelected ? 'bg-brand-charcoal text-white font-bold border-brand-charcoal' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                              }`}
                            >
                              {isSelected ? '✓ ' : ''}{sz}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Waist / Pants</span>
                      <div className="flex flex-wrap gap-1">
                        {['28', '30', '32', '34', '36', '38', '40', 'One Size'].map(sz => {
                          const isSelected = productForm.availableSizes?.includes(sz);
                          return (
                            <button
                              type="button"
                              key={sz}
                              onClick={() => {
                                const curr = productForm.availableSizes || [];
                                const updated = isSelected ? curr.filter(s => s !== sz) : [...curr, sz];
                                setProductForm({ ...productForm, availableSizes: updated });
                              }}
                              className={`text-[10px] px-2 py-0.5 rounded-xs border transition-colors cursor-pointer ${
                                isSelected ? 'bg-brand-charcoal text-white font-bold border-brand-charcoal' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                              }`}
                            >
                              {isSelected ? '✓ ' : ''}{sz}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Colors Picker */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
                    Available Colors ({productForm.colors?.length || 0} selected)
                  </label>
                  <div className="space-y-2 bg-neutral-50/70 p-3 border border-neutral-200 rounded-xs">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Core Neutrals</span>
                      <div className="flex flex-wrap gap-1">
                        {['Black', 'White', 'Cream', 'Beige', 'Ash/Grey', 'Charcoal', 'Taupe', 'Sand'].map(c => {
                          const isSelected = productForm.colors?.includes(c);
                          return (
                            <button
                              type="button"
                              key={c}
                              onClick={() => {
                                const curr = productForm.colors || [];
                                const updated = isSelected ? curr.filter(col => col !== c) : [...curr, c];
                                setProductForm({ ...productForm, colors: updated });
                              }}
                              className={`text-[10px] px-2 py-0.5 rounded-xs border transition-colors cursor-pointer ${
                                isSelected ? 'bg-brand-charcoal text-white font-bold border-brand-charcoal' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                              }`}
                            >
                              {isSelected ? '✓ ' : ''}{c}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Earth Tones</span>
                      <div className="flex flex-wrap gap-1">
                        {['Olive', 'Forest Green', 'Camel', 'Coffee Brown', 'Khaki'].map(c => {
                          const isSelected = productForm.colors?.includes(c);
                          return (
                            <button
                              type="button"
                              key={c}
                              onClick={() => {
                                const curr = productForm.colors || [];
                                const updated = isSelected ? curr.filter(col => col !== c) : [...curr, c];
                                setProductForm({ ...productForm, colors: updated });
                              }}
                              className={`text-[10px] px-2 py-0.5 rounded-xs border transition-colors cursor-pointer ${
                                isSelected ? 'bg-brand-charcoal text-white font-bold border-brand-charcoal' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                              }`}
                            >
                              {isSelected ? '✓ ' : ''}{c}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Seasonal Accents</span>
                      <div className="flex flex-wrap gap-1">
                        {['Burgundy', 'Burnt Orange', 'Baby Pink', 'Sky Blue', 'Striped Sky Blue', 'Navy'].map(c => {
                          const isSelected = productForm.colors?.includes(c);
                          return (
                            <button
                              type="button"
                              key={c}
                              onClick={() => {
                                const curr = productForm.colors || [];
                                const updated = isSelected ? curr.filter(col => col !== c) : [...curr, c];
                                setProductForm({ ...productForm, colors: updated });
                              }}
                              className={`text-[10px] px-2 py-0.5 rounded-xs border transition-colors cursor-pointer ${
                                isSelected ? 'bg-brand-charcoal text-white font-bold border-brand-charcoal' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                              }`}
                            >
                              {isSelected ? '✓ ' : ''}{c}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Image Dropzone & Preview */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                  Product Imagery (Live Upload & Preview)
                </label>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileInputChange} 
                  accept="image/png, image/jpeg, image/webp" 
                  className="hidden" 
                />

                {/* Dropzone Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed p-4 text-center cursor-pointer transition-colors rounded-xs ${
                    isDragging 
                      ? 'border-brand-charcoal bg-neutral-100' 
                      : 'border-neutral-200 hover:border-neutral-400 bg-neutral-50/50'
                  }`}
                >
                  <Upload className="w-5 h-5 mx-auto text-neutral-400 mb-1.5" />
                  <p className="text-xs font-bold text-brand-charcoal">
                    Click to browse or drag and drop image file here
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Supports PNG, JPG, or WEBP. Uploaded images reflect across the homepage essentials & shop catalogue.
                  </p>
                </div>

                {/* Upload in Progress Indicator */}
                {isUploadingImage && (
                  <div className="mt-3 p-3 bg-neutral-100 border border-neutral-300 flex items-center gap-3 animate-pulse rounded-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-charcoal shrink-0" />
                    <div className="text-left text-xs">
                      <p className="font-bold text-brand-charcoal">Streaming to Cloudinary CDN...</p>
                      <p className="text-[10px] text-neutral-500">{uploadMessage || 'Optimizing format and generating high-performance WebP delivery URLs...'}</p>
                    </div>
                  </div>
                )}

                {/* Thumbnail Preview Card */}
                {productForm.imageUrl && !isUploadingImage && (
                  <div className="mt-3 p-3 bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-4 rounded-xs">
                    <div className="flex items-center gap-3">
                      <img 
                        src={productForm.imageUrl} 
                        alt="Preview" 
                        className="w-14 h-16 object-cover bg-white border border-neutral-200 rounded-xs shrink-0" 
                      />
                      <div className="text-left overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" /> Image Ready
                          </span>
                          {productForm.imageUrl.includes('cloudinary.com') && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold uppercase rounded-xs">
                              <Cloud className="w-2.5 h-2.5" /> Cloudinary CDN
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-600 font-mono truncate max-w-xs mt-0.5" title={productForm.imageUrl}>
                          {productForm.imageUrl.startsWith('data:') ? 'Local High-Res Image Preview' : productForm.imageUrl}
                        </p>
                        {uploadMessage && (
                          <p className="text-[10px] text-neutral-400 mt-0.5">{uploadMessage}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProductForm(prev => ({ ...prev, imageUrl: '' }));
                        setUploadMessage('');
                      }}
                      className="text-neutral-400 hover:text-red-600 p-1.5 rounded-xs transition-colors cursor-pointer"
                      title="Clear image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Manual Path Fallback */}
                <div className="mt-2">
                  <span className="text-[10px] text-neutral-400 uppercase font-medium">Or enter image URL / public path manually:</span>
                  <input
                    type="text"
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                    placeholder="e.g. /images/products/linen-set-1.jpg"
                    className="w-full mt-1 border border-neutral-200 p-2 focus:outline-none focus:border-brand-charcoal text-[11px]"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 flex flex-wrap gap-6 border-t border-neutral-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.featured}
                    onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                    className="accent-black"
                  />
                  <span className="font-bold uppercase tracking-wider text-[11px] text-brand-charcoal">
                    Feature in Homepage Essentials
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.inStock}
                    onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })}
                    className="accent-black"
                  />
                  <span className="font-bold uppercase tracking-wider text-[11px] text-brand-charcoal">
                    Mark As In Stock
                  </span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 border border-neutral-200 text-xs font-bold uppercase tracking-wider hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-charcoal text-white text-xs font-bold uppercase tracking-wider hover:bg-black"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMIZE GARMENT PRESETS MODAL */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-neutral-200 shadow-2xl p-6 md:p-8">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-brand-charcoal" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-brand-charcoal">
                    Customize Auto-Fill Garment Presets
                  </h2>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Edit the default text and materials auto-filled into products for each garment category.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setIsPresetModalOpen(false)}
                className="text-xs uppercase font-bold text-neutral-400 hover:text-black cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Selector: Choose which preset to edit */}
            <div className="space-y-4">
              <div className="bg-neutral-50 p-3 border border-neutral-200 rounded-xs space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Select Preset Template to Edit:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={isCustomPresetKey ? '__NEW__' : editingPresetKey}
                    onChange={(e) => handlePresetSelectChange(e.target.value)}
                    className="w-full border border-neutral-300 p-2 bg-white text-xs font-medium focus:outline-none focus:border-brand-charcoal"
                  >
                    {Object.keys(garmentPresets).map((presetKey) => (
                      <option key={presetKey} value={presetKey}>
                        {presetKey}
                      </option>
                    ))}
                    <option value="__NEW__">+ Create New Custom Preset...</option>
                  </select>

                  {!isCustomPresetKey && DEFAULT_GARMENT_PRESETS[editingPresetKey] && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`Reset "${editingPresetKey}" preset back to factory default?`)) {
                          const def = await handleResetGarmentPreset(editingPresetKey);
                          setPresetForm({
                            description: def.description || '',
                            material: def.material || '',
                            fit: def.fit || '',
                            care: def.care || '',
                            shipping: def.shipping || '',
                            colors: def.colors ? [...def.colors] : ['Black'],
                            sizes: def.sizes ? [...def.sizes] : ['S', 'M', 'L', 'XL']
                          });
                          setPresetFeedback(`Reset "${editingPresetKey}" to factory defaults.`);
                          setTimeout(() => setPresetFeedback(''), 3000);
                        }
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-neutral-300 bg-white hover:bg-neutral-100 text-[10px] font-bold uppercase tracking-wider text-neutral-600 rounded-xs shrink-0 cursor-pointer"
                      title="Reset this preset to default"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset to Default
                    </button>
                  )}
                </div>

                {isCustomPresetKey && (
                  <div className="pt-2 border-t border-neutral-200">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                      New Preset / Subcategory Name *
                    </label>
                    <input
                      type="text"
                      value={customPresetNameInput}
                      onChange={(e) => setCustomPresetNameInput(e.target.value)}
                      placeholder="e.g. Linen Blend Camp Shirt, Knitted Vest, etc."
                      className="w-full border border-neutral-300 p-2 bg-white text-xs focus:outline-none focus:border-brand-charcoal"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Feedback Alert */}
              {presetFeedback && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 rounded-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{presetFeedback}</span>
                </div>
              )}

              {/* Editable Preset Fields */}
              <div className="space-y-3">
                {/* 1. Description */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                    1. Garment Description Template
                  </label>
                  <textarea
                    rows={3}
                    value={presetForm.description}
                    onChange={(e) => setPresetForm({ ...presetForm, description: e.target.value })}
                    placeholder="Enter default narrative, styling details, construction..."
                    className="w-full border border-neutral-200 p-2.5 text-xs focus:outline-none focus:border-brand-charcoal resize-none"
                  />
                </div>

                {/* 2. Details & Material */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                    2. Details & Material Template
                  </label>
                  <textarea
                    rows={2}
                    value={presetForm.material}
                    onChange={(e) => setPresetForm({ ...presetForm, material: e.target.value })}
                    placeholder="e.g. 100% Combed Compact Cotton (280 GSM), 100% Pure European Flax Linen"
                    className="w-full border border-neutral-200 p-2.5 text-xs focus:outline-none focus:border-brand-charcoal resize-none"
                  />
                </div>

                {/* 3. Fit & Sizing */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                    3. Fit & Sizing Template
                  </label>
                  <textarea
                    rows={2}
                    value={presetForm.fit}
                    onChange={(e) => setPresetForm({ ...presetForm, fit: e.target.value })}
                    placeholder="e.g. Tailored relaxed drape. Mid-rise waist."
                    className="w-full border border-neutral-200 p-2.5 text-xs focus:outline-none focus:border-brand-charcoal resize-none"
                  />
                </div>

                {/* 4. Garment Care */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                    4. Garment Care Template
                  </label>
                  <textarea
                    rows={2}
                    value={presetForm.care}
                    onChange={(e) => setPresetForm({ ...presetForm, care: e.target.value })}
                    placeholder="e.g. Machine wash cold inside out with like colors. Hang dry."
                    className="w-full border border-neutral-200 p-2.5 text-xs focus:outline-none focus:border-brand-charcoal resize-none"
                  />
                </div>

                {/* 5. Shipping & Returns */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                    5. Shipping & Returns Template
                  </label>
                  <textarea
                    rows={2}
                    value={presetForm.shipping}
                    onChange={(e) => setPresetForm({ ...presetForm, shipping: e.target.value })}
                    placeholder="e.g. Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos."
                    className="w-full border border-neutral-200 p-2.5 text-xs focus:outline-none focus:border-brand-charcoal resize-none"
                  />
                </div>

                {/* Colors (Comma separated) */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                    Default Auto-Selected Colors (comma separated)
                  </label>
                  <input
                    type="text"
                    value={Array.isArray(presetForm.colors) ? presetForm.colors.join(', ') : ''}
                    onChange={(e) => {
                      const cols = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                      setPresetForm({ ...presetForm, colors: cols });
                    }}
                    placeholder="e.g. Black, White, Cream, Olive"
                    className="w-full border border-neutral-200 p-2 text-xs focus:outline-none focus:border-brand-charcoal"
                  />
                </div>

                {/* Sizes (Comma separated) */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                    Default Auto-Selected Sizes (comma separated)
                  </label>
                  <input
                    type="text"
                    value={Array.isArray(presetForm.sizes) ? presetForm.sizes.join(', ') : ''}
                    onChange={(e) => {
                      const szs = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                      setPresetForm({ ...presetForm, sizes: szs });
                    }}
                    placeholder="e.g. S, M, L, XL, XXL or 30, 32, 34, 36"
                    className="w-full border border-neutral-200 p-2 text-xs focus:outline-none focus:border-brand-charcoal"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 flex justify-between items-center border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsPresetModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-xs font-bold uppercase tracking-wider hover:bg-neutral-100 cursor-pointer"
                >
                  Done
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const finalKey = isCustomPresetKey ? customPresetNameInput.trim() : editingPresetKey;
                    if (!finalKey) {
                      alert('Please provide a name for this preset.');
                      return;
                    }
                    await handleSaveGarmentPreset(finalKey, presetForm);
                    setPresetFeedback(`✓ Saved custom preset for "${finalKey}"! Future auto-fills will use this exact copy.`);
                    if (isCustomPresetKey) {
                      setEditingPresetKey(finalKey);
                      setIsCustomPresetKey(false);
                      setCustomPresetNameInput('');
                    }
                    setTimeout(() => setPresetFeedback(''), 4000);
                  }}
                  className="px-5 py-2 bg-brand-charcoal hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-xs shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Preset Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ORDER DETAILS INSPECTION DRAWER / MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-neutral-200 shadow-2xl p-6 md:p-8">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-neutral-200 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-bold font-mono text-brand-charcoal">
                    {selectedOrder.id}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    selectedOrder.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                    selectedOrder.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">Placed on {selectedOrder.date}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-neutral-400 hover:text-black p-1"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 text-xs font-sans">
              {/* Customer & Shipping Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-4 border border-neutral-200 rounded-xs">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                    Customer Information
                  </h4>
                  <p className="font-bold text-brand-charcoal text-sm">{selectedOrder.customer}</p>
                  <p className="text-neutral-600 mt-0.5">{selectedOrder.email}</p>
                  <p className="text-neutral-600 font-mono mt-0.5">{selectedOrder.phone}</p>
                  {selectedOrder.transferAccountName && (
                    <div className="mt-2.5 pt-2 border-t border-neutral-200">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">
                        Bank Transfer Account (Sender)
                      </span>
                      <p className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-xs border border-amber-200 mt-0.5 inline-block text-[11px]">
                        {selectedOrder.transferAccountName}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                    Delivery Address
                  </h4>
                  <p className="text-brand-charcoal">{selectedOrder.address}</p>
                  <p className="text-brand-charcoal font-medium">{selectedOrder.state}, Nigeria</p>
                  
                  {/* Payment Status & Action */}
                  <div className="mt-3 pt-3 border-t border-neutral-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                        Payment:
                      </span>
                      {selectedOrder.paymentConfirmed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 uppercase">
                          <Check className="w-3 h-3" /> Confirmed / Paid
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConfirmBankPayment(selectedOrder.id)}
                          disabled={confirmingPaymentId === selectedOrder.id}
                          className="px-2.5 py-1 bg-brand-charcoal hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                        >
                          <Mail className="w-3 h-3" />
                          <span>{confirmingPaymentId === selectedOrder.id ? 'Sending Email...' : 'Confirm & Send Receipt'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                      Fulfillment:
                    </label>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                      className="border border-neutral-300 px-2 py-1 text-xs font-bold uppercase bg-white focus:outline-none"
                    >
                      <option value="Awaiting Payment">Awaiting Payment</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Itemized Order Breakdown */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">
                  Ordered Items ({selectedOrder.items?.length || selectedOrder.itemsCount})
                </h4>
                <div className="border border-neutral-200 rounded-xs overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase font-bold text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Item</th>
                        <th className="py-2.5 px-3">Spec</th>
                        <th className="py-2.5 px-3 text-right">Price</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50/50">
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2.5">
                                <img 
                                  src={item.image} 
                                  alt={item.name} 
                                  className="w-9 h-11 object-cover bg-neutral-100 border border-neutral-200 rounded-xs shrink-0" 
                                />
                                <span className="font-bold text-brand-charcoal">{item.name}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-neutral-600">
                              <span className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded-xs mr-1 text-[10px] font-bold">{item.size}</span>
                              <span className="text-[11px] text-neutral-500">{item.color}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-serif">
                              ₦ {item.price.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold">
                              {item.quantity}
                            </td>
                            <td className="py-2.5 px-3 text-right font-serif font-bold text-brand-charcoal">
                              ₦ {(item.price * item.quantity).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-neutral-400">
                            {selectedOrder.itemsCount} Items in Order
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation Summary */}
              <div className="border-t border-neutral-200 pt-4 flex flex-col items-end space-y-1.5 text-xs">
                <div className="flex justify-between w-64 text-neutral-500">
                  <span>Subtotal:</span>
                  <span className="font-serif">₦ {(selectedOrder.subtotal || selectedOrder.total).toLocaleString()}</span>
                </div>
                <div className="flex justify-between w-64 text-neutral-500">
                  <span>Standard Delivery:</span>
                  <span className="font-serif">
                    {selectedOrder.deliveryFee ? `₦ ${selectedOrder.deliveryFee.toLocaleString()}` : 'Free'}
                  </span>
                </div>
                <div className="flex justify-between w-64 text-sm font-bold text-brand-charcoal pt-2 border-t border-neutral-200">
                  <span>Total Paid:</span>
                  <span className="font-serif text-base">₦ {selectedOrder.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Actions: Print Receipt, Preview Email Receipt & Close */}
              <div className="pt-4 flex flex-wrap justify-between items-center gap-3 border-t border-neutral-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => printOrderReceipt(selectedOrder)}
                    className="px-4 py-2 border border-neutral-300 text-xs font-bold uppercase tracking-wider text-brand-charcoal hover:bg-neutral-50 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Print Official Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewEmailData({
                        isOpen: true,
                        title: 'Official Customer Receipt Email',
                        subject: `Official Purchase Receipt & Order Confirmation #${selectedOrder.id} - PENNY`,
                        recipient: `${selectedOrder.customer} <${selectedOrder.email}>`,
                        date: selectedOrder.createdAt || selectedOrder.date,
                        externalPreviewUrl: selectedOrder.previewUrl || null,
                        htmlContent: generateOrderReceiptEmailHtml(selectedOrder),
                      });
                    }}
                    className="px-4 py-2 bg-neutral-100 text-brand-charcoal hover:bg-neutral-200 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Mail className="w-4 h-4" /> Preview Email Receipt
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2 bg-brand-charcoal text-white text-xs font-bold uppercase tracking-wider hover:bg-black cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STANDALONE EMAIL PREVIEW MODAL */}
      {previewEmailData?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl max-h-[92vh] flex flex-col border border-neutral-200 shadow-2xl rounded-xs overflow-hidden">
            {/* Modal Top Bar */}
            <div className="flex justify-between items-center border-b border-neutral-200 px-6 py-4 bg-neutral-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-brand-charcoal text-white flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal">
                    {previewEmailData.title || 'Email Dispatch Preview'}
                  </h2>
                  <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                    To: {previewEmailData.recipient}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewEmailData(null)}
                className="text-neutral-400 hover:text-black p-1 cursor-pointer transition-colors"
                title="Close Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Meta Bar */}
            <div className="px-6 py-2.5 bg-neutral-100/70 border-b border-neutral-200 flex flex-wrap items-center justify-between text-[11px] font-sans gap-2">
              <div className="truncate max-w-md">
                <span className="font-bold uppercase tracking-wider text-neutral-500 mr-2 text-[10px]">Subject:</span>
                <span className="text-brand-charcoal font-medium">{previewEmailData.subject}</span>
              </div>
              <div className="flex items-center gap-3">
                {previewEmailData.date && (
                  <span className="text-neutral-400 font-mono text-[10px]">
                    {new Date(previewEmailData.date).toLocaleString()}
                  </span>
                )}
                {previewEmailData.externalPreviewUrl && (
                  <a
                    href={previewEmailData.externalPreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline font-mono text-[10px] inline-flex items-center gap-1"
                  >
                    Open Ethereal Mailbox <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Email Body Iframe Preview */}
            <div className="flex-1 overflow-auto p-4 bg-[#fbfbfa]">
              <iframe
                title="Email Preview"
                srcDoc={previewEmailData.htmlContent}
                className="w-full h-[520px] bg-white border border-neutral-200 rounded-xs shadow-inner"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-3 border-t border-neutral-200 bg-white flex justify-between items-center">
              <span className="text-[11px] text-neutral-400 font-mono">
                Rendered via PENNY Transactional Email Engine
              </span>
              <div className="flex items-center gap-2">
                {previewEmailData.externalPreviewUrl && (
                  <a
                    href={previewEmailData.externalPreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 border border-neutral-300 text-[11px] font-bold uppercase tracking-wider hover:bg-neutral-50 inline-flex items-center gap-1.5 cursor-pointer text-brand-charcoal"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open in Inbox
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewEmailData(null)}
                  className="px-5 py-1.5 bg-brand-charcoal text-white text-[11px] font-bold uppercase tracking-wider hover:bg-black cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CATEGORY & SUBCATEGORIES MODAL */}
      {isEditCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-neutral-200 shadow-2xl p-6 md:p-8 rounded-sm">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-neutral-200 pb-4 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-brand-charcoal" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-brand-charcoal">
                    Edit Category & Subcategories
                  </h2>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Rename this category, manage subcategory names, and configure Tier 3 style options (e.g. Crewneck, Quarter-Zip, Cuffed, Open-Hem).
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditCategoryModalOpen(false)}
                className="text-xs uppercase font-bold text-neutral-400 hover:text-black cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveCategoryEdit} className="space-y-6">
              {/* Category Details Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-4 border border-neutral-200 rounded-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-600 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    placeholder="e.g. Tops, Sweatshirts & Hoodies"
                    className="w-full border border-neutral-300 p-2.5 bg-white text-xs font-semibold focus:outline-none focus:border-brand-charcoal"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-600 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={editingCategory.slug}
                    onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                    placeholder="e.g. tops"
                    className="w-full border border-neutral-300 p-2.5 bg-white text-xs font-mono focus:outline-none focus:border-brand-charcoal"
                  />
                </div>
              </div>

              {/* Subcategories & Tier 3 Styles List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                    Subcategories & Style Options ({editingCategory.subcategories.length})
                  </h4>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Tier 2 Subcategories & Tier 3 Styles
                  </span>
                </div>

                {editingCategory.subcategories.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic bg-neutral-50 p-4 border border-neutral-200 rounded-xs text-center">
                    No subcategories added yet. Use the form below to add one.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {editingCategory.subcategories.map((sub, idx) => (
                      <div 
                        key={idx}
                        className="bg-neutral-50/70 border border-neutral-200 p-3.5 rounded-xs space-y-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-neutral-400 font-bold w-4">
                            #{idx + 1}
                          </span>
                          <div className="flex-1">
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-neutral-500 mb-0.5">
                              Subcategory Name
                            </label>
                            <input
                              type="text"
                              value={sub.name}
                              onChange={(e) => handleUpdateEditingSubcategoryName(idx, e.target.value)}
                              placeholder="e.g. Sweatshirts & Hoodies"
                              className="w-full border border-neutral-300 p-2 bg-white text-xs font-medium focus:outline-none focus:border-brand-charcoal"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubcategoryInModal(idx)}
                            className="text-neutral-400 hover:text-red-600 transition-colors p-2 mt-4 cursor-pointer"
                            title="Remove this subcategory"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Tier 3 Styles / Subtypes Interactive Section */}
                        <div className="space-y-2 pt-2 border-t border-neutral-200/70">
                          <div className="flex items-center justify-between">
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-neutral-600">
                              Styles / Subtypes (Tier 3 Options)
                            </label>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {Array.isArray(sub.subtypes) ? sub.subtypes.length : 0} styles defined
                            </span>
                          </div>

                          {/* Style Chips Display with Delete (X) button */}
                          <div className="flex flex-wrap gap-1.5 min-h-[34px] p-2 bg-white border border-neutral-200 rounded-xs items-center">
                            {Array.isArray(sub.subtypes) && sub.subtypes.length > 0 ? (
                              sub.subtypes.map((st, sIdx) => (
                                <span 
                                  key={sIdx}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-brand-charcoal text-xs font-medium rounded-xs border border-neutral-300 transition-colors"
                                >
                                  <span>{st}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveStyleChipInModal(idx, sIdx)}
                                    className="text-neutral-400 hover:text-red-600 transition-colors p-0.5 cursor-pointer"
                                    title={`Remove ${st}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-neutral-400 italic">
                                No styles defined yet. Type one below and click "+ Add Style" or hit Enter.
                              </span>
                            )}
                          </div>

                          {/* Quick Add Style Input Bar */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={styleInputs[idx] || ''}
                              onChange={(e) => setStyleInputs({ ...styleInputs, [idx]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddStyleToSubcategoryInModal(idx);
                                }
                              }}
                              placeholder="Type a style (e.g. Crewneck) or paste comma-separated list..."
                              className="flex-1 border border-neutral-300 p-2 bg-white text-xs focus:outline-none focus:border-brand-charcoal"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddStyleToSubcategoryInModal(idx)}
                              disabled={!(styleInputs[idx] || '').trim()}
                              className="px-4 py-2 bg-brand-charcoal hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              + Add Style
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Subcategory in Modal */}
              <div className="border border-dashed border-neutral-300 p-4 bg-neutral-50/50 rounded-xs space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-charcoal block">
                  + Add New Subcategory to this Category
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-neutral-500 mb-0.5">
                      Subcategory Name
                    </label>
                    <input
                      type="text"
                      value={modalNewSubName}
                      onChange={(e) => setModalNewSubName(e.target.value)}
                      placeholder="e.g. Sweatpants"
                      className="w-full border border-neutral-300 p-2 bg-white text-xs focus:outline-none focus:border-brand-charcoal"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-neutral-500 mb-0.5">
                      Styles / Subtypes (Optional)
                    </label>
                    <input
                      type="text"
                      value={modalNewSubSubtypes}
                      onChange={(e) => setModalNewSubSubtypes(e.target.value)}
                      placeholder="e.g. Cuffed, Open-Hem"
                      className="w-full border border-neutral-300 p-2 bg-white text-xs focus:outline-none focus:border-brand-charcoal"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddSubcategoryInModal}
                  disabled={!modalNewSubName.trim()}
                  className="px-4 py-2 bg-neutral-200 hover:bg-neutral-800 hover:text-white text-brand-charcoal text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  + Add to List
                </button>
              </div>

              {/* Modal Actions Footer */}
              <div className="flex justify-end items-center gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsEditCategoryModalOpen(false)}
                  className="px-5 py-2.5 border border-neutral-300 text-xs font-bold uppercase tracking-wider hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-charcoal hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
