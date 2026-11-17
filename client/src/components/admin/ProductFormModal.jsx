import { useState, useEffect, useRef } from 'react';
import { Upload, X, CheckCircle2, Cloud, Loader2, Archive } from 'lucide-react';

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
    imageUrl: '',
  });

  const [isAddingCustomSub, setIsAddingCustomSub] = useState(false);
  const [customSubcategoryInput, setCustomSubcategoryInput] = useState('');
  const [isAddingCustomSubtype, setIsAddingCustomSubtype] = useState(false);
  const [customSubtypeInput, setCustomSubtypeInput] = useState('');

  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef(null);

  // Initialize or reset form state whenever modal opens or editingProduct changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingProduct) {
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
        imageUrl: editingProduct.images?.primary || (typeof editingProduct.images === 'string' ? editingProduct.images : ''),
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
        imageUrl: '',
      });
    }

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

  // Image upload handling with Cloudflare R2
  const processImageFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showAlertDialog({
        title: 'Unsupported File Format',
        message: 'Please upload an image file (PNG, JPG, or WEBP).',
        type: 'warning',
      });
      return;
    }

    // Instant local preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({ ...prev, imageUrl: e.target.result }));
    };
    reader.readAsDataURL(file);

    setIsUploadingImage(true);
    setUploadMessage('Compressing and uploading to Cloudflare R2...');

    try {
      const token = localStorage.getItem('penny_admin_token');
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
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
        setUploadMessage(data.message || 'Image uploaded to Cloudflare R2 successfully.');
      } else {
        console.warn('Backend upload returned notice:', data.message);
        setUploadMessage(data.message || 'Cloudflare R2 upload pending. Please check R2 keys in .env.');
        showAlertDialog({
          title: 'Cloudflare R2 Storage',
          message: data.message || 'Could not upload to Cloudflare R2. Please check your R2 environment variables in server/.env.',
          type: 'warning',
        });
      }
    } catch (err) {
      console.warn('Could not connect to media upload endpoint:', err);
      setUploadMessage('Could not connect to media upload service.');
    } finally {
      setIsUploadingImage(false);
    }
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

    onSave({
      ...formData,
      subcategory: finalSubcategory,
      subtype: finalSubtype,
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

          {/* Interactive Image Dropzone & Preview (Cloudflare R2) */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
              Product Imagery (Cloudflare R2 Upload & Compression)
            </label>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processImageFile(file);
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
                const file = e.dataTransfer.files?.[0];
                if (file) processImageFile(file);
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
                Click to browse or drag and drop image file here
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                Automatically compressed with sharp and uploaded to Cloudflare R2.
              </p>
            </div>

            {/* Upload in Progress Indicator */}
            {isUploadingImage && (
              <div className="mt-3 p-3 bg-neutral-100 border border-neutral-300 flex items-center gap-3 animate-pulse rounded-xs">
                <Loader2 className="w-4 h-4 animate-spin text-brand-charcoal shrink-0" />
                <div className="text-left text-xs">
                  <p className="font-bold text-brand-charcoal">Uploading to Cloudflare R2...</p>
                  <p className="text-[10px] text-neutral-500">{uploadMessage || 'Compressing with sharp and saving to Cloudflare R2...'}</p>
                </div>
              </div>
            )}

            {/* Thumbnail Preview Card */}
            {formData.imageUrl && !isUploadingImage && (
              <div className="mt-3 p-3 bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-4 rounded-xs">
                <div className="flex items-center gap-3">
                  <img 
                    src={formData.imageUrl} 
                    alt="Preview" 
                    className="w-14 h-16 object-cover bg-white border border-neutral-200 rounded-xs shrink-0" 
                  />
                  <div className="text-left overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" /> Image Ready
                      </span>
                      {(formData.imageUrl.includes('r2.dev') || formData.imageUrl.includes('r2.cloudflarestorage.com')) && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 text-[9px] font-bold uppercase rounded-xs">
                          <Cloud className="w-2.5 h-2.5" /> Cloudflare R2
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-600 font-mono truncate max-w-xs mt-0.5" title={formData.imageUrl}>
                      {formData.imageUrl.startsWith('data:') ? 'Local High-Res Image Preview' : formData.imageUrl}
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
                    setFormData(prev => ({ ...prev, imageUrl: '' }));
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
                value={formData.imageUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="e.g. /images/products/linen-set-1.jpg"
                className="w-full mt-1 border border-neutral-200 p-2 focus:outline-none focus:border-brand-charcoal text-[11px]"
              />
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
              className="px-5 py-2.5 border border-neutral-200 text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-brand-charcoal text-white text-xs font-bold uppercase tracking-wider hover:bg-black cursor-pointer"
            >
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

