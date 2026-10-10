import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { products } from '../data/mockCatalogue';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/shop/ProductCard';

const heroImages = [
  "/images/products/linen-set-1.jpg",
  "/images/products/essential-tee-2.jpg",
  "/images/products/lounge-set-2.jpg",
];

export default function Home() {
  const featuredProducts = products.filter(p => p.featured).slice(0, 4);
  const linenSet = products.find(p => p.id === 'p-001');

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-play timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [currentSlide]); // Reset timer if manually changed

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  const goToSlide = (index) => setCurrentSlide(index);

  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero Carousel */}
      <section className="relative h-[85vh] w-full bg-brand-charcoal overflow-hidden group">
        
        {/* Animated Image Slides */}
        <AnimatePresence initial={false}>
          <motion.img
            key={currentSlide}
            src={heroImages[currentSlide]}
            alt="Menswear Editorial"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.6, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button 
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:outline-none z-20 hidden md:block"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-10 h-10" />
        </button>
        <button 
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:outline-none z-20 hidden md:block"
          aria-label="Next image"
        >
          <ChevronRight className="w-10 h-10" />
        </button>

        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none z-10">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-brand-offwhite mb-6 tracking-wide pointer-events-auto drop-shadow-sm">
            EFFORTLESS DRESSING,<br/> BY DESIGN.
          </h1>
          <p className="text-brand-beige text-xs md:text-sm max-w-lg mb-10 tracking-[0.2em] uppercase font-medium pointer-events-auto">
            Modern men's essentials designed to work together.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mt-4 pointer-events-auto">
            <Link to="/shop?category=tops" className="bg-brand-offwhite text-brand-charcoal px-10 py-4 text-xs font-bold tracking-[0.2em] uppercase hover:bg-brand-beige transition-colors text-center w-full sm:w-auto">
              Shop Tops
            </Link>
            <Link to="/shop?category=bottoms" className="border border-brand-offwhite text-brand-offwhite px-10 py-4 text-xs font-bold tracking-[0.2em] uppercase hover:bg-white hover:text-brand-charcoal transition-colors text-center w-full sm:w-auto">
              Shop Bottoms
            </Link>
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-4 z-20">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-none ${
                currentSlide === index 
                  ? 'bg-white scale-125' 
                  : 'bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </section>

      {/* 2. Brand Introduction */}
      <section className="py-24 px-6 md:px-12 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-serif mb-8 text-brand-charcoal">The Capsule Philosophy</h2>
        <p className="text-lg md:text-xl text-brand-charcoal/80 leading-relaxed font-serif mb-8">
          We believe in fewer, better things. PENNY is built on the foundation of the capsule wardrobe—creating cohesive, intentional pieces that eliminate the daily stress of getting dressed. Every garment is designed to pair perfectly with the rest, ensuring effortless styling every single time.
        </p>
        <Link to="/about" className="inline-flex items-center text-xs font-bold tracking-[0.15em] uppercase text-brand-charcoal hover:text-brand-taupe transition-colors border-b border-brand-charcoal pb-1">
          Read Our Story <ArrowRight className="ml-2 w-4 h-4" />
        </Link>
      </section>

      {/* 3. Featured Collection */}
      <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <h2 className="text-3xl font-serif text-brand-charcoal">Featured Essentials</h2>
          <Link to="/shop" className="hidden md:inline-flex items-center text-xs font-bold tracking-[0.15em] uppercase hover:text-brand-taupe transition-colors">
            View All <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-8">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. Two-Piece Set Feature */}
      <section className="bg-brand-charcoal text-brand-offwhite py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 relative aspect-[4/5] md:aspect-auto md:h-[80vh]">
            <img src={linenSet?.images.gallery[0] || '/images/products/linen-set-1.jpg'} alt="Linen Set" className="w-full h-full object-cover" />
          </div>
          <div className="order-1 md:order-2 flex flex-col items-start md:pl-12">
            <h2 className="text-4xl md:text-5xl font-serif mb-6 leading-tight">Pieces designed to work together.</h2>
            <p className="text-gray-400 mb-8 max-w-md font-serif text-lg leading-relaxed">
              Our signature Linen Two-Piece Set perfectly embodies the PENNY philosophy. Wear them together for a cohesive, sophisticated look, or style the pieces separately to multiply your wardrobe options.
            </p>
            <Link to={`/product/${linenSet?.id || 'p-001'}`} className="bg-brand-offwhite text-brand-charcoal px-8 py-3.5 text-xs font-bold tracking-[0.15em] uppercase hover:bg-brand-beige transition-colors">
              Explore The Set
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Newsletter */}
      <section className="py-32 px-6 text-center max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-serif text-brand-charcoal mb-4">Join The Club</h2>
        <p className="text-brand-taupe mb-8 font-serif text-lg">Subscribe for early access to new releases and editorial insights on effortless dressing.</p>
        <form className="flex flex-col sm:flex-row max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
          <input 
            type="email" 
            placeholder="Email address" 
            className="flex-grow border-b border-brand-charcoal bg-transparent py-3 px-4 focus:outline-none focus:border-brand-taupe transition-colors mb-4 sm:mb-0 placeholder-brand-taupe/60"
            required
          />
          <button type="submit" className="bg-brand-charcoal text-brand-offwhite px-8 py-3 text-xs font-bold tracking-[0.15em] uppercase hover:bg-black transition-colors sm:ml-4">
            Subscribe
          </button>
        </form>
      </section>
    </div>
  );
}
