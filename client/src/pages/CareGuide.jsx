export default function CareGuide() {
  return (
    <div className="pt-24 pb-24 px-4 md:px-8 max-w-3xl mx-auto min-h-[70vh] text-brand-charcoal">
      <h1 className="text-4xl md:text-5xl font-serif font-light mb-12 text-center">Garment Care</h1>
      
      <div className="prose prose-neutral max-w-none text-brand-charcoal/80">
        <p className="text-center text-[13px] uppercase tracking-widest mb-16">
          How to ensure your PENNY pieces last a lifetime.
        </p>

        <div className="space-y-16">
          <section>
            <h2 className="text-2xl font-serif text-brand-charcoal mb-4">Linen</h2>
            <p className="mb-4">
              Our signature linen is highly breathable and softens beautifully over time. To maintain its structure and finish:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[15px]">
              <li>Machine wash on a cold, gentle cycle using mild detergent.</li>
              <li>Wash with similar colors to prevent dye transfer.</li>
              <li>Do not bleach or tumble dry. High heat will damage the natural fibers.</li>
              <li>Air dry flat or hang on a well-shaped hanger away from direct sunlight.</li>
              <li>Iron on a medium-high setting while the garment is still slightly damp.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-brand-charcoal mb-4">Cotton</h2>
            <p className="mb-4">
              Our heavy-weight and standard cottons are designed for everyday durability.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[15px]">
              <li>Machine wash cold with like colors.</li>
              <li>Tumble dry on low or air dry to prevent shrinkage.</li>
              <li>If ironing is necessary, use a warm setting.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-brand-charcoal mb-4">Knitwear</h2>
            <p className="mb-4">
              Our knitwear requires delicate handling to maintain its shape.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[15px]">
              <li>Hand wash in cold water using a wool-safe detergent, or use a machine hand-wash cycle.</li>
              <li>Never wring or twist the garment. Gently press out excess water.</li>
              <li>Always dry flat on a clean towel. Never hang knitwear, as it will stretch out of shape.</li>
              <li>Store folded in a cool, dry place.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-brand-charcoal mb-4">General Storage</h2>
            <p className="mb-4 text-[15px]">
              Store your garments in a cool, dry environment. We recommend using wooden or padded hangers for shirts and jackets to maintain their shoulder structure. Trousers should be folded along the crease or hung using clamp hangers. Ensure garments are completely clean before long-term seasonal storage to prevent fiber degradation.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
