import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/shop/ProductCard';

const fallbackHeroImages = [
  "/images/products/linen-set-1.jpg",
  "/images/products/essential-tee-2.jpg",
  "/images/products/lounge-set-2.jpg",
];

export default function Home() {
  const { products, featuredProducts } = useProducts();
  const linenSet = products.find(p => p.id === 'p-001') || products[0];
  const displayedFeatured = (featuredProducts || []).slice(0, 4);

  // Dynamically derive hero images directly from the products featured on the homepage
  const featuredHeroImages = displayedFeatured
    .map(p => p.images?.primary || (typeof p.images === 'string' ? p.images : null))
    .filter(Boolean);

  const heroImages = featuredHeroImages.length > 0 ? featuredHeroImages : fallbackHeroImages;

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-play timer
  useEffect(() => {
    if (heroImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [currentSlide, heroImages.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  const goToSlide = (index) => setCurrentSlide(index);

  return (
    <div className="flex flex-col w-full overflow-x-clip">
      {/* 1. Hero Carousel */}
      <section className="relative h-[85vh] w-full bg-brand-charcoal overflow-hidden group">
        
        {/* Animated Image Slides */}
        <AnimatePresence initial={false}>
          <motion.img
            key={currentSlide}
            src={heroImages[currentSlide] || fallbackHeroImages[0]}
            alt="PENNY Editorial"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.6, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </AnimatePresence>

        {/* Navigation Arrows */}
        {heroImages.length > 1 && (
          <>
            <button 
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:outline-none z-20 hidden md:block cursor-pointer"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>
            <button 
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:outline-none z-20 hidden md:block cursor-pointer"
              aria-label="Next image"
            >
              <ChevronRight className="w-10 h-10" />
            </button>
          </>
        )}

        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-6xl lg:text-7xl font-serif text-brand-offwhite mb-6 tracking-wide pointer-events-auto drop-shadow-sm"
          >
            EFFORTLESS DRESSING,<br/> BY DESIGN.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="text-brand-beige text-xs md:text-sm max-w-lg mb-10 tracking-[0.2em] uppercase font-medium pointer-events-auto"
          >
            Modern men's essentials designed to work together.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mt-4 pointer-events-auto"
          >
            <Link to="/shop?category=tops" className="bg-brand-offwhite text-brand-charcoal px-10 py-4 text-xs font-bold tracking-[0.2em] uppercase hover:bg-brand-beige transition-colors text-center w-full sm:w-auto">
              Shop Tops
            </Link>
            <Link to="/shop?category=bottoms" className="border border-brand-offwhite text-brand-offwhite px-10 py-4 text-xs font-bold tracking-[0.2em] uppercase hover:bg-white hover:text-brand-charcoal transition-colors text-center w-full sm:w-auto">
              Shop Bottoms
            </Link>
          </motion.div>
        </div>

        {/* Pagination Dots */}
        {heroImages.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-4 z-20">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-none cursor-pointer ${
                  currentSlide === index 
                    ? 'bg-white scale-125' 
                    : 'bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* 2. Brand Introduction (Scroll Reveal Animation) */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="py-24 px-6 md:px-12 max-w-4xl mx-auto text-center"
      >
        <h2 className="text-3xl md:text-4xl font-serif mb-8 text-brand-charcoal">The Capsule Philosophy</h2>
        <p className="text-lg md:text-xl text-brand-charcoal/80 leading-relaxed font-serif mb-8">
          We believe in fewer, better things. PENNY is built on the foundation of the capsule wardrobe—creating cohesive, intentional pieces that eliminate the daily stress of getting dressed. Every garment is designed to pair perfectly with the rest, ensuring effortless styling every single time.
        </p>
        <Link to="/about" className="inline-flex items-center text-xs font-bold tracking-[0.15em] uppercase text-brand-charcoal hover:text-brand-taupe transition-colors border-b border-brand-charcoal pb-1">
          Read Our Story <ArrowRight className="ml-2 w-4 h-4" />
        </Link>
      </motion.section>

      {/* 3. Featured Collection (Scroll Reveal) */}
      {displayedFeatured.length > 0 && (
        <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto w-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-between items-end mb-12"
          >
            <h2 className="text-3xl font-serif text-brand-charcoal">Featured Essentials</h2>
            <Link to="/shop" className="hidden md:inline-flex items-center text-xs font-bold tracking-[0.15em] uppercase hover:text-brand-taupe transition-colors">
              View All <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </motion.div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-8">
            {displayedFeatured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 4. Two-Piece Set Feature (Scroll Reveal Split Showcase) */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="bg-brand-charcoal text-brand-offwhite py-24"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 relative aspect-[4/5] md:aspect-auto md:h-[80vh] overflow-hidden">
            <img src={linenSet?.images.gallery[0] || '/images/products/linen-set-1.jpg'} alt="Linen Set" className="w-full h-full object-cover" />
          </div>
          <div className="order-1 md:order-2 flex flex-col items-start md:pl-12">
            <h2 className="text-4xl md:text-5xl font-serif mb-6 leading-tight">Pieces designed to work together.</h2>
            <p className="text-gray-400 mb-8 max-w-md font-serif text-lg leading-relaxed">
              Our signature Linen Two-Piece Set perfectly embodies the PENNY philosophy. Wear them together for a cohesive, sophisticated look, or style the pieces separately to multiply your wardrobe options.
            </p>
            <Link 
              to="/shop?category=the-linen-shop" 
              className="bg-brand-offwhite text-brand-charcoal px-8 py-3.5 text-xs font-bold tracking-[0.15em] uppercase hover:bg-brand-beige transition-colors inline-block text-center cursor-pointer"
            >
              Explore The Set
            </Link>
          </div>
        </div>
      </motion.section>

      {/* 5. Newsletter (Scroll Reveal) */}
      <motion.section 
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="py-32 px-6 text-center max-w-2xl mx-auto"
      >
        <h2 className="text-3xl md:text-4xl font-serif text-brand-charcoal mb-4">Join The Club</h2>
        <p className="text-brand-taupe mb-8 font-serif text-lg">Subscribe for early access to new releases and editorial insights on effortless dressing.</p>
        <form className="flex flex-col sm:flex-row max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
          <input 
            type="email" 
            placeholder="Email address" 
            className="flex-grow border-b border-brand-charcoal bg-transparent py-3 px-4 focus:outline-none focus:border-brand-taupe transition-colors mb-4 sm:mb-0 placeholder-brand-taupe/60"
            required
          />
          <button type="submit" className="bg-brand-charcoal text-brand-offwhite px-8 py-3 text-xs font-bold tracking-[0.15em] uppercase hover:bg-black transition-colors sm:ml-4 cursor-pointer">
            Subscribe
          </button>
        </form>
      </motion.section>
    </div>
  );
}
