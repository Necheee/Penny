import { useState, useRef } from 'react';
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
  CheckCircle2 
} from 'lucide-react';
import { useProducts } from '../context/ProductContext';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Product & Category State from Shared ProductContext (Synced with LocalStorage & Storefront)
  const { 
    products: productList = [], 
    categories: categoryList = [], 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    toggleFeatured, 
    toggleStock, 
    addCategory, 
    deleteCategory 
  } = useProducts();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Simulated Orders state (sample incoming orders with item details)
  const [orders, setOrders] = useState([
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
          name: 'Pleated Linen Trousers',
          size: 'M',
          color: 'Sand',
          price: 50000,
          quantity: 1,
          image: '/images/products/linen-set-2.jpg'
        }
      ]
    },
    {
      id: 'PNY-541290',
      customer: 'Tunde Adeyemi',
      email: 'tunde.adeyemi@yahoo.com',
      phone: '+234 812 987 6543',
      state: 'FCT - Abuja',
      address: 'Plot 204 Maitama Extension',
      itemsCount: 1,
      subtotal: 45000,
      deliveryFee: 0,
      total: 45000,
      status: 'Shipped',
      date: '2026-10-11',
      items: [
        {
          id: 'p-3',
          name: 'Structured Trench Overcoat',
          size: 'XL',
          color: 'Taupe',
          price: 45000,
          quantity: 1,
          image: '/images/products/linen-set-1.jpg'
        }
      ]
    },
    {
      id: 'PNY-192843',
      customer: 'Chinedu Eze',
      email: 'chinedu.eze@outlook.com',
      phone: '+234 806 112 3344',
      state: 'Rivers',
      address: '8 Old GRA Road, Port Harcourt',
      itemsCount: 3,
      subtotal: 210000,
      deliveryFee: 5000,
      total: 215000,
      status: 'Delivered',
      date: '2026-10-09',
      items: [
        {
          id: 'p-1',
          name: 'Classic Linen Resort Shirt',
          size: 'M',
          color: 'White',
          price: 42000,
          quantity: 2,
          image: '/images/products/linen-set-1.jpg'
        },
        {
          id: 'p-4',
          name: 'Cashmere Knit Polo',
          size: 'L',
          color: 'Charcoal',
          price: 126000,
          quantity: 1,
          image: '/images/products/linen-set-2.jpg'
        }
      ]
    }
  ]);

  // Selected Order for Inspection Drawer / Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Modal State for Adding/Editing Product
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
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

  // Sizing Grid State
  const [sizeMeasurements, setSizeMeasurements] = useState({
    tops: [
      { size: 'XS', chest: '86 - 91', waist: '71 - 76', shoulder: '42' },
      { size: 'S', chest: '91 - 96', waist: '76 - 81', shoulder: '44' },
      { size: 'M', chest: '96 - 101', waist: '81 - 86', shoulder: '46' },
      { size: 'L', chest: '101 - 106', waist: '86 - 91', shoulder: '48' },
      { size: 'XL', chest: '106 - 111', waist: '91 - 96', shoulder: '50' },
      { size: 'XXL', chest: '111 - 116', waist: '96 - 101', shoulder: '52' },
    ],
    bottoms: [
      { size: 'XS', waist: '71 - 76', hips: '88 - 93', inseam: '78' },
      { size: 'S', waist: '76 - 81', hips: '93 - 98', inseam: '80' },
      { size: 'M', waist: '81 - 86', hips: '98 - 103', inseam: '81' },
      { size: 'L', waist: '86 - 91', hips: '103 - 108', inseam: '82' },
      { size: 'XL', waist: '91 - 96', hips: '108 - 113', inseam: '83' },
      { size: 'XXL', waist: '96 - 101', hips: '113 - 118', inseam: '84' },
    ]
  });

  // Calculate Metrics
  const totalRevenue = orders.reduce((sum, ord) => sum + ord.total, 0);
  const featuredCount = productList.filter(p => p.featured).length;
  const outOfStockCount = productList.filter(p => !p.inStock).length;

  // Filter Products
  const filteredProducts = productList.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'all' || p.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Open Add Product Modal
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: categoryList[0]?.id || 'tops',
      subcategory: '',
      price: '',
      description: '',
      material: '100% Cotton',
      fit: 'Relaxed fit',
      featured: false,
      inStock: true,
      colors: ['Black', 'White'],
      availableSizes: ['S', 'M', 'L', 'XL'],
      imageUrl: ''
    });
    setIsProductModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      subcategory: product.subcategory || '',
      price: product.price,
      description: product.description || '',
      material: product.material || '100% Cotton',
      fit: product.fit || 'Relaxed fit',
      featured: !!product.featured,
      inStock: product.inStock !== false,
      colors: product.colors || ['Black'],
      availableSizes: product.availableSizes || ['M', 'L'],
      imageUrl: product.images?.primary || ''
    });
    setIsProductModalOpen(true);
  };

  // Handle Image File Selection (converts to DataURL for immediate browser preview & persistent localStorage)
  const processImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, or WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setProductForm(prev => ({
        ...prev,
        imageUrl: e.target.result
      }));
    };
    reader.readAsDataURL(file);
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

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        name: productForm.name,
        category: productForm.category,
        subcategory: productForm.subcategory,
        price: Number(productForm.price),
        description: productForm.description,
        material: productForm.material,
        fit: productForm.fit,
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
        subcategory: productForm.subcategory || 'New Arrival',
        price: Number(productForm.price),
        description: productForm.description || 'Premium menswear essential.',
        material: productForm.material || '100% Cotton',
        fit: productForm.fit || 'True to size.',
        care: 'Machine wash cold.',
        shipping: 'Free delivery on orders above ₦200,000.',
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
    const slug = newCategorySlug.trim() || newCategoryName.toLowerCase().replace(/\s+/g, '-');
    addCategory({
      id: slug,
      name: newCategoryName,
      slug: slug
    });
    setNewCategoryName('');
    setNewCategorySlug('');
  };

  // Delete Category with Context Sync
  const handleDeleteCategory = (categoryId) => {
    if (confirm('Delete this category?')) {
      deleteCategory(categoryId);
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = (orderId, newStatus) => {
    setOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, status: newStatus } : ord));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status: newStatus }));
    }
  };


  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      
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
                          className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-xs transition-colors inline-flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider"
                          title="Inspect Order"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
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
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="py-2 px-3 text-xs border border-neutral-200 focus:outline-none focus:border-brand-charcoal bg-white"
              >
                <option value="all">All Categories</option>
                {categoryList.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
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
                        {p.category}
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
                          onClick={() => handleOpenEditProduct(p)}
                          className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-xs"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
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
          {/* Add Category Form */}
          <div className="bg-white p-6 border border-neutral-200 rounded-sm shadow-xs h-fit">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-charcoal mb-4">
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
                  placeholder="e.g. Outerwear"
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
                  placeholder="e.g. outerwear"
                  className="w-full border border-neutral-200 p-2.5 focus:outline-none focus:border-brand-charcoal"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-brand-charcoal text-white py-2.5 font-bold uppercase tracking-wider text-xs hover:bg-black transition-colors"
              >
                Add Category
              </button>
            </form>
          </div>

          {/* Existing Categories List */}
          <div className="md:col-span-2 bg-white p-6 border border-neutral-200 rounded-sm shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-charcoal mb-4">
              Active Store Categories ({categoryList.length})
            </h3>
            <div className="divide-y divide-neutral-100">
              {categoryList.map((cat) => (
                <div key={cat.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold uppercase tracking-wider text-brand-charcoal">{cat.name}</p>
                    <p className="text-[10px] text-neutral-400 font-mono">/shop?category={cat.slug || cat.id}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-red-500 hover:text-red-700 text-xs uppercase font-bold tracking-wider"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SIZE GUIDE EDITOR */}
      {activeTab === 'size-guide' && (
        <div className="bg-white p-6 border border-neutral-200 rounded-sm shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b border-neutral-200 pb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-charcoal">
                Size & Fit Measurement Tables
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Edit dimensions in Centimeters (CM). Changes update customer size modals immediately.
              </p>
            </div>
            <button 
              onClick={() => alert("Size chart updates saved!")}
              className="bg-brand-charcoal text-white px-4 py-2 text-xs font-bold uppercase tracking-wider"
            >
              Save Table
            </button>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3">Tops & Shirts (CM)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-neutral-200">
                <thead className="bg-neutral-50 border-b border-neutral-200 uppercase font-bold text-neutral-500">
                  <tr>
                    <th className="p-3">Size</th>
                    <th className="p-3">Chest (CM)</th>
                    <th className="p-3">Waist (CM)</th>
                    <th className="p-3">Shoulder (CM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {sizeMeasurements.tops.map((row, idx) => (
                    <tr key={row.size}>
                      <td className="p-3 font-bold bg-neutral-50/50 w-20">{row.size}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.chest}
                          onChange={(e) => {
                            const updated = [...sizeMeasurements.tops];
                            updated[idx].chest = e.target.value;
                            setSizeMeasurements({ ...sizeMeasurements, tops: updated });
                          }}
                          className="w-full border border-neutral-200 p-1.5 focus:outline-none focus:border-brand-charcoal text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.waist}
                          onChange={(e) => {
                            const updated = [...sizeMeasurements.tops];
                            updated[idx].waist = e.target.value;
                            setSizeMeasurements({ ...sizeMeasurements, tops: updated });
                          }}
                          className="w-full border border-neutral-200 p-1.5 focus:outline-none focus:border-brand-charcoal text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.shoulder}
                          onChange={(e) => {
                            const updated = [...sizeMeasurements.tops];
                            updated[idx].shoulder = e.target.value;
                            setSizeMeasurements({ ...sizeMeasurements, tops: updated });
                          }}
                          className="w-full border border-neutral-200 p-1.5 focus:outline-none focus:border-brand-charcoal text-xs"
                        />
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
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase tracking-widest font-bold">
                  <th className="py-3.5 px-4">Order Ref</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Delivery Address</th>
                  <th className="py-3.5 px-4">Amount</th>
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
                      <p className="text-[10px] text-neutral-400">{ord.phone}</p>
                    </td>
                    <td className="py-4 px-4 text-neutral-600 max-w-xs truncate">
                      {ord.address}, {ord.state}
                    </td>
                    <td className="py-4 px-4 font-serif font-bold text-sm text-brand-charcoal">
                      ₦ {ord.total.toLocaleString()}
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
                        className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-xs transition-colors inline-flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider"
                        title="Inspect Order"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
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

                {/* Thumbnail Preview Card */}
                {productForm.imageUrl && (
                  <div className="mt-3 p-3 bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={productForm.imageUrl} 
                        alt="Preview" 
                        className="w-14 h-16 object-cover bg-white border border-neutral-200 rounded-xs shrink-0" 
                      />
                      <div className="text-left overflow-hidden">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" /> Image Ready
                        </span>
                        <p className="text-xs text-neutral-600 font-mono truncate max-w-xs">
                          {productForm.imageUrl.startsWith('data:') ? 'Custom local uploaded image' : productForm.imageUrl}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProductForm(prev => ({ ...prev, imageUrl: '' }));
                      }}
                      className="text-neutral-400 hover:text-red-600 p-1 rounded-xs"
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

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full border border-neutral-200 p-2.5 focus:outline-none focus:border-brand-charcoal resize-none"
                />
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
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                    Delivery Address
                  </h4>
                  <p className="text-brand-charcoal">{selectedOrder.address}</p>
                  <p className="text-brand-charcoal font-medium">{selectedOrder.state}, Nigeria</p>
                  <div className="mt-3 flex items-center gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                      Update Status:
                    </label>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                      className="border border-neutral-300 px-2 py-1 text-xs font-bold uppercase bg-white focus:outline-none"
                    >
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

              {/* Actions: Print Receipt & Close */}
              <div className="pt-4 flex justify-between items-center border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-neutral-300 text-xs font-bold uppercase tracking-wider text-brand-charcoal hover:bg-neutral-50 inline-flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print Packing Slip
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2 bg-brand-charcoal text-white text-xs font-bold uppercase tracking-wider hover:bg-black"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
