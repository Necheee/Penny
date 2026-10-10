import { useState } from 'react';

export default function Contact() {
  const [status, setStatus] = useState('idle');

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('submitted');
  };

  return (
    <div className="pt-24 pb-24 px-4 md:px-8 max-w-2xl mx-auto min-h-[70vh] text-brand-charcoal">
      <h1 className="text-4xl font-serif mb-8 text-center">Contact Us</h1>
      <p className="text-center text-[13px] text-brand-charcoal/60 mb-12">
        Have a question about a product, order, or sizing? We're here to help. <br/>
        Please fill out the form below and our client care team will get back to you within 24 hours.
      </p>

      {status === 'submitted' ? (
        <div className="bg-brand-beige/20 p-8 text-center border border-brand-charcoal/10">
          <h2 className="text-xl font-serif mb-2">Message Received</h2>
          <p className="text-[13px] text-brand-charcoal/70">
            Thank you for reaching out. We will get back to you shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col space-y-2">
              <label htmlFor="name" className="text-[11px] uppercase tracking-widest font-bold">Name</label>
              <input 
                type="text" 
                id="name" 
                required 
                className="border border-brand-charcoal/20 p-3 text-[13px] focus:outline-none focus:border-brand-charcoal bg-transparent"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="email" className="text-[11px] uppercase tracking-widest font-bold">Email</label>
              <input 
                type="email" 
                id="email" 
                required 
                className="border border-brand-charcoal/20 p-3 text-[13px] focus:outline-none focus:border-brand-charcoal bg-transparent"
              />
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <label htmlFor="order" className="text-[11px] uppercase tracking-widest font-bold">Order Number (Optional)</label>
            <input 
              type="text" 
              id="order" 
              className="border border-brand-charcoal/20 p-3 text-[13px] focus:outline-none focus:border-brand-charcoal bg-transparent"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label htmlFor="message" className="text-[11px] uppercase tracking-widest font-bold">Message</label>
            <textarea 
              id="message" 
              required 
              rows="6"
              className="border border-brand-charcoal/20 p-3 text-[13px] focus:outline-none focus:border-brand-charcoal bg-transparent resize-none"
            ></textarea>
          </div>

          <button 
            type="submit" 
            className="w-full bg-brand-charcoal text-white uppercase tracking-widest text-[11px] font-bold py-4 hover:bg-black transition-colors"
          >
            Send Message
          </button>
        </form>
      )}

      <div className="mt-20 border-t border-brand-charcoal/10 pt-12 flex flex-col items-center text-center space-y-6">
        <div>
          <h3 className="text-[11px] uppercase tracking-widest font-bold mb-2">Email</h3>
          <p className="text-[13px] text-brand-charcoal/70">care@pennymenswear.com</p>
        </div>
        <div>
          <h3 className="text-[11px] uppercase tracking-widest font-bold mb-2">Hours</h3>
          <p className="text-[13px] text-brand-charcoal/70">Monday - Friday<br/>9:00 AM - 5:00 PM (WAT)</p>
        </div>
      </div>
    </div>
  );
}
