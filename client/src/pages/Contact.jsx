import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    orderNumber: '',
    message: '',
  });
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'submitted' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        if (res.ok) {
          setStatus('submitted');
          return;
        }
      }

      if (res.ok && (data.success || data.inquiry)) {
        setStatus('submitted');
      } else {
        throw new Error(data.message || 'Unable to submit your inquiry.');
      }
    } catch (err) {
      console.error('Contact form submission error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'An error occurred while sending your message. Please try again or email us directly.');
    }
  };

  return (
    <div className="pt-24 pb-24 px-4 md:px-8 max-w-2xl mx-auto min-h-[70vh] text-brand-charcoal font-sans">
      <h1 className="text-3xl md:text-4xl font-serif mb-4 text-center">Contact Us</h1>
      <p className="text-center text-[13px] text-brand-charcoal/70 mb-10 font-serif max-w-md mx-auto">
        Have a question about a product, order status, or tailoring fit? Our team is at your service.
      </p>

      {status === 'submitted' ? (
        <div className="bg-brand-beige/25 p-8 text-center border border-brand-charcoal/15 rounded-xs space-y-3">
          <div className="w-10 h-10 rounded-full bg-brand-charcoal text-white flex items-center justify-center mx-auto text-sm font-bold">
            ✓
          </div>
          <h2 className="text-xl font-serif text-brand-charcoal">Inquiry Received</h2>
          <p className="text-[13px] text-brand-charcoal/80 font-serif leading-relaxed max-w-sm mx-auto">
            Thank you for reaching out, <strong>{formData.name}</strong>. An email notification has been dispatched to the PENNY team. We will respond directly to <strong>{formData.email}</strong> within 24 hours.
          </p>
          <button
            type="button"
            onClick={() => {
              setFormData({ name: '', email: '', orderNumber: '', message: '' });
              setStatus('idle');
            }}
            className="mt-4 px-6 py-2.5 bg-brand-charcoal text-white text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-colors"
          >
            Send Another Inquiry
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {status === 'error' && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xs">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col space-y-2">
              <label htmlFor="name" className="text-[11px] uppercase tracking-widest font-bold">Name *</label>
              <input 
                type="text" 
                id="name" 
                name="name"
                required 
                value={formData.name}
                onChange={handleChange}
                placeholder="Alexander Balogun"
                className="border border-brand-charcoal/20 p-3 text-[13px] focus:outline-none focus:border-brand-charcoal bg-transparent"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="email" className="text-[11px] uppercase tracking-widest font-bold">Email Address *</label>
              <input 
                type="email" 
                id="email" 
                name="email"
                required 
                value={formData.email}
                onChange={handleChange}
                placeholder="client@example.com"
                className="border border-brand-charcoal/20 p-3 text-[13px] focus:outline-none focus:border-brand-charcoal bg-transparent"
              />
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <label htmlFor="orderNumber" className="text-[11px] uppercase tracking-widest font-bold">Order Number (Optional)</label>
            <input 
              type="text" 
              id="orderNumber" 
              name="orderNumber"
              value={formData.orderNumber}
              onChange={handleChange}
              placeholder="e.g. PNY-190554"
              className="border border-brand-charcoal/20 p-3 text-[13px] focus:outline-none focus:border-brand-charcoal bg-transparent font-mono"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label htmlFor="message" className="text-[11px] uppercase tracking-widest font-bold">Message *</label>
            <textarea 
              id="message" 
              name="message"
              required 
              rows="5"
              value={formData.message}
              onChange={handleChange}
              placeholder="How can we assist you with your capsule wardrobe order?"
              className="border border-brand-charcoal/20 p-3 text-[13px] focus:outline-none focus:border-brand-charcoal bg-transparent resize-none"
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={status === 'submitting'}
            className="w-full bg-brand-charcoal text-white uppercase tracking-widest text-[11px] font-bold py-4 hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
          >
            {status === 'submitting' ? 'Dispatching Message...' : 'Send Inquiry'}
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
