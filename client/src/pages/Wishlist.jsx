import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import ProductCard from '../components/shop/ProductCard';

export default function Wishlist() {
  const { wishlist } = useWishlist();
  const { user } = useAuth();

  return (
    <div className="pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto min-h-[70vh]">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-wide font-serif mb-2">Wishlist</h1>
          <p className="text-sm text-neutral-500">
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        
        {!user && (
          <div className="bg-neutral-50 p-4 border border-neutral-200 text-[13px] md:max-w-xs">
            <p className="mb-2"><strong>You are browsing as a guest.</strong></p>
            <p className="text-neutral-600 mb-3">Sign in to save your wishlist across all your devices.</p>
            <Link to="/account/login" className="underline underline-offset-4 font-medium hover:text-neutral-600">
              Sign In / Register
            </Link>
          </div>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-24 bg-neutral-50 border border-neutral-100">
          <p className="text-neutral-500 mb-6">Your wishlist is currently empty.</p>
          <Link to="/shop" className="bg-black text-white px-8 py-3 text-[13px] font-medium hover:bg-neutral-800 transition-colors">
            Continue Shopping
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
