import { useState, useEffect, useRef } from 'react';
import { Upload, X, CheckCircle2, Cloud, Loader2, Archive, Star, Trash2, Plus } from 'lucide-react';

export default function ProductFormModal({
  isOpen,
  onClose,
  editingProduct,
  categoryList,
  featuredCount,
  onSave,
  addSubcategory,
  updateSubcategory,
  showAlertDialog,
}) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'tops',
    subcategory: '',
    subtype: '',
    price: '',
    description: '',
    material: '',
    fit: '',
    care: '',
    shipping: '',
    featured: false,
    inStock: true,
    isArchived: false,
    colors: ['Black', 'White'],
    availableSizes: ['S', 'M', 'L', 'XL'],
    variants: [],
    imageUrl: '',
    images: [],
  });

  const [isAddingCustomSub, setIsAddingCustomSub] = useState(false);
  const [customSubcategoryInput, setCustomSubcategoryInput] = useState('');
  const [isAddingCustomSubtype, setIsAddingCustomSubtype] = useState(false);
  const [customSubtypeInput, setCustomSubtypeInput] = useState('');
  const [manualUrlInput, setManualUrlInput] = useState('');

  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef(null);

  // Initialize or reset form state whenever modal opens or editingProduct changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingProduct) {
      const primary = editingProduct.images?.primary || (typeof editingProduct.images === 'string' ? editingProduct.images : '');
      const gallery = Array.isArray(editingProduct.images?.gallery) ? editingProduct.images.gallery : [];
      const loadedImages = [primary, ...gallery].filter(Boolean);

      setFormData({
        name: editingProduct.name || '',
        category: editingProduct.category || 'tops',
        subcategory: typeof editingProduct.subcategory === 'string' ? editingProduct.subcategory : editingProduct.subcategory?.name || '',
        subtype: editingProduct.subtype || '',
        price: editingProduct.price !== undefined ? String(editingProduct.price) : '',
        description: editingProduct.description || '',
        material: editingProduct.material || '',
        fit: editingProduct.fit || '',
        care: editingProduct.care || '',
        shipping: editingProduct.shipping || '',
        featured: !!editingProduct.featured,
        inStock: editingProduct.inStock !== false,
        isArchived: !!editingProduct.isArchived,
        colors: Array.isArray(editingProduct.colors) ? editingProduct.colors : ['Black', 'White'],
        availableSizes: Array.isArray(editingProduct.availableSizes) ? editingProduct.availableSizes : ['S', 'M', 'L', 'XL'],
        variants: Array.isArray(editingProduct.variants)
          ? editingProduct.variants.map(v => editingProduct.id ? v : { ...v, id: undefined, sku: undefined })
          : [],
        imageUrl: loadedImages[0] || '',
        images: loadedImages,
      });
    } else {
      const firstCat = categoryList[0];
      const firstSub = firstCat?.subcategories?.[0];
      const firstSubName = typeof firstSub === 'string' ? firstSub : firstSub?.name || '';
      const firstSubtypes = typeof firstSub === 'object' && Array.isArray(firstSub?.subtypes) ? firstSub.subtypes : [];

      setFormData({
        name: '',
        category: firstCat?.id || 'tops',
        subcategory: firstSubName,
        subtype: firstSubtypes[0] || '',
        price: '',
        description: '',
        material: '',
        fit: '',
        care: '',
        shipping: '',
        featured: false,
        inStock: true,
        isArchived: false,
        colors: ['Black', 'White'],
        availableSizes: firstCat?.id === 'care-accessories' ? ['One Size'] : ['S', 'M', 'L', 'XL'],
        variants: [],
        imageUrl: '',
        images: [],
      });
    }

    setManualUrlInput('');
    setIsAddingCustomSub(false);
    setCustomSubcategoryInput('');
    setIsAddingCustomSubtype(false);
    setCustomSubtypeInput('');
    setUploadMessage('');
    setIsUploadingImage(false);
  }, [isOpen, editingProduct, categoryList]);

  if (!isOpen) return null;

  const isCareCategory = 
    formData.category === 'care-accessories' || 
    formData.category === 'care' || 
    formData.category?.toLowerCase().includes('care') || 
    formData.category?.toLowerCase().includes('accessories');

  const handleCategoryChange = (newCatId) => {
    const catObj = categoryList.find(c => c.id === newCatId || c.slug === newCatId);
    const firstSub = catObj?.subcategories?.[0];
    const firstSubName = typeof firstSub === 'string' ? firstSub : firstSub?.name || '';
    const isCare = newCatId === 'care-accessories' || newCatId?.toLowerCase().includes('care') || newCatId?.toLowerCase().includes('accessories');

    setFormData(prev => ({
      ...prev,
      category: newCatId,
      subcategory: firstSubName,
      subtype: '',
      availableSizes: isCare ? ['One Size'] : (prev.availableSizes.includes('One Size') && prev.availableSizes.length === 1 ? ['S', 'M', 'L', 'XL'] : prev.availableSizes),
    }));
    setIsAddingCustomSub(false);
    setCustomSubcategoryInput('');
  };

  // Multi-image upload handling with Cloudflare R2
  const processImageFiles = async (files) => {
    const fileList = Array.from(files || []).filter(f => f && f.type.startsWith('image/'));
    if (!fileList.length) {
      showAlertDialog({
        title: 'Unsupported File Format',
        message: 'Please upload image files (PNG, JPG, or WEBP).',
        type: 'warning',
      });
      return;
    }

    setIsUploadingImage(true);
    setUploadMessage(`Compressing & uploading ${fileList.length > 1 ? fileList.length + ' images' : 'image'} to Cloudflare R2...`);

    try {
      const token = localStorage.getItem('penny_admin_token');
      const uploadedUrls = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (fileList.length > 1) {
          setUploadMessage(`Uploading image ${i + 1} of ${fileList.length} to Cloudflare R2...`);
        }
        const dataPayload = new FormData();
        dataPayload.append('image', file);

        const response = await fetch('/api/admin/media/upload', {
          method: 'POST',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: dataPayload,
        });

        const data = await response.json();
        if (response.ok && data.success && data.url) {
          uploadedUrls.push(data.url);
        } else {
          console.warn('Backend upload returned notice:', data.message);
          showAlertDialog({
            title: 'Cloudflare R2 Notice',
            message: data.message || 'Could not upload to Cloudflare R2. Please check your R2 environment variables in server/.env.',
            type: 'warning',
          });
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData(prev => {
          const current = Array.isArray(prev.images) ? [...prev.images] : (prev.imageUrl ? [prev.imageUrl] : []);
          const merged = [...current, ...uploadedUrls];
          return {
            ...prev,
            images: merged,
            imageUrl: merged[0] || '',
          };
        });
        setUploadMessage(`${uploadedUrls.length} image(s) uploaded to Cloudflare R2 successfully.`);
      }
    } catch (err) {
      console.warn('Could not connect to media upload endpoint:', err);
      setUploadMessage('Could not connect to media upload service.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Remove an individual image from the product
  const handleRemoveImage = (indexToRemove) => {
    setFormData(prev => {
      const current = Array.isArray(prev.images) ? [...prev.images] : (prev.imageUrl ? [prev.imageUrl] : []);
      const updated = current.filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        images: updated,
        imageUrl: updated[0] || '',
      };
    });
  };

  // Set any image as the primary cover (moves it to index 0)
  const handleSetAsCover = (indexToCover) => {
    setFormData(prev => {
      const current = Array.isArray(prev.images) ? [...prev.images] : (prev.imageUrl ? [prev.imageUrl] : []);
      if (indexToCover <= 0 || indexToCover >= current.length) return prev;
      const target = current[indexToCover];
      const remaining = current.filter((_, idx) => idx !== indexToCover);
      const updated = [target, ...remaining];
      return {
        ...prev,
        images: updated,
        imageUrl: updated[0] || '',
      };
    });
  };

  // Add manual URL or public path
  const handleAddManualUrl = () => {
    const url = manualUrlInput.trim();
    if (!url) return;
    setFormData(prev => {
      const current = Array.isArray(prev.images) ? [...prev.images] : (prev.imageUrl ? [prev.imageUrl] : []);
      const updated = [...current, url];
      return {
        ...prev,
        images: updated,
        imageUrl: updated[0] || '',
      };
    });
    setManualUrlInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.price) {
      showAlertDialog({
        title: 'Missing Details',
        message: 'Please provide both the piece name and retail price before saving.',
        type: 'warning',
      });
      return;
    }

    const finalSubcategory = isAddingCustomSub && customSubcategoryInput.trim()
      ? customSubcategoryInput.trim()
      : (formData.subcategory || '');

    const finalSubtype = isAddingCustomSubtype && customSubtypeInput.trim()
      ? customSubtypeInput.trim()
      : (formData.subtype || '');

    const resolvedSizes = (Array.isArray(formData.availableSizes) && formData.availableSizes.length > 0)
      ? formData.availableSizes
      : ['S', 'M', 'L', 'XL'];
    const resolvedColors = (Array.isArray(formData.colors) && formData.colors.length > 0)
      ? formData.colors
      : ['Standard'];

    const variants = resolvedSizes.flatMap(size =>
      resolvedColors.map(color => {
        const existing = (formData.variants || []).find(
          variant => variant.size === size && (variant.colorName || variant.color) === color
        );
        const defaultQty = formData.inStock !== false ? 10 : 0;
        return {
          ...(existing?.id ? { id: existing.id } : {}),
          size,
          colorName: color,
          colorHex: existing?.colorHex || null,
          stockQuantity: formData.inStock === false
            ? 0
            : Math.max(0, Number(existing?.stockQuantity ?? defaultQty)),
          sku: existing?.sku || null,
        };
      })
    );

    if (isAddingCustomSub && customSubcategoryInput.trim()) {
      const cleanSub = customSubcategoryInput.trim();
      const initialStyles = isAddingCustomSubtype && customSubtypeInput.trim() ? [customSubtypeInput.trim()] : [];
      addSubcategory(formData.category, cleanSub, initialStyles);
    } else if (isAddingCustomSubtype && customSubtypeInput.trim()) {
      const newStyle = customSubtypeInput.trim();
      const catObj = categoryList.find(c => c.id === formData.category || c.slug === formData.category);
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

    const finalImages = Array.isArray(formData.images) && formData.images.length > 0
      ? formData.images
      : (formData.imageUrl ? [formData.imageUrl] : []);

    onSave({
      ...formData,
      availableSizes: resolvedSizes,
      colors: resolvedColors,
      imageUrl: finalImages[0] || '/images/products/linen-set-1.jpg',
      images: {
        primary: finalImages[0] || '/images/products/linen-set-1.jpg',
        gallery: finalImages.slice(1),
      },
      subcategory: finalSubcategory,
      subtype: finalSubtype,
      variants,
    });
  };

  const isFormFeaturedDisabled = !formData.featured && featuredCount >= 4 && (!editingProduct || !editingProduct.featured);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-neutral-200 shadow-2xl p-6 md:p-8">
        <div className="flex justify-between items-center border-b border-neutral-200 pb-4 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-brand-charcoal">
            {editingProduct?.id ? 'Edit Product Details' : 'Add New Product to Catalogue'}
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="text-xs uppercase font-bold text-neutral-400 hover:text-black cursor-pointer"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
              Product Title *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
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
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="e.g. 25000"
                className="w-full border border-neutral-200 p-2.5 focus:outline-none focus:border-brand-charcoal"
                required
              />
            </div>
          </div>

          {/* Subcategory & Subtype */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                Subcategory *
              </label>
              {!isAddingCustomSub ? (
                <div className="flex gap-2">
                  <select
                    value={formData.subcategory}
                    onChange={(e) => {
                      if (e.target.value === '__NEW_SUB__') {
                        setIsAddingCustomSub(true);
                        setCustomSubcategoryInput('');
                      } else {
                        const newSub = e.target.value;
                        const catObj = categoryList.find(c => c.id === formData.category || c.slug === formData.category);
                        const subObj = (catObj?.subcategories || []).find(s => (typeof s === 'string' ? s : s?.name) === newSub);
                        const availableSubtypes = typeof subObj === 'object' && Array.isArray(subObj?.subtypes) ? subObj.subtypes : [];

                        setFormData(prev => ({ 
                          ...prev, 
                          subcategory: newSub,
                          subtype: availableSubtypes[0] || ''
                        }));
                      }
                    }}
                    className="w-full border border-neutral-200 p-2.5 focus:outline-none focus:border-brand-charcoal bg-white text-xs"
                  >
                    <option value="">(None / General)</option>
                    {categoryList
                      .find(c => c.id === formData.category || c.slug === formData.category)
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
                    className="px-3 py-2 border border-neutral-300 text-neutral-600 text-xs uppercase font-bold hover:bg-neutral-100 cursor-pointer"
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
                const catObj = categoryList.find(c => c.id === formData.category || c.slug === formData.category);
                const subObj = (catObj?.subcategories || []).find(s => (typeof s === 'string' ? s : s?.name) === formData.subcategory);
                const availableSubtypes = typeof subObj === 'object' && Array.isArray(subObj?.subtypes) ? subObj.subtypes : [];

                if (isAddingCustomSubtype || (availableSubtypes.length === 0 && !formData.subtype)) {
                  return (
                    <div className="space-y-1">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={isAddingCustomSubtype ? customSubtypeInput : formData.subtype}
                          onChange={(e) => {
                            if (isAddingCustomSubtype) {
                              setCustomSubtypeInput(e.target.value);
                              setFormData(prev => ({ ...prev, subtype: e.target.value }));
                            } else {
                              setFormData(prev => ({ ...prev, subtype: e.target.value }));
                            }
                          }}
                          placeholder="Type style (e.g. Boxy, Relaxed)..."
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
                    </div>
                  );
                }

                return (
                  <div className="space-y-1">
                    <select
                      value={formData.subtype}
                      onChange={(e) => {
                        if (e.target.value === '__NEW_STYLE__') {
                          setIsAddingCustomSubtype(true);
                          setCustomSubtypeInput('');
                          setFormData(prev => ({ ...prev, subtype: '' }));
                        } else {
                          setFormData(prev => ({ ...prev, subtype: e.target.value }));
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

          {/* SIZES & COLORS CONFIGURATION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sizes Picker */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
                Available Sizes ({formData.availableSizes?.length || 0} selected)
              </label>

              {isCareCategory ? (
                <div className="bg-amber-50/60 p-3 border border-amber-200/80 rounded-xs space-y-1">
                  <span className="inline-block px-2.5 py-1 bg-brand-charcoal text-white text-[11px] font-bold uppercase tracking-wider rounded-xs">
                    One Size (Standard)
                  </span>
                  <p className="text-[10px] text-amber-900/80 mt-1">
                    Care & Accessories items are One Size and do not require clothing sizing or size guides.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 bg-neutral-50/70 p-3 border border-neutral-200 rounded-xs">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Standard Sizes</span>
                    <div className="flex flex-wrap gap-1">
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(sz => {
                        const isSelected = formData.availableSizes?.includes(sz);
                        return (
                          <button
                            type="button"
                            key={sz}
                            onClick={() => {
                              const curr = formData.availableSizes || [];
                              const updated = isSelected ? curr.filter(s => s !== sz) : [...curr, sz];
                              setFormData(prev => ({ ...prev, availableSizes: updated }));
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
                        const isSelected = formData.availableSizes?.includes(sz);
                        return (
                          <button
                            type="button"
                            key={sz}
                            onClick={() => {
                              const curr = formData.availableSizes || [];
                              const updated = isSelected ? curr.filter(s => s !== sz) : [...curr, sz];
                              setFormData(prev => ({ ...prev, availableSizes: updated }));
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
              )}
            </div>

            {/* Colors Picker */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
                Available Colors ({formData.colors?.length || 0} selected)
              </label>
              <div className="space-y-2 bg-neutral-50/70 p-3 border border-neutral-200 rounded-xs">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Core Neutrals</span>
                  <div className="flex flex-wrap gap-1">
                    {['Black', 'White', 'Cream', 'Beige', 'Ash/Grey', 'Charcoal', 'Taupe', 'Sand'].map(c => {
                      const isSelected = formData.colors?.includes(c);
                      return (
                        <button
                          type="button"
                          key={c}
                          onClick={() => {
                            const curr = formData.colors || [];
                            const updated = isSelected ? curr.filter(col => col !== c) : [...curr, c];
                            setFormData(prev => ({ ...prev, colors: updated }));
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
                      const isSelected = formData.colors?.includes(c);
                      return (
                        <button
                          type="button"
                          key={c}
                          onClick={() => {
                            const curr = formData.colors || [];
                            const updated = isSelected ? curr.filter(col => col !== c) : [...curr, c];
                            setFormData(prev => ({ ...prev, colors: updated }));
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
                      const isSelected = formData.colors?.includes(c);
                      return (
                        <button
                          type="button"
                          key={c}
                          onClick={() => {
                            const curr = formData.colors || [];
                            const updated = isSelected ? curr.filter(col => col !== c) : [...curr, c];
                            setFormData(prev => ({ ...prev, colors: updated }));
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

          {/* Interactive Multi-Image Manager (Cloudflare R2) */}
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-charcoal">
                Product Imagery ({(formData.images?.length || 0)} {(formData.images?.length === 1 ? 'Image' : 'Images')})
              </label>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                Decide whether this piece has 1, 2, or more images. The Cover image is displayed on cards; secondary images appear in the product details gallery. Click the trash icon to delete any image you don't want.
              </p>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              multiple
              onChange={(e) => {
                const files = e.target.files;
                if (files?.length) processImageFiles(files);
                e.target.value = '';
              }} 
              accept="image/png, image/jpeg, image/webp" 
              className="hidden" 
            />

            {/* Dropzone Area */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const files = e.dataTransfer.files;
                if (files?.length) processImageFiles(files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed p-4 text-center cursor-pointer transition-colors rounded-xs ${
                isDragging 
                  ? 'border-brand-charcoal bg-neutral-100' 
                  : 'border-neutral-200 hover:border-neutral-400 bg-neutral-50/50'
              }`}
            >
              <Upload className="w-5 h-5 mx-auto text-neutral-400 mb-1.5" />
              <p className="text-xs font-bold text-brand-charcoal">
                Click to browse or drag & drop images here (Select one or multiple)
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                Automatically compressed with sharp and uploaded to Cloudflare R2.
              </p>
            </div>

            {/* Upload in Progress Indicator */}
            {isUploadingImage && (
              <div className="p-3 bg-neutral-100 border border-neutral-300 flex items-center gap-3 animate-pulse rounded-xs">
                <Loader2 className="w-4 h-4 animate-spin text-brand-charcoal shrink-0" />
                <div className="text-left text-xs">
                  <p className="font-bold text-brand-charcoal">Uploading to Cloudflare R2...</p>
                  <p className="text-[10px] text-neutral-500">{uploadMessage || 'Compressing with sharp and saving to Cloudflare R2...'}</p>
                </div>
              </div>
            )}

            {/* Image Cards List: Shows each image with Delete and Make Cover buttons */}
            {(formData.images && formData.images.length > 0) && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                  Current Assigned Images ({formData.images.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {formData.images.map((imgUrl, idx) => {
                    const isCover = idx === 0;
                    const isR2 = imgUrl.includes('r2.dev') || imgUrl.includes('r2.cloudflarestorage.com');
                    return (
                      <div 
                        key={idx}
                        className={`p-2.5 bg-neutral-50 border rounded-xs flex items-center justify-between gap-3 transition-colors ${
                          isCover ? 'border-brand-charcoal bg-neutral-100/60 shadow-xs' : 'border-neutral-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img 
                            src={imgUrl} 
                            alt={`Product image ${idx + 1}`} 
                            className="w-12 h-14 object-cover bg-white border border-neutral-200 rounded-xs shrink-0"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/images/products/linen-set-1.jpg';
                            }}
                          />
                          <div className="min-w-0 text-left">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isCover ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-brand-charcoal text-white text-[9px] font-bold uppercase tracking-wider rounded-xs">
                                  <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" /> Cover Image
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-neutral-200 text-neutral-700 text-[9px] font-bold uppercase tracking-wider rounded-xs">
                                  Gallery #{idx + 1}
                                </span>
                              )}
                              {isR2 && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 text-[8px] font-bold uppercase rounded-xs">
                                  <Cloud className="w-2 h-2" /> R2
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-neutral-600 font-mono truncate max-w-[170px] mt-1" title={imgUrl}>
                              {imgUrl.startsWith('data:') ? 'Local preview' : imgUrl}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isCover && (
                            <button
                              type="button"
                              onClick={() => handleSetAsCover(idx)}
                              title="Set as the main cover photo for cards"
                              className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-white border border-neutral-200 hover:border-brand-charcoal text-neutral-700 hover:text-black rounded-xs transition-colors cursor-pointer"
                            >
                              Make Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            title="Delete this image"
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xs transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Manual Path or URL Input */}
            <div className="pt-1">
              <span className="text-[10px] text-neutral-400 uppercase font-medium block mb-1">
                Or add image by URL / public path:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualUrlInput}
                  onChange={(e) => setManualUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddManualUrl();
                    }
                  }}
                  placeholder="e.g. /images/products/linen-set-1.jpg or https://..."
                  className="w-full border border-neutral-200 p-2 focus:outline-none focus:border-brand-charcoal text-[11px]"
                />
                <button
                  type="button"
                  onClick={handleAddManualUrl}
                  disabled={!manualUrlInput.trim()}
                  className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 text-brand-charcoal text-xs font-bold uppercase tracking-wider rounded-xs shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Description & Technical Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                Description
              </label>
              <textarea
                rows="2"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Editorial garment summary..."
                className="w-full border border-neutral-200 p-2 focus:outline-none focus:border-brand-charcoal text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                Material & Composition
              </label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
                placeholder="e.g. 100% French Linen"
                className="w-full border border-neutral-200 p-2 focus:outline-none focus:border-brand-charcoal text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                Silhouette / Fit
              </label>
              <input
                type="text"
                value={formData.fit}
                onChange={(e) => setFormData(prev => ({ ...prev, fit: e.target.value }))}
                placeholder="e.g. Relaxed, Boxy"
                className="w-full border border-neutral-200 p-2 focus:outline-none focus:border-brand-charcoal text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                Care Instructions
              </label>
              <input
                type="text"
                value={formData.care}
                onChange={(e) => setFormData(prev => ({ ...prev, care: e.target.value }))}
                placeholder="e.g. Machine wash cold"
                className="w-full border border-neutral-200 p-2 focus:outline-none focus:border-brand-charcoal text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                Delivery Note
              </label>
              <input
                type="text"
                value={formData.shipping}
                onChange={(e) => setFormData(prev => ({ ...prev, shipping: e.target.value }))}
                placeholder="e.g. Ships in 1-3 days"
                className="w-full border border-neutral-200 p-2 focus:outline-none focus:border-brand-charcoal text-xs"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-2 space-y-3 border-t border-neutral-100">
            <div className="flex flex-wrap gap-6">
              <label 
                className={`flex items-center gap-2 ${isFormFeaturedDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                title={isFormFeaturedDisabled ? 'Maximum of 4 featured products reached. Unfeature another piece first.' : ''}
              >
                <input
                  type="checkbox"
                  disabled={isFormFeaturedDisabled}
                  checked={formData.featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                  className="accent-black"
                />
                <span className="font-bold uppercase tracking-wider text-[11px] text-brand-charcoal">
                  Feature in Homepage Essentials {isFormFeaturedDisabled ? '(Limit 4 Reached)' : ''}
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.inStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, inStock: e.target.checked }))}
                  className="accent-black"
                />
                <span className="font-bold uppercase tracking-wider text-[11px] text-brand-charcoal">
                  Mark As In Stock
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!formData.isArchived}
                  onChange={(e) => setFormData(prev => ({ ...prev, isArchived: e.target.checked }))}
                  className="accent-amber-600"
                />
                <span className="font-bold uppercase tracking-wider text-[11px] text-amber-900 flex items-center gap-1.5">
                  <Archive className="w-3.5 h-3.5 text-amber-700" />
                  Archive Product (Hide from storefront)
                </span>
              </label>
            </div>

            {formData.isArchived && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xs flex items-center gap-2">
                <Archive className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  This product is marked as <strong>Archived</strong>. It will be hidden from the live website and customer search, but will stay safely preserved here in admin for easy one-click retrieval anytime.
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploadingImage}
              className="px-5 py-2.5 border border-neutral-200 text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploadingImage}
              className={`px-6 py-2.5 bg-brand-charcoal text-white text-xs font-bold uppercase tracking-wider hover:bg-black cursor-pointer flex items-center gap-2 ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploadingImage ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading Image...
                </>
              ) : (
                'Save Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

