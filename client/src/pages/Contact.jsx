import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, CheckCircle2, UserCheck, ArrowRight, MessageSquare, ShieldCheck } from 'lucide-react';

export default function Contact() {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    orderNumber: '',
    message: '',
  });
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'submitted' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  // Automatically sync logged-in client credentials
  useEffect(() => {
    if (user) {
      const defaultName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0];
      setFormData(prev => ({
        ...prev,
        name: prev.name || defaultName,
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage('Please sign in to send a message to the PENNY team.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    const payload = {
      name: formData.name.trim() || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0],
      email: user.email.trim().toLowerCase(),
      orderNumber: formData.orderNumber.trim(),
      message: formData.message.trim(),
      userId: user.id || null,
      type: 'inquiry',
      subject: formData.orderNumber.trim() 
        ? `Order #${formData.orderNumber.trim()} Inquiry` 
        : 'Customer Care Inquiry',
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

      if (res.ok && (data.success || data.inquiry || data.data)) {
        setStatus('submitted');
        try {
          const inq = data.inquiry || data.data;
          if (inq) {
            const localInquiries = JSON.parse(localStorage.getItem('penny_my_inquiries') || '[]');
            localStorage.setItem('penny_my_inquiries', JSON.stringify([inq, ...localInquiries]));
          }
        } catch {}
        window.dispatchEvent(new Event('penny_inquiry_sent'));
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
      <div className="text-center mb-8">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-taupe block mb-1">
          Client Services
        </span>
        <h1 className="text-3xl md:text-4xl font-serif text-brand-charcoal">Contact Us</h1>
        <p className="text-[13px] text-brand-charcoal/70 mt-2 font-serif max-w-md mx-auto">
          Have a question about a product, order status, or bespoke tailoring fit? Our team is at your service.
        </p>
      </div>

      {/* 1. GUEST RESTRICTION: Show Sign-In Gate when user is not logged in */}
      {!user ? (
        <div className="bg-brand-offwhite/50 border border-brand-charcoal/15 rounded-xs p-8 sm:p-10 text-center space-y-4 max-w-lg mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-full bg-brand-charcoal text-white flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-taupe block">
              Atelier Correspondence
            </span>
            <h2 className="text-xl font-serif text-brand-charcoal mt-1">Client Sign-In Required</h2>
          </div>
          <p className="text-[13px] text-brand-charcoal/70 font-serif leading-relaxed max-w-md mx-auto">
            To provide dedicated client care and preserve a continuous history of your inquiries and order correspondence, messages to the PENNY team are reserved for registered clients.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/signin?redirect=/contact"
              className="px-6 py-3 bg-brand-charcoal text-white text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-colors rounded-xs text-center cursor-pointer shadow-xs"
            >
              Sign In to Your Account
            </Link>
            <Link
              to="/create-account?redirect=/contact"
              className="px-6 py-3 border border-brand-charcoal text-brand-charcoal text-[11px] font-bold uppercase tracking-widest hover:bg-brand-charcoal/5 transition-colors rounded-xs text-center cursor-pointer"
            >
              Create Client Account
            </Link>
          </div>
          <p className="text-[11px] text-brand-charcoal/50 font-serif pt-2 border-t border-brand-charcoal/10">
            For urgent press or concierge queries, you can also reach us directly at <a href="mailto:care@pennymenswear.com" className="underline hover:text-black">care@pennymenswear.com</a>.
          </p>
        </div>
      ) : status === 'submitted' ? (
        /* 2. SUCCESS CONFIRMATION */
        <div className="bg-[#FAF9F6] p-8 text-center border border-brand-charcoal/15 rounded-xs space-y-4 max-w-lg mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-lg font-bold shadow-xs">
            ✓
          </div>
          <h2 className="text-xl font-serif text-brand-charcoal">Inquiry Received</h2>
          <p className="text-[13px] text-brand-charcoal/80 font-serif leading-relaxed max-w-sm mx-auto">
            Thank you for reaching out, <strong>{formData.name}</strong>. An email notification has been dispatched to the PENNY team. Your message is recorded in your account, and our team will respond directly to <strong>{user.email}</strong> within 24 hours.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/account"
              className="px-5 py-2.5 bg-brand-charcoal text-white text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-colors rounded-xs inline-flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" /> View in Account Portal
            </Link>
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, orderNumber: '', message: '' }));
                setStatus('idle');
              }}
              className="px-5 py-2.5 border border-brand-charcoal text-brand-charcoal text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-100 transition-colors rounded-xs cursor-pointer"
            >
              Send Another Inquiry
            </button>
          </div>
        </div>
      ) : (
        /* 3. AUTHENTICATED USER CONTACT FORM */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Authenticated Client Status Bar */}
          <div className="p-3 bg-[#FAF9F6] border border-brand-charcoal/15 rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="text-[11px] font-bold text-brand-charcoal uppercase tracking-wider">
                Logged in as: <span className="font-serif normal-case font-normal text-neutral-600">{user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}</span>
              </span>
            </div>
            <Link to="/account" className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal hover:underline inline-flex items-center gap-1 shrink-0">
              <MessageSquare className="w-3 h-3" /> View Inquiries History
            </Link>
          </div>

          {status === 'error' && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-xs flex items-start gap-2">
              <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col space-y-2">
              <label htmlFor="name" className="text-[11px] uppercase tracking-widest font-bold text-brand-charcoal">
                Client Name *
              </label>
              <input 
                type="text" 
                id="name" 
                name="name"
                required 
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name"
                className="border border-brand-charcoal/20 p-3 text-[13px] focus:outline-none focus:border-brand-charcoal bg-white rounded-xs"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="email" className="text-[11px] uppercase tracking-widest font-bold text-brand-charcoal flex items-center justify-between">
                <span>Email Address *</span>
                <span className="text-[9px] text-emerald-700 font-normal normal-case inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified Client
                </span>
              </label>
              <input 
                type="email" 
                id="email" 
                name="email"
                readOnly
                value={formData.email}
                className="border border-neutral-200 p-3 text-[13px] bg-neutral-100/70 text-neutral-600 cursor-not-allowed rounded-xs"
              />
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <label htmlFor="orderNumber" className="text-[11px] uppercase tracking-widest font-bold text-brand-charcoal">
              Order Reference (Optional)
            </label>
            <input 
              type="text" 
              id="orderNumber" 
              name="orderNumber"
              value={formData.orderNumber}
              onChange={handleChange}
              placeholder="e.g. PNY-190554"
              className="border border-brand-charcoal/20 p-3 text-[13px] focus:outline-none focus:border-brand-charcoal bg-white font-mono rounded-xs"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label htmlFor="message" className="text-[11px] uppercase tracking-widest font-bold text-brand-charcoal">
              Message / Inquiry Details *
            </label>
            <textarea 
              id="message" 
              name="message"
              required 
              rows="5"
              value={formData.message}
              onChange={handleChange}
              placeholder="How can we assist you with your capsule wardrobe order or garment inquiry?"
              className="border border-brand-charcoal/20 p-3 text-[13px] focus:outline-none focus:border-brand-charcoal bg-white resize-none rounded-xs font-serif leading-relaxed"
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={status === 'submitting'}
            className="w-full bg-brand-charcoal text-white uppercase tracking-widest text-[11px] font-bold py-4 hover:bg-black transition-colors disabled:opacity-50 cursor-pointer rounded-xs"
          >
            {status === 'submitting' ? 'Dispatching Message to PENNY Team...' : 'Send Inquiry to PENNY Team'}
          </button>
        </form>
      )}

      <div className="mt-20 border-t border-brand-charcoal/10 pt-12 flex flex-col items-center text-center space-y-6">
        <div>
          <h3 className="text-[11px] uppercase tracking-widest font-bold mb-2">Concierge Email</h3>
          <p className="text-[13px] text-brand-charcoal/70">care@pennymenswear.com</p>
        </div>
        <div>
          <h3 className="text-[11px] uppercase tracking-widest font-bold mb-2">Operating Hours</h3>
          <p className="text-[13px] text-brand-charcoal/70">Monday - Friday<br/>9:00 AM - 5:00 PM (WAT)</p>
        </div>
      </div>
    </div>
  );
}
