export default function Shipping() {
  return (
    <div className="pt-24 pb-24 px-4 md:px-8 max-w-3xl mx-auto min-h-[70vh] text-brand-charcoal">
      <h1 className="text-4xl md:text-5xl font-serif font-light mb-16 text-center">Shipping & Returns</h1>
      
      <div className="space-y-16 text-brand-charcoal/80 text-[15px] leading-relaxed">
        
        <section>
          <h2 className="text-2xl font-serif text-brand-charcoal mb-6">Shipping Information</h2>
          <p className="mb-4">
            We currently ship across Nigeria. All orders are processed within 1-2 business days (excluding weekends and public holidays) after receiving your order confirmation email. You will receive another notification when your order has shipped.
          </p>
          
          <div className="mt-8 border border-brand-charcoal/10 overflow-hidden">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-brand-charcoal/5 border-b border-brand-charcoal/10">
                <tr>
                  <th className="px-4 py-3 uppercase tracking-widest font-bold">Destination</th>
                  <th className="px-4 py-3 uppercase tracking-widest font-bold">Delivery Time</th>
                  <th className="px-4 py-3 uppercase tracking-widest font-bold">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-charcoal/10">
                <tr>
                  <td className="px-4 py-4">Lagos (Standard)</td>
                  <td className="px-4 py-4">1 - 2 Business Days</td>
                  <td className="px-4 py-4">₦ 3,000</td>
                </tr>
                <tr>
                  <td className="px-4 py-4">Lagos (Express)</td>
                  <td className="px-4 py-4">Same Day (Order before 12PM)</td>
                  <td className="px-4 py-4">₦ 5,000</td>
                </tr>
                <tr>
                  <td className="px-4 py-4">Outside Lagos</td>
                  <td className="px-4 py-4">3 - 5 Business Days</td>
                  <td className="px-4 py-4">₦ 5,000</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[13px] italic">
            * Free standard shipping is automatically applied to all orders over ₦75,000.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-brand-charcoal mb-6">Returns Policy</h2>
          <p className="mb-4">
            We accept returns up to 7 days after delivery, if the item is unused and in its original condition with all tags attached. We will refund the full order amount minus the shipping costs for the return.
          </p>
          <p className="mb-4">
            To initiate a return, please contact us at <strong>care@pennymenswear.com</strong> with your order number and reason for return. Our team will provide you with the return shipping address and instructions.
          </p>
          <h3 className="font-bold uppercase tracking-widest text-[11px] mt-8 mb-2">Exchanges</h3>
          <p className="mb-4">
            If you need to exchange an item for a different size or color, please initiate a return for the original item and place a new order for the desired piece.
          </p>
          <h3 className="font-bold uppercase tracking-widest text-[11px] mt-8 mb-2">Damages & Issues</h3>
          <p>
            Please inspect your order upon reception and contact us immediately if the item is defective, damaged, or if you received the wrong item, so that we can evaluate the issue and make it right.
          </p>
        </section>

      </div>
    </div>
  );
}
