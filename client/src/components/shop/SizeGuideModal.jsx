import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler } from 'lucide-react';
import { useProducts } from '../../context/ProductContext';

export default function SizeGuideModal({ isOpen, onClose, initialCategory = 'shirts' }) {
  const { sizeGuideData = {} } = useProducts();
  const availableCategories = ['shirts', 'shorts', 'trousers'].filter(k => !!sizeGuideData[k]);
  
  let resolvedCategory = 'shirts';
  const lowerInitial = (initialCategory || '').toLowerCase();
  if (lowerInitial.includes('short')) {
    resolvedCategory = 'shorts';
  } else if (lowerInitial.includes('trouser') || lowerInitial.includes('pant') || lowerInitial.includes('bottom') || lowerInitial.includes('denim')) {
    resolvedCategory = 'trousers';
  } else if (availableCategories.includes(lowerInitial)) {
    resolvedCategory = lowerInitial;
  }

  const defaultCategory = availableCategories.includes(resolvedCategory)
    ? resolvedCategory
    : availableCategories[0] || 'shirts';

  const [activeTab, setActiveTab] = useState(defaultCategory);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultCategory);
    }
  }, [isOpen, defaultCategory]);

  if (!isOpen) return null;

  const currentCategoryData = sizeGuideData[activeTab] || sizeGuideData.shirts || {
    title: "Size & Fit Guide",
    subtitle: "Standard measurements",
    columns: [{ key: 'size', label: 'Size' }],
    rows: []
  };

  const columns = currentCategoryData.columns || [
    { key: 'size', label: 'Size' },
    { key: 'chest', label: 'Chest (CM)' },
    { key: 'waist', label: 'Waist (CM)' }
  ];

  const tableRows = currentCategoryData.rows || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="size-guide-title"
          className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 text-brand-charcoal"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close size guide"
            className="absolute top-4 right-4 p-2 text-brand-charcoal/60 hover:text-brand-charcoal transition-colors rounded-full hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="mb-6 pr-8">
            <div className="flex items-center gap-2 mb-1 text-brand-taupe">
              <Ruler className="w-4 h-4" />
              <span className="text-[11px] font-bold tracking-[0.15em] uppercase">Measurement Chart</span>
            </div>
            <h2 id="size-guide-title" className="text-2xl md:text-3xl font-serif font-light text-brand-charcoal">
              {currentCategoryData.title || "Size & Fit Guide"}
            </h2>
            <p className="text-xs text-brand-charcoal/60 mt-1 font-serif">
              {currentCategoryData.subtitle || "Designed for a tailored, comfortable drape. Follow our body measurements below to find your ideal fit."}
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-brand-charcoal/10 pb-4 mb-6">
            {availableCategories.map(catKey => {
              const catData = sizeGuideData[catKey];
              const label = catData?.title || catKey.charAt(0).toUpperCase() + catKey.slice(1);
              return (
                <button
                  key={catKey}
                  onClick={() => setActiveTab(catKey)}
                  className={`text-xs uppercase font-bold tracking-wider py-1.5 px-3.5 transition-colors ${
                    activeTab === catKey
                      ? 'bg-brand-charcoal text-white shadow-xs'
                      : 'bg-neutral-100 text-brand-charcoal/70 hover:text-brand-charcoal hover:bg-neutral-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Sizing Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-charcoal/20 uppercase tracking-[0.1em] text-brand-charcoal/60">
                  {columns.map((col) => (
                    <th key={col.key} className="py-2.5 px-3 font-bold">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-charcoal/10 font-serif">
                {tableRows.map((row, idx) => (
                  <tr key={row.size || idx} className="hover:bg-neutral-50/70 transition-colors">
                    {columns.map((col) => (
                      <td 
                        key={col.key} 
                        className={`py-3 px-3 ${col.key === 'size' ? 'font-sans font-bold text-brand-charcoal' : ''}`}
                      >
                        {row[col.key] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* How to Measure & Fitting Advice */}
          <div className="bg-brand-offwhite p-4 border border-brand-charcoal/10 space-y-2 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-brand-charcoal">How to Measure</h4>
            <ul className="text-brand-charcoal/70 space-y-1 font-serif leading-relaxed list-disc list-inside">
              <li><strong className="font-sans font-medium text-brand-charcoal">Chest:</strong> Measure around the fullest part of your chest, keeping the tape horizontal.</li>
              <li><strong className="font-sans font-medium text-brand-charcoal">Waist:</strong> Measure around your natural waistline, where your trousers typically sit.</li>
              <li><strong className="font-sans font-medium text-brand-charcoal">Between sizes?</strong> If you prefer a relaxed, oversized silhouette, size up. For a tailored, closer fit, choose your standard size.</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

