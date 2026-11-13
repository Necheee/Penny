import { Link } from 'react-router-dom';
import { useProducts } from '../../context/ProductContext';

export default function Footer() {
  const { categories = [] } = useProducts();
  const footerCategories = categories
    .filter(c => c.id !== 'sets' && c.slug !== 'two-piece-sets')
    .slice(0, 3);

  return (
    <footer className="bg-brand-charcoal text-brand-offwhite pt-16 pb-8 px-6 md:px-12 mt-auto border-t border-brand-charcoal">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
        
        {/* Brand Column */}
        <div className="flex flex-col space-y-4">
          <img src="/logo.png" alt="PENNY" className="h-8 w-auto object-contain object-left mb-2 brightness-0 invert" />
          <p className="text-sm font-serif italic text-brand-beige">Effortless dressing by design.</p>
          <p className="text-xs text-brand-border leading-relaxed max-w-xs mt-4">
            Modern men's essentials built around the capsule wardrobe. 
            Fewer unnecessary choices. Cohesive pieces. Intentional design.
          </p>
        </div>

        {/* Dynamic Shop Links (Top 3 active store categories) */}
        <div className="flex flex-col space-y-3 text-sm">
          <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-xs">Shop</h4>
          <Link to="/shop" className="text-brand-border hover:text-white transition-colors">All Products</Link>
          {footerCategories.map(cat => (
            <Link 
              key={cat.id || cat.slug} 
              to={`/shop?category=${cat.slug || cat.id}`} 
              className="text-brand-border hover:text-white transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Info Links */}
        <div className="flex flex-col space-y-3 text-sm">
          <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-xs">Information</h4>
          <Link to="/about" className="text-brand-border hover:text-white transition-colors">About Us</Link>
          <Link to="/contact" className="text-brand-border hover:text-white transition-colors">Contact</Link>
          <Link to="/care-guide" className="text-brand-border hover:text-white transition-colors">Care Guide</Link>
          <Link to="/shipping" className="text-brand-border hover:text-white transition-colors">Shipping & Returns</Link>
        </div>

        {/* Account Links */}
        <div className="flex flex-col space-y-3 text-sm">
          <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-xs">Account</h4>
          <Link to="/account/login" className="text-brand-border hover:text-white transition-colors">Sign In</Link>
          <Link to="/account/register" className="text-brand-border hover:text-white transition-colors">Create Account</Link>
          <Link to="/wishlist" className="text-brand-border hover:text-white transition-colors">Wishlist</Link>
          <Link to="/account" className="text-brand-border hover:text-white transition-colors">Orders</Link>
        </div>

      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-brand-taupe/30 text-xs text-brand-border flex flex-col md:flex-row justify-between items-center">
        <p>&copy; {new Date().getFullYear()} PENNY. All rights reserved.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
