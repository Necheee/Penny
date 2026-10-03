import { Link } from 'react-router-dom';
import { products } from '../data/mockCatalogue';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  const featuredProducts = products.filter(p => p.featured).slice(0, 4);
  const linenSet = products.find(p => p.id === 'p-001');

  return (
    <div className="flex flex-col w-full">
      <section className="relative h-[85vh] w-full bg-brand-charcoal overflow-hidden">
        <img 
          src="/images/products/linen-set-1.jpg" 
          alt="Menswear Editorial" 
          className="absolute inset-0 w-full h-full object-cover object-center opacity-60"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-brand-offwhite mb-6 tracking-wide">
            EFFORTLESS DRESSING,<br/> BY DESIGN.
          </h1>
          <p className="text-brand-beige text-xs md:text-sm max-w-lg mb-10 tracking-[0.2em] uppercase font-medium">
            Modern men's essentials designed to work together.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
            <Link to="/shop?category=tops" className="bg-brand-offwhite text-brand-charcoal px-8 py-3.5 text-xs font-bold tracking-[0.15em] uppercase hover:bg-brand-beige transition-colors">
              Shop Tops
            </Link>
            <Link to="/shop?category=bottoms" className="border border-brand-offwhite text-brand-offwhite px-8 py-3.5 text-xs font-bold tracking-[0.15em] uppercase hover:bg-white hover:text-brand-charcoal transition-colors">
              Shop Bottoms
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 md:px-12 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-serif mb-8 text-brand-charcoal">The Capsule Philosophy</h2>
        <p className="text-lg md:text-xl text-brand-charcoal/80 leading-relaxed font-serif mb-8">
          We believe in fewer, better things. PENNY is built on the foundation of the capsule wardrobe—creating cohesive, intentional pieces that eliminate the daily stress of getting dressed. Every garment is designed to pair perfectly with the rest, ensuring effortless styling every single time.
        </p>
        <Link to="/about" className="inline-flex items-center text-xs font-bold tracking-[0.15em] uppercase text-brand-charcoal hover:text-brand-taupe transition-colors border-b border-brand-charcoal pb-1">
          Read Our Story <ArrowRight className="ml-2 w-4 h-4" />
        </Link>
      </section>

      <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <Link to="/shop?category=tops" className="group relative h-[60vh] overflow-hidden bg-brand-charcoal flex items-center justify-center">
          <img src="/images/products/essential-tee-1.jpg" alt="Tops" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
          <h3 className="relative text-3xl font-serif text-white z-10 tracking-wide">Tops</h3>
        </Link>
        <Link to="/shop?category=bottoms" className="group relative h-[60vh] overflow-hidden bg-brand-charcoal flex items-center justify-center">
          <img src="/images/products/trousers-1.jpg" alt="Bottoms" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
          <h3 className="relative text-3xl font-serif text-white z-10 tracking-wide">Bottoms</h3>
        </Link>
        <Link to="/shop?category=sets" className="group relative h-[60vh] overflow-hidden bg-brand-charcoal flex items-center justify-center">
          <img src="/images/products/lounge-set-1.jpg" alt="Sets" className="absolute inset-0 w-full h-full object-cover object-top opacity-80 group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
          <h3 className="relative text-3xl font-serif text-white z-10 tracking-wide">Two-Piece Sets</h3>
        </Link>
      </section>

      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <h2 className="text-3xl font-serif text-brand-charcoal">Featured Essentials</h2>
          <Link to="/shop" className="hidden md:inline-flex items-center text-xs font-bold tracking-[0.15em] uppercase hover:text-brand-taupe transition-colors">
            View All <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-8">
          {featuredProducts.map((product) => (
            <Link key={product.id} to={`/product/${product.id}`} className="group flex flex-col">
              <div className="relative aspect-[3/4] mb-4 bg-brand-beige/30 overflow-hidden">
                <img src={product.images.primary} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <h3 className="text-sm font-medium text-brand-charcoal mb-1">{product.name}</h3>
              <p className="text-xs text-brand-taupe mb-2">{product.colors.length} Colors</p>
              <p className="text-sm font-medium text-brand-charcoal">₦{product.price.toLocaleString()}</p>
            </Link>
          ))}
        </div>
      </section>

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
