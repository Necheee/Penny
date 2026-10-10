import { Link } from 'react-router-dom';

// Helper to map color names to simple hex values for the swatches
const getColorHex = (colorName) => {
  const map = {
    'Black': '#1a1a1a',
    'White': '#ffffff',
    'Cream': '#f5f5dc',
    'Olive': '#556b2f',
    'Navy': '#000080',
    'Charcoal': '#36454f',
    'Taupe': '#483c32',
    'Heather Grey': '#9ea2a2',
    'Sand': '#c2b280',
    'Rust': '#b7410e',
    'Washed Blue': '#7895b6',
    'Chocolate': '#3b2f2f',
    'Sage': '#9dc183',
    'Off-White': '#f8f8f2'
  };
  return map[colorName] || '#cccccc'; // fallback gray
};

export default function ProductCard({ product }) {
  return (
    <Link to={`/product/${product.id}`} className="group flex flex-col cursor-pointer">
      <div className="relative aspect-[4/5] mb-4 bg-[#f4f4f0] overflow-hidden">
        <img 
          src={product.images.primary} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" 
        />
        {/* Optional: A subtle border that appears on hover for framing */}
        <div className="absolute inset-0 border border-brand-charcoal/0 group-hover:border-brand-charcoal/10 transition-colors duration-500 pointer-events-none" />
      </div>
      
      {/* Typography refined: uppercase, tracking-wider for name. Serif for price. */}
      <h3 className="text-xs font-bold tracking-[0.1em] uppercase text-brand-charcoal mb-1">
        {product.name}
      </h3>
      
      <p className="text-sm text-brand-charcoal/70 mb-3 font-serif">
        ₦ {product.price.toLocaleString()}
      </p>
      
      {/* Visual Color Swatches instead of text */}
      {product.colors && product.colors.length > 0 && (
        <div className="flex space-x-1.5 mt-auto">
          {product.colors.map((color, idx) => (
            <div 
              key={idx} 
              title={color}
              className="w-3 h-3 rounded-full shadow-sm border border-black/10" 
              style={{ backgroundColor: getColorHex(color) }} 
            />
          ))}
        </div>
      )}
    </Link>
  );
}
