import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Heart, ShoppingBag, Menu, X, ChevronDown, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useProducts } from '../../context/ProductContext';
import { useNotifications } from '../../context/NotificationContext';
import SearchModal from '../shop/SearchModal';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShopHovered, setIsShopHovered] = useState(false);
  const [isInfoHovered, setIsInfoHovered] = useState(false);
  
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);
  
  const location = useLocation();
  const { openCart, cartCount } = useCart();
  const { user } = useAuth();
  const { wishlist } = useWishlist();
  const { categories = [] } = useProducts();
  const { hasUnreadNotifications, unreadCount, markAllAsSeen } = useNotifications();
  
  const wishlistCount = wishlist.length;

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
    setMobileShopOpen(false);
    setMobileInfoOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-brand-offwhite border-b border-brand-border font-sans">
      <div className="flex items-center justify-between px-4 py-4 md:px-8 max-w-7xl mx-auto">
        {/* Mobile Menu Button */}
        <button className="md:hidden p-2 -ml-2" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu className="w-6 h-6 text-brand-charcoal" />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center justify-center">
          <img src="/logo.png" alt="PENNY" className="h-7 md:h-8 w-auto" /> 
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium tracking-wide">
          <Link to="/" className={`hover:text-brand-taupe transition-colors ${location.pathname === '/' ? 'text-brand-taupe' : ''}`}>
            Home
          </Link>
          
          <div 
            className="relative py-4"
            onMouseEnter={() => setIsShopHovered(true)}
            onMouseLeave={() => setIsShopHovered(false)}
          >
            <Link to="/shop" className={`flex items-center hover:text-brand-taupe transition-colors ${location.pathname.includes('/shop') ? 'text-brand-taupe' : ''}`}>
              Shop <ChevronDown className="w-4 h-4 ml-1" />
            </Link>
            
            {/* Animated Shop Dropdown Menu */}
            <AnimatePresence>
              {isShopHovered && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 w-48 bg-white shadow-lg border border-brand-border py-2 flex flex-col z-50 font-sans"
                >
                  <Link to="/shop" className="px-6 py-2.5 hover:bg-brand-beige/40 transition-colors">All Products</Link>
                  {categories.filter(c => c.id !== 'sets' && c.slug !== 'two-piece-sets').map((cat) => (
                    <Link 
                      key={cat.id} 
                      to={`/shop?category=${cat.slug || cat.id}`} 
                      className="px-6 py-2.5 hover:bg-brand-beige/40 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link to="/about" className={`hover:text-brand-taupe transition-colors ${location.pathname === '/about' ? 'text-brand-taupe' : ''}`}>
            About
          </Link>
          
          {/* Info / Customer Care Dropdown */}
          <div 
            className="relative py-4"
            onMouseEnter={() => setIsInfoHovered(true)}
            onMouseLeave={() => setIsInfoHovered(false)}
          >
            <span className="flex items-center cursor-pointer hover:text-brand-taupe transition-colors">
              Info <ChevronDown className="w-4 h-4 ml-1" />
            </span>
            
            {/* Animated Info Dropdown Menu */}
            <AnimatePresence>
              {isInfoHovered && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 w-56 bg-white shadow-lg border border-brand-border py-2 flex flex-col z-50 font-sans"
                >
                  <Link to="/contact" className="px-6 py-2.5 hover:bg-brand-beige/40 transition-colors">Contact</Link>
                  <Link to="/shipping" className="px-6 py-2.5 hover:bg-brand-beige/40 transition-colors">Shipping & Returns</Link>
                  <Link to="/care-guide" className="px-6 py-2.5 hover:bg-brand-beige/40 transition-colors">Garment Care</Link>
                  <Link to="/privacy" className="px-6 py-2.5 hover:bg-brand-beige/40 transition-colors text-brand-taupe/80 text-xs mt-2 border-t border-brand-border pt-3">Privacy Policy</Link>
                  <Link to="/terms" className="px-6 py-2.5 hover:bg-brand-beige/40 transition-colors text-brand-taupe/80 text-xs">Terms & Conditions</Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Icons & Actions */}
        <div className="flex items-center space-x-5">
          <button 
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search" 
            className="hover:text-brand-taupe transition-colors cursor-pointer"
          >
            <Search className="w-5 h-5" />
          </button>
          
          <Link 
            to={user ? "/account" : "/account/login"} 
            aria-label={user ? `Logged in as ${user.firstName || 'User'}` : "Log in to Account"} 
            className="hidden md:flex items-center gap-1.5 text-xs font-bold tracking-[0.15em] hover:text-brand-taupe transition-colors uppercase font-sans py-1 px-2.5 rounded-xs hover:bg-black/5"
          >
            {user ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
                <span>{user.firstName || 'Account'}</span>
              </>
            ) : (
              "Login"
            )}
          </Link>

          {/* Notification Bell Icon with Red Dot */}
          <Link
            to={user ? "/account?tab=notifications" : "/account/login"}
            onClick={() => markAllAsSeen?.()}
            aria-label="Order Notifications & Tracking"
            className="hover:text-brand-taupe transition-colors flex items-center relative p-1 cursor-pointer"
            title={hasUnreadNotifications ? `${unreadCount} new order update${unreadCount === 1 ? '' : 's'}` : "Order Notifications & Tracking"}
          >
            <Bell className="w-5 h-5" />
            {hasUnreadNotifications && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-600 rounded-full ring-2 ring-brand-offwhite animate-pulse" />
            )}
          </Link>
          
          <Link to="/wishlist" aria-label="View Wishlist" className="hover:text-brand-taupe transition-colors flex items-center relative">
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-brand-charcoal text-brand-offwhite text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold font-sans" aria-label={`${wishlistCount} items in wishlist`}>
                {wishlistCount}
              </span>
            )}
          </Link>
          
          <button onClick={openCart} aria-label="Open Shopping Bag" className="hover:text-brand-taupe transition-colors flex items-center relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-brand-charcoal text-brand-offwhite text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold font-sans" aria-label={`${cartCount} items in bag`}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Animated Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden font-sans" aria-modal="true" role="dialog">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-brand-charcoal/50 backdrop-blur-sm" 
              onClick={closeMenu}
              aria-hidden="true"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-4/5 max-w-sm h-full bg-brand-offwhite shadow-2xl flex flex-col pt-6 px-6 overflow-y-auto"
            >
              <button aria-label="Close menu" className="absolute top-6 right-6 text-brand-charcoal" onClick={closeMenu}>
                <X className="w-6 h-6" />
              </button>
              
              <div className="mt-6 mb-10">
                <img src="/logo.png" alt="PENNY" className="h-6 w-auto" />
              </div>
              
              <nav className="flex flex-col space-y-6 text-xl font-medium text-brand-charcoal pb-12 font-sans tracking-wide">
                <Link to="/" onClick={closeMenu}>Home</Link>
                
                {/* Mobile Shop Accordion */}
                <div className="flex flex-col">
                  <button 
                    className="flex items-center justify-between w-full text-left" 
                    onClick={() => setMobileShopOpen(!mobileShopOpen)}
                    aria-expanded={mobileShopOpen}
                  >
                    <span>Shop</span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${mobileShopOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {mobileShopOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="flex flex-col space-y-4 mt-4 ml-4 text-lg font-normal text-brand-charcoal/80 overflow-hidden"
                      >
                        <Link to="/shop" onClick={closeMenu}>All Products</Link>
                        {categories.filter(c => c.id !== 'sets' && c.slug !== 'two-piece-sets').map((cat) => (
                          <Link 
                            key={cat.id} 
                            to={`/shop?category=${cat.slug || cat.id}`} 
                            onClick={closeMenu}
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link to="/about" onClick={closeMenu}>About</Link>
                
                {/* Mobile Info Accordion */}
                <div className="flex flex-col">
                  <button 
                    className="flex items-center justify-between w-full text-left" 
                    onClick={() => setMobileInfoOpen(!mobileInfoOpen)}
                    aria-expanded={mobileInfoOpen}
                  >
                    <span>Info</span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${mobileInfoOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {mobileInfoOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="flex flex-col space-y-4 mt-4 ml-4 text-lg font-normal text-brand-charcoal/80 overflow-hidden"
                      >
                        <Link to="/contact" onClick={closeMenu}>Contact</Link>
                        <Link to="/shipping" onClick={closeMenu}>Shipping & Returns</Link>
                        <Link to="/care-guide" onClick={closeMenu}>Garment Care</Link>
                        <Link to="/privacy" className="text-base mt-2" onClick={closeMenu}>Privacy Policy</Link>
                        <Link to="/terms" className="text-base" onClick={closeMenu}>Terms & Conditions</Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="h-px w-full bg-brand-border my-4" aria-hidden="true"></div>
                <button 
                  type="button"
                  onClick={() => { closeMenu(); setIsSearchOpen(true); }} 
                  className="flex items-center space-x-3 text-lg font-medium text-left"
                >
                  <Search className="w-5 h-5 text-brand-charcoal" />
                  <span>Search</span>
                </button>
                <Link to={user ? "/account" : "/account/login"} className="text-lg uppercase tracking-wider text-sm font-medium flex items-center justify-between" onClick={closeMenu}>
                  <span>{user ? `Account (${user.firstName || 'Client'})` : "Login / Register"}</span>
                  {user && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Active</span>}
                </Link>
                <Link 
                  to={user ? "/account?tab=notifications" : "/account/login"} 
                  className="text-lg uppercase tracking-wider text-sm font-medium flex items-center justify-between" 
                  onClick={() => { closeMenu(); markAllAsSeen?.(); }}
                >
                  <span className="flex items-center gap-2.5">
                    <Bell className="w-5 h-5 text-brand-charcoal" />
                    <span>Notifications</span>
                  </span>
                  {hasUnreadNotifications && (
                    <span className="flex items-center gap-1 text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping inline-block mr-0.5"></span>
                      New
                    </span>
                  )}
                </Link>
                <Link to="/wishlist" className="text-lg uppercase tracking-wider text-sm font-medium" onClick={closeMenu}>Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ''}</Link>
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}
