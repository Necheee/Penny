import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler } from 'lucide-react';

const sizeData = {
  tops: {
    title: "Tops & Shirts",
    subtitle: "T-Shirts, Overshirts, Henleys & Sweaters",
    cm: [
      { size: "XS", chest: "86 - 91", waist: "71 - 76", shoulder: "42" },
      { size: "S", chest: "91 - 96", waist: "76 - 81", shoulder: "44" },
      { size: "M", chest: "96 - 101", waist: "81 - 86", shoulder: "46" },
      { size: "L", chest: "101 - 106", waist: "86 - 91", shoulder: "48" },
      { size: "XL", chest: "106 - 111", waist: "91 - 96", shoulder: "50" },
      { size: "XXL", chest: "111 - 116", waist: "96 - 101", shoulder: "52" },
    ],
    in: [
      { size: "XS", chest: "34 - 36", waist: "28 - 30", shoulder: "16.5" },
      { size: "S", chest: "36 - 38", waist: "30 - 32", shoulder: "17.2" },
      { size: "M", chest: "38 - 40", waist: "32 - 34", shoulder: "18.0" },
      { size: "L", chest: "40 - 42", waist: "34 - 36", shoulder: "18.8" },
      { size: "XL", chest: "42 - 44", waist: "36 - 38", shoulder: "19.5" },
      { size: "XXL", chest: "44 - 46", waist: "38 - 40", shoulder: "20.5" },
    ]
  },
  bottoms: {
    title: "Trousers & Shorts",
    subtitle: "Chinos, Trousers, Cargo & Shorts",
    cm: [
      { size: "XS", waist: "71 - 76", hips: "88 - 93", inseam: "78" },
      { size: "S", waist: "76 - 81", hips: "93 - 98", inseam: "80" },
      { size: "M", waist: "81 - 86", hips: "98 - 103", inseam: "81" },
      { size: "L", waist: "86 - 91", hips: "103 - 108", inseam: "82" },
      { size: "XL", waist: "91 - 96", hips: "108 - 113", inseam: "83" },
      { size: "XXL", waist: "96 - 101", hips: "113 - 118", inseam: "84" },
    ],
    in: [
      { size: "XS", waist: "28 - 30", hips: "35 - 37", inseam: "30.5" },
      { size: "S", waist: "30 - 32", hips: "37 - 39", inseam: "31.5" },
      { size: "M", waist: "32 - 34", hips: "39 - 41", inseam: "32.0" },
      { size: "L", waist: "34 - 36", hips: "41 - 43", inseam: "32.5" },
      { size: "XL", waist: "36 - 38", hips: "43 - 45", inseam: "33.0" },
      { size: "XXL", waist: "38 - 40", hips: "45 - 47", inseam: "33.5" },
    ]
  },
  sets: {
    title: "Two-Piece Sets",
    subtitle: "Linen & Cotton Co-ord Sets",
    cm: [
      { size: "XS", chest: "86 - 91", waist: "71 - 76", hips: "88 - 93" },
      { size: "S", chest: "91 - 96", waist: "76 - 81", hips: "93 - 98" },
      { size: "M", chest: "96 - 101", waist: "81 - 86", hips: "98 - 103" },
      { size: "L", chest: "101 - 106", waist: "86 - 91", hips: "103 - 108" },
      { size: "XL", chest: "106 - 111", waist: "91 - 96", hips: "108 - 113" },
      { size: "XXL", chest: "111 - 116", waist: "96 - 101", hips: "113 - 118" },
    ],
    in: [
      { size: "XS", chest: "34 - 36", waist: "28 - 30", hips: "35 - 37" },
      { size: "S", chest: "36 - 38", waist: "30 - 32", hips: "37 - 39" },
      { size: "M", chest: "38 - 40", waist: "32 - 34", hips: "39 - 41" },
      { size: "L", chest: "40 - 42", waist: "34 - 36", hips: "41 - 43" },
      { size: "XL", chest: "42 - 44", waist: "36 - 38", hips: "43 - 45" },
      { size: "XXL", chest: "44 - 46", waist: "38 - 40", hips: "45 - 47" },
    ]
  }
};

export default function SizeGuideModal({ isOpen, onClose, initialCategory = 'tops' }) {
  const [activeTab, setActiveTab] = useState(
    ['tops', 'bottoms', 'sets'].includes(initialCategory) ? initialCategory : 'tops'
  );
  const [unit, setUnit] = useState('cm'); // 'cm' or 'in'

  if (!isOpen) return null;

  const currentCategoryData = sizeData[activeTab] || sizeData.tops;
  const tableRows = currentCategoryData[unit];

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
              Size & Fit Guide
            </h2>
            <p className="text-xs text-brand-charcoal/60 mt-1 font-serif">
              Designed for a tailored, comfortable drape. Follow our body measurements below to find your ideal fit.
            </p>
          </div>

          {/* Controls: Category Selector & Unit Switcher */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-charcoal/10 pb-4 mb-6">
            {/* Category tabs */}
            <div className="flex gap-2">
              {[
                { id: 'tops', label: 'Tops' },
                { id: 'bottoms', label: 'Bottoms' },
                { id: 'sets', label: 'Sets' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`text-xs uppercase font-bold tracking-wider py-1.5 px-3 transition-colors ${
                    activeTab === cat.id
                      ? 'bg-brand-charcoal text-white'
                      : 'bg-neutral-100 text-brand-charcoal/70 hover:text-brand-charcoal'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Unit toggle (cm / in) */}
            <div className="flex items-center gap-1 bg-neutral-100 p-0.5 self-end sm:self-auto">
              <button
                onClick={() => setUnit('cm')}
                className={`text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 transition-all ${
                  unit === 'cm'
                    ? 'bg-white shadow-xs text-brand-charcoal'
                    : 'text-brand-charcoal/50 hover:text-brand-charcoal'
                }`}
              >
                CM
              </button>
              <button
                onClick={() => setUnit('in')}
                className={`text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 transition-all ${
                  unit === 'in'
                    ? 'bg-white shadow-xs text-brand-charcoal'
                    : 'text-brand-charcoal/50 hover:text-brand-charcoal'
                }`}
              >
                IN
              </button>
            </div>
          </div>

          {/* Sizing Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-charcoal/20 uppercase tracking-[0.1em] text-brand-charcoal/60">
                  <th className="py-2.5 font-bold">Size</th>
                  {activeTab === 'tops' && (
                    <>
                      <th className="py-2.5 font-bold">Chest ({unit})</th>
                      <th className="py-2.5 font-bold">Waist ({unit})</th>
                      <th className="py-2.5 font-bold">Shoulder ({unit})</th>
                    </>
                  )}
                  {activeTab === 'bottoms' && (
                    <>
                      <th className="py-2.5 font-bold">Waist ({unit})</th>
                      <th className="py-2.5 font-bold">Hips ({unit})</th>
                      <th className="py-2.5 font-bold">Inseam ({unit})</th>
                    </>
                  )}
                  {activeTab === 'sets' && (
                    <>
                      <th className="py-2.5 font-bold">Chest ({unit})</th>
                      <th className="py-2.5 font-bold">Waist ({unit})</th>
                      <th className="py-2.5 font-bold">Hips ({unit})</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-charcoal/10 font-serif">
                {tableRows.map((row) => (
                  <tr key={row.size} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 font-sans font-bold text-brand-charcoal">{row.size}</td>
                    {activeTab === 'tops' && (
                      <>
                        <td className="py-3">{row.chest}</td>
                        <td className="py-3">{row.waist}</td>
                        <td className="py-3">{row.shoulder}</td>
                      </>
                    )}
                    {activeTab === 'bottoms' && (
                      <>
                        <td className="py-3">{row.waist}</td>
                        <td className="py-3">{row.hips}</td>
                        <td className="py-3">{row.inseam}</td>
                      </>
                    )}
                    {activeTab === 'sets' && (
                      <>
                        <td className="py-3">{row.chest}</td>
                        <td className="py-3">{row.waist}</td>
                        <td className="py-3">{row.hips}</td>
                      </>
                    )}
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

