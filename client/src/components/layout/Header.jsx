import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Heart, ShoppingBag, Menu, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShopHovered, setIsShopHovered] = useState(false);
  const [isInfoHovered, setIsInfoHovered] = useState(false);
  
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);
  
  const location = useLocation();
  const { openCart, cartCount } = useCart();
  const { user } = useAuth();
  const { wishlist } = useWishlist();
  
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
          <img src="/logo.png" alt="PENNY" className="h-7 md:h-8 w-auto invert" /> 
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
                  <Link to="/shop?category=tops" className="px-6 py-2.5 hover:bg-brand-beige/40 transition-colors">Tops</Link>
                  <Link to="/shop?category=bottoms" className="px-6 py-2.5 hover:bg-brand-beige/40 transition-colors">Bottoms</Link>
                  <Link to="/shop?category=sets" className="px-6 py-2.5 hover:bg-brand-beige/40 transition-colors">Two-Piece Sets</Link>
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
          <button aria-label="Search" className="hidden md:block hover:text-brand-taupe transition-colors">
            <Search className="w-5 h-5" />
          </button>
          
          <Link to={user ? "/account" : "/account/login"} aria-label={user ? "Go to Account" : "Log in to Account"} className="hidden md:block text-sm font-medium tracking-wide hover:text-brand-taupe transition-colors uppercase font-sans">
            {user ? "Account" : "Login"}
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
                <img src="/logo.png" alt="PENNY" className="h-6 w-auto invert" />
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
                        <Link to="/shop?category=tops" onClick={closeMenu}>Tops</Link>
                        <Link to="/shop?category=bottoms" onClick={closeMenu}>Bottoms</Link>
                        <Link to="/shop?category=sets" onClick={closeMenu}>Two-Piece Sets</Link>
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
                <Link to={user ? "/account" : "/account/login"} className="text-lg uppercase tracking-wider text-sm font-medium" onClick={closeMenu}>{user ? "Account" : "Login / Register"}</Link>
                <Link to="/wishlist" className="text-lg uppercase tracking-wider text-sm font-medium" onClick={closeMenu}>Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ''}</Link>
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
