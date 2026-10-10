import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import ProductCard from '../components/shop/ProductCard';

export default function Wishlist() {
  const { wishlist } = useWishlist();
  const { user } = useAuth();

  return (
    <div className="pt-24 pb-24 px-4 md:px-8 max-w-7xl mx-auto min-h-[70vh]">
      
      {/* Refined Guest Prompt */}
      {!user && wishlist.length > 0 && (
        <div className="mb-12 py-3 border-b border-brand-charcoal/10 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[12px] uppercase tracking-widest text-brand-charcoal/60">
            Guest Wishlist
          </p>
          <p className="text-[12px] text-brand-charcoal/60">
            <Link to="/account/login" className="text-brand-charcoal underline underline-offset-4 font-medium hover:text-brand-taupe transition-colors">
              Sign in
            </Link> to save these items across your devices.
          </p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
        <div>
          <h1 className="text-4xl font-serif text-brand-charcoal mb-2">Wishlist</h1>
          <p className="text-xs uppercase tracking-widest text-brand-charcoal/50">
            {wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'}
          </p>
        </div>
      </div>

      {wishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32">
          <h2 className="text-2xl font-serif text-brand-charcoal mb-4">Nothing saved yet</h2>
          <p className="text-[13px] text-brand-charcoal/60 mb-8 max-w-md text-center">
            Keep track of your favorite pieces. Explore our collection and click the heart icon to save items here.
          </p>
          <Link to="/shop" className="border border-brand-charcoal text-brand-charcoal px-10 py-3 text-[11px] uppercase tracking-widest font-bold hover:bg-brand-charcoal hover:text-white transition-colors">
            Explore Collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
          {wishlist.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
