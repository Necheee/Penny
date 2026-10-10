export default function About() {
  return (
    <div className="pt-24 pb-24 px-4 md:px-8 max-w-3xl mx-auto min-h-[70vh] font-serif text-brand-charcoal">
      <h1 className="text-4xl md:text-5xl font-light mb-12 text-center">About PENNY</h1>
      
      <div className="space-y-8 text-lg leading-relaxed text-brand-charcoal/80">
        <p>
          PENNY was born out of a simple observation: modern menswear often forces a choice between comfort, aesthetic, and versatility. We believe you shouldn't have to choose.
        </p>
        <p>
          Our philosophy, "Effortless dressing by design," is rooted in the concept of the capsule wardrobe. Every piece we create is designed to seamlessly integrate with the others, removing the daily friction of getting dressed while ensuring you always look quietly put together.
        </p>
        <p>
          We focus on relaxed silhouettes, premium breathable fabrics, and a warm, understated color palette. Our signature two-piece sets reflect this ethos entirely—offering a complete, cohesive look with zero effort.
        </p>
        <p>
          Designed for the modern man who values both aesthetics and ease, PENNY is more than clothing. It is a considered approach to everyday life.
        </p>
      </div>

      <div className="mt-20 flex justify-center">
        <img 
          src="/images/placeholder.jpg" 
          alt="PENNY Studio" 
          className="w-full h-auto aspect-[16/9] object-cover bg-neutral-100"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>
    </div>
  );
}
