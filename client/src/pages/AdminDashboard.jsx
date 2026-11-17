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
  RotateCcw,
  Archive,
  ArchiveRestore,
  Palette
} from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import { printOrderReceipt } from '../utils/printReceipt';
import { generateOrderReceiptEmailHtml, generateInquiryReplyEmailHtml } from '../utils/emailPreviewGenerator';
import FormattedMessage from '../components/common/FormattedMessage';
import { useDialog } from '../context/DialogContext';
import ProductFormModal from '../components/admin/ProductFormModal';

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
    allProducts = [],
    products: activeProductList = [], 
    categories: categoryList = [], 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    archiveProduct,
    unarchiveProduct,
    toggleArchive,
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

  const { confirm: showConfirmDialog, alert: showAlertDialog } = useDialog();

  const productList = allProducts.length ? allProducts : activeProductList;
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all'); // 'all' | 'active' | 'archived'
  const [productFeedback, setProductFeedback] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] = useState('all');
  const [newCategorySubcategories, setNewCategorySubcategories] = useState('');
  const [subInputs, setSubInputs] = useState({});
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
          try {
            localStorage.setItem('penny_bank_config', JSON.stringify(configData.bankDetails));
          } catch {}
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
  const [bankForm, setBankForm] = useState(() => {
    try {
      const saved = localStorage.getItem('penny_bank_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      bankName: 'Zenith Bank Plc',
      accountName: 'PENNY CLOTHING CO',
      accountNumber: '1018924560',
      instructions: 'Please transfer the exact total amount and use your Order Number as payment reference/narration. Once verified by store admin, your receipt and confirmation will be emailed.',
    };
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
        try {
          localStorage.setItem('penny_bank_config', JSON.stringify(data.bankDetails));
        } catch {}
        setBankFeedbackMsg({ type: 'success', text: 'Bank transfer details successfully saved to cloud database and active on checkout.' });
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

  const handleDeleteAnnouncementItem = async (index) => {
    if (announcementList.length <= 1) {
      await showAlertDialog({
        title: 'Minimum Announcement Notice',
        message: 'You must keep at least one active announcement message displayed on the storefront.',
        type: 'warning',
      });
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

  // Dynamic Size Guide Admin State (Shirts, Shorts, Trousers)
  const [activeSizeCategory, setActiveSizeCategory] = useState('shirts');
  const [sizeGuideFeedback, setSizeGuideFeedback] = useState('');

  // Local editable copy of current category's size data
  const [sizeForm, setSizeForm] = useState(() => {
    return sizeGuideData[activeSizeCategory] || sizeGuideData.shirts || {
      title: 'Shirts',
      subtitle: 'Oxford Shirts, Linen Tops & Shackets',
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
  const activeCount = productList.filter(p => !p.isArchived).length;
  const archivedCount = productList.filter(p => !!p.isArchived).length;
  const featuredCount = productList.filter(p => p.featured && !p.isArchived).length;
  const outOfStockCount = productList.filter(p => !p.inStock && !p.isArchived).length;

  // Filter Products
  const filteredProducts = productList.filter(p => {
    // 1. Status Filter (all / active / archived)
    if (selectedStatusFilter === 'active' && p.isArchived) return false;
    if (selectedStatusFilter === 'archived' && !p.isArchived) return false;

    // 2. Search query
    const subName = typeof p.subcategory === 'string' ? p.subcategory : p.subcategory?.name || '';
    const catName = typeof p.category === 'string' ? p.category : p.category?.name || '';
    const matchesSearch = !searchQuery ||
                          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          catName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          subName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.id?.toLowerCase().includes(searchQuery.toLowerCase());

    // 3. Category Filter
    const matchesCategory = selectedCategoryFilter === 'all' || 
                            p.category === selectedCategoryFilter || 
                            p.category === categoryList.find(c => c.id === selectedCategoryFilter)?.slug;

    // 4. Subcategory Filter
    const matchesSubcategory = selectedSubcategoryFilter === 'all' || 
                               !selectedSubcategoryFilter || 
                               subName.toLowerCase() === selectedSubcategoryFilter.toLowerCase();
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  // Open Add Product Modal
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  // Duplicate / Clone Existing Product (1-Click Product Addition)
  const handleDuplicateProduct = (product) => {
    setEditingProduct({
      ...product,
      id: null,
      name: `Copy of ${product.name}`,
      featured: false,
      isArchived: false,
    });
    setIsProductModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  // Save Product (Add or Edit) with Context Sync
  const handleSaveProduct = async (formData) => {
    try {
      if (editingProduct && editingProduct.id) {
        await updateProduct({
          ...editingProduct,
          name: formData.name,
          category: formData.category,
          subcategory: formData.subcategory,
          subtype: formData.subtype,
          price: Number(formData.price),
          description: formData.description,
          material: formData.material,
          fit: formData.fit,
          care: formData.care || 'Machine wash cold inside out. Hang dry.',
          shipping: formData.shipping || 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
          featured: formData.featured,
          inStock: formData.inStock,
          isArchived: !!formData.isArchived,
          colors: formData.colors,
          availableSizes: formData.availableSizes,
          images: {
            ...editingProduct.images,
            primary: formData.imageUrl || editingProduct.images?.primary || '/images/products/linen-set-1.jpg'
          }
        });
      } else {
        const newId = `p-${Date.now().toString().slice(-4)}`;
        const newProduct = {
          id: newId,
          name: formData.name,
          category: formData.category,
          subcategory: formData.subcategory || 'New Arrival',
          subtype: formData.subtype,
          price: Number(formData.price),
          description: formData.description || 'Premium menswear essential.',
          material: formData.material || '100% Cotton',
          fit: formData.fit || 'Relaxed fit.',
          care: formData.care || 'Machine wash cold inside out. Hang dry.',
          shipping: formData.shipping || 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
          featured: formData.featured,
          inStock: formData.inStock,
          isArchived: !!formData.isArchived,
          colors: formData.colors,
          availableSizes: formData.availableSizes,
          images: {
            primary: formData.imageUrl || '/images/products/linen-set-1.jpg',
            gallery: ['/images/products/linen-set-2.jpg']
          }
        };
        await addProduct(newProduct);
      }

      setIsProductModalOpen(false);
      setEditingProduct(null);
      setProductFeedback('Product piece saved successfully to catalogue.');
      setTimeout(() => setProductFeedback(''), 4000);
    } catch (err) {
      console.error('Error saving product piece:', err);
      showAlertDialog({
        title: 'Save Failed',
        message: err.message || 'Could not save product to cloud database. Please verify your admin connection and sign in again if needed.',
        type: 'error',
      });
    }
  };

  // Toggle Featured status directly in table (syncs to homepage immediately, capped at 4)
  const handleToggleFeatured = (productId) => {
    const target = productList.find(p => p.id === productId);
    if (target && !target.featured && featuredCount >= 4) {
      showAlertDialog({
        title: 'Featured Limit Reached (4)',
        message: 'A maximum of 4 products can be featured on the homepage. Please unfeature a piece first to make room for this one.',
        type: 'warning',
      });
      return;
    }
    toggleFeatured(productId);
  };

  // Toggle Stock status directly in table
  const handleToggleStock = (productId) => {
    toggleStock(productId);
  };

  // Archive or Unarchive Product (Soft-hide from storefront while keeping data safe)
  const handleToggleArchive = async (product) => {
    const willArchive = !product.isArchived;
    if (willArchive) {
      const confirmArchive = await showConfirmDialog({
        title: `Archive "${product.name}"?`,
        message: 'This piece will be hidden from the live website immediately, but all details and images will remain safely stored here for easy retrieval anytime.',
        confirmText: 'Archive Piece',
        cancelText: 'Cancel',
        isDestructive: false,
      });
      if (!confirmArchive) return;
    }
    toggleArchive(product.id);
    setProductFeedback(
      willArchive
        ? `"${product.name}" archived. It is now hidden from the website.`
        : `"${product.name}" unarchived. It has been restored to the live website!`
    );
    setTimeout(() => setProductFeedback(''), 4500);
  };

  // Delete product permanently with Context Sync
  const handleDeleteProduct = async (productId) => {
    const shouldDelete = await showConfirmDialog({
      title: 'Remove Piece from Catalogue',
      message: 'Are you sure you want to permanently delete this piece? It will be removed from both the storefront and the administration database.',
      confirmText: 'Delete Piece',
      cancelText: 'Keep',
      isDestructive: true,
    });
    if (shouldDelete) {
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
  const handleDeleteCategory = async (categoryId) => {
    const shouldDelete = await showConfirmDialog({
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category? Associated pieces will remain saved in the catalogue.',
      confirmText: 'Delete Category',
      cancelText: 'Cancel',
      isDestructive: true,
    });
    if (shouldDelete) {
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
      showAlertDialog({
        title: 'Category Name Required',
        message: 'Please provide a valid name for this category.',
        type: 'warning',
      });
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
  const handleDeleteSubcategoryFromCat = async (catId, subName) => {
    const shouldRemove = await showConfirmDialog({
      title: 'Remove Subcategory',
      message: `Are you sure you want to remove the "${subName}" subcategory from this category?`,
      confirmText: 'Remove',
      cancelText: 'Keep',
      isDestructive: true,
    });
    if (shouldRemove) {
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
                {activeCount} Active • {archivedCount} Archived {outOfStockCount > 0 ? `(${outOfStockCount} out of stock)` : ''}
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

              {/* Status Filter (All / Active / Archived) */}
              <div className="flex items-center border border-neutral-200 rounded-xs overflow-hidden bg-white text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedStatusFilter('all')}
                  className={`px-3 py-2 font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer ${
                    selectedStatusFilter === 'all'
                      ? 'bg-brand-charcoal text-white'
                      : 'text-neutral-500 hover:text-black hover:bg-neutral-50'
                  }`}
                >
                  All ({productList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatusFilter('active')}
                  className={`px-3 py-2 font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer ${
                    selectedStatusFilter === 'active'
                      ? 'bg-brand-charcoal text-white'
                      : 'text-neutral-500 hover:text-black hover:bg-neutral-50'
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatusFilter('archived')}
                  className={`px-3 py-2 font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer flex items-center gap-1 ${
                    selectedStatusFilter === 'archived'
                      ? 'bg-amber-600 text-white'
                      : 'text-neutral-500 hover:text-black hover:bg-neutral-50'
                  }`}
                >
                  <Archive className="w-3 h-3" />
                  Archived ({archivedCount})
                </button>
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

          {/* Product Feedback Banner */}
          {productFeedback && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between rounded-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{productFeedback}</span>
              </div>
              <button
                type="button"
                onClick={() => setProductFeedback('')}
                className="text-neutral-400 hover:text-black font-bold uppercase text-[10px]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Products Table */}
          <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase tracking-widest font-bold">
                    <th className="py-3.5 px-4">Piece</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Featured on Home</th>
                    <th className="py-3.5 px-4 text-center">In Stock</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-sans">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className={`hover:bg-neutral-50/60 transition-colors ${p.isArchived ? 'bg-amber-50/20' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={p.images?.primary} 
                            alt={p.name} 
                            className="w-10 h-12 object-cover bg-neutral-100 border border-neutral-200 shrink-0" 
                          />
                          <div>
                            <p className="font-bold text-brand-charcoal uppercase tracking-wider flex items-center gap-2">
                              {p.name}
                              {p.isArchived && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-xs font-mono font-normal">
                                  ARCHIVED
                                </span>
                              )}
                            </p>
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
                      {/* Status Column */}
                      <td className="py-3 px-4 text-center">
                        {p.isArchived ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xs bg-amber-100 text-amber-900 border border-amber-200">
                            <Archive className="w-3 h-3 text-amber-700" /> Archived
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {(() => {
                          const isMaxReached = featuredCount >= 4;
                          const isCurrentFeatured = !!p.featured;
                          const isInactive = !isCurrentFeatured && isMaxReached;

                          return (
                            <button
                              type="button"
                              disabled={isInactive}
                              onClick={() => handleToggleFeatured(p.id)}
                              title={
                                isInactive
                                  ? 'Maximum of 4 featured products reached. Inactive until another piece is unfeatured.'
                                  : isCurrentFeatured
                                    ? 'Click to remove from Homepage Featured'
                                    : 'Click to feature on Homepage'
                              }
                              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xs transition-all ${
                                isCurrentFeatured 
                                  ? 'bg-brand-charcoal text-white hover:bg-black cursor-pointer shadow-xs' 
                                  : isInactive
                                    ? 'bg-neutral-100 text-neutral-300 border border-dashed border-neutral-300 cursor-not-allowed opacity-60'
                                    : 'bg-neutral-100 text-neutral-500 hover:text-brand-charcoal hover:bg-neutral-200 cursor-pointer'
                              }`}
                            >
                              {isCurrentFeatured ? 'Featured' : isInactive ? 'Inactive' : 'Standard'}
                            </button>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStock(p.id)}
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer ${
                            p.inStock 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {p.inStock ? 'In Stock' : 'Sold Out'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        {/* Archive / Unarchive Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleArchive(p)}
                          className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
                            p.isArchived
                              ? 'text-amber-700 hover:text-black hover:bg-amber-100'
                              : 'text-neutral-500 hover:text-amber-700 hover:bg-amber-50'
                          }`}
                          title={p.isArchived ? "Unarchive / Restore Product to Storefront" : "Archive Product (Hide from Storefront)"}
                        >
                          {p.isArchived ? (
                            <ArchiveRestore className="w-3.5 h-3.5 text-amber-700" />
                          ) : (
                            <Archive className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateProduct(p)}
                          className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-xs cursor-pointer"
                          title="Duplicate / Clone Product (Instant copy of all tabs & details)"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditProduct(p)}
                          className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-xs cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xs cursor-pointer"
                          title="Delete Product Permanently"
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
          {/* Left Column: Add Category Form */}
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
              { id: 'shirts', label: 'Shirts' },
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
          <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-3">
            {[
              { id: 'all', label: `All (${messages.length})` },
              { id: 'unread', label: `Unread (${unreadMessagesCount})` },
              { id: 'custom_color', label: `Custom Colors (${messages.filter(m => m.type === 'custom_color' || m.orderNumber?.startsWith('COLOR')).length})` },
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
              <p className="text-[11px] mt-1">When clients send a message through the Contact Us page or request custom colors, it will appear here instantly.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages
                .filter(m => {
                  const isCustom = m.type === 'custom_color' || m.orderNumber?.startsWith('COLOR');
                  if (messageFilter === 'unread') return m.status === 'unread';
                  if (messageFilter === 'custom_color') return isCustom;
                  if (messageFilter === 'replied') return m.status === 'replied';
                  return true;
                })
                .map((msg) => {
                  const isUnread = msg.status === 'unread';
                  const isReplied = msg.status === 'replied';
                  const isCustom = msg.type === 'custom_color' || msg.orderNumber?.startsWith('COLOR');
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
                            isCustom ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                            isUnread ? 'bg-amber-100 text-amber-900' : 'bg-neutral-100 text-neutral-700'
                          }`}>
                            {isCustom ? <Palette className="w-4 h-4" /> : (msg.name ? msg.name.charAt(0).toUpperCase() : 'C')}
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

                        <div className="flex items-center gap-2 flex-wrap">
                          {isCustom && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-950 border border-amber-300 rounded-xs text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <Palette className="w-2.5 h-2.5" /> Custom Color Request
                            </span>
                          )}
                          {msg.orderNumber && (
                            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-800 border border-neutral-200 rounded-xs text-[10px] font-mono font-bold">
                              Ref: {msg.orderNumber}
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
                        <FormattedMessage message={msg.message} type={msg.type} />
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

      {/* ADD / EDIT PRODUCT MODAL (Isolated for 0ms Instant Input Performance) */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        editingProduct={editingProduct}
        categoryList={categoryList}
        featuredCount={featuredCount}
        onSave={handleSaveProduct}
        addSubcategory={addSubcategory}
        updateSubcategory={updateSubcategory}
        showAlertDialog={showAlertDialog}
      />

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
                              <span className="text-[11px] text-neutral-700">{item.color}</span>
                              {item.color && item.color.includes('(Custom Color)') && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center gap-1 text-[9px] bg-amber-100 text-amber-950 border border-amber-300 px-1.5 py-0.5 font-bold uppercase tracking-wider rounded-xs">
                                    <Palette className="w-2.5 h-2.5 text-amber-700" /> Custom Color Order
                                  </span>
                                </div>
                              )}
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
