import React from 'react';
import { Palette, CheckCircle2, ShoppingBag } from 'lucide-react';

/**
 * FormattedMessage Component
 * Parses structured markdown tables or key-value custom inquiry data into
 * an elegant, highly readable visual table with distinct styling for custom colors.
 */
export default function FormattedMessage({ message, type, isCompact = false }) {
  if (!message) return null;

  const rawLines = message.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Check for Markdown Table Format (| Col 1 | Col 2 |)
  const tableLines = rawLines.filter(l => l.startsWith('|') && l.endsWith('|'));
  const isMarkdownTable = tableLines.length >= 2;

  if (isMarkdownTable) {
    const parsedRows = tableLines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      return parts.slice(1, parts.length - 1);
    });

    const header = parsedRows[0];
    const bodyRows = parsedRows.slice(1).filter(row => !row.every(cell => /^:?-+:?$/.test(cell)));

    return (
      <div className="overflow-x-auto my-1 border border-neutral-200 rounded-xs bg-white shadow-2xs">
        <table className="min-w-full divide-y divide-neutral-200 text-xs">
          <thead className="bg-[#f6f5f2]">
            <tr>
              {header.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-2 px-3 text-left font-bold uppercase tracking-wider text-brand-charcoal text-[10px] ${
                    idx === 0 ? 'w-2/5 sm:w-1/3' : 'w-3/5 sm:w-2/3'
                  }`}
                >
                  {col.replace(/\*\*/g, '')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 bg-white">
            {bodyRows.map((row, rIdx) => {
              const label = (row[0] || '').replace(/\*\*/g, '');
              const value = (row[1] || '').replace(/\*\*/g, '');
              const isColorRow = label.toLowerCase().includes('color');
              const isProductRow = label.toLowerCase().includes('product');
              const isOrderRow = label.toLowerCase().includes('order');

              return (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-[#FAF9F6]/60'}>
                  <td className="py-2.5 px-3 font-semibold text-brand-charcoal text-[11px] align-top whitespace-nowrap">
                    {label}
                  </td>
                  <td className="py-2.5 px-3 text-neutral-800 text-[12px] align-top">
                    {isColorRow ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-950 border border-amber-300 rounded-xs font-bold text-xs">
                        <Palette className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>{value}</span>
                      </span>
                    ) : isProductRow ? (
                      <span className="font-semibold text-brand-charcoal inline-flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>{value}</span>
                      </span>
                    ) : isOrderRow ? (
                      <span className="inline-flex items-center gap-1 text-emerald-800 font-medium text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{value}</span>
                      </span>
                    ) : (
                      <span className="leading-relaxed">{value}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // 2. Check for Key-Value Lines (e.g., "Product: ...\nRequested Custom Color: ...")
  const isCustomOrSpec = type === 'custom_color' || rawLines.some(l => l.toLowerCase().includes('requested custom color'));
  const colonLines = rawLines.filter(l => l.includes(':'));

  if (isCustomOrSpec && colonLines.length >= 2) {
    const pairs = colonLines.map(line => {
      const idx = line.indexOf(':');
      return {
        key: line.slice(0, idx).trim().replace(/\*\*/g, ''),
        val: line.slice(idx + 1).trim().replace(/\*\*/g, ''),
      };
    });

    return (
      <div className="overflow-x-auto my-1 border border-neutral-200 rounded-xs bg-white shadow-2xs">
        <table className="min-w-full divide-y divide-neutral-200 text-xs">
          <thead className="bg-[#f6f5f2]">
            <tr>
              <th className="py-2 px-3 text-left font-bold uppercase tracking-wider text-brand-charcoal text-[10px] w-2/5 sm:w-1/3">
                Specification Field
              </th>
              <th className="py-2 px-3 text-left font-bold uppercase tracking-wider text-brand-charcoal text-[10px] w-3/5 sm:w-2/3">
                Customer Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 bg-white">
            {pairs.map((item, idx) => {
              const isColorRow = item.key.toLowerCase().includes('color');
              const isProductRow = item.key.toLowerCase().includes('product');
              return (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF9F6]/60'}>
                  <td className="py-2.5 px-3 font-semibold text-brand-charcoal text-[11px] align-top whitespace-nowrap">
                    {item.key}
                  </td>
                  <td className="py-2.5 px-3 text-neutral-800 text-[12px] align-top">
                    {isColorRow ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-950 border border-amber-300 rounded-xs font-bold text-xs">
                        <Palette className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>{item.val}</span>
                      </span>
                    ) : isProductRow ? (
                      <span className="font-semibold text-brand-charcoal inline-flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>{item.val}</span>
                      </span>
                    ) : (
                      <span className="leading-relaxed">{item.val}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // 3. Fallback to standard styled message with preserved line breaks
  return (
    <p className="font-serif text-[13px] leading-relaxed whitespace-pre-wrap text-neutral-800">
      {message}
    </p>
  );
}
