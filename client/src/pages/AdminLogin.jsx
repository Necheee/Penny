import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Authentication failed. Please verify credentials.');
      }

      if (data.user?.role !== 'admin') {
        throw new Error('Access denied. This portal is strictly restricted to the store owner.');
      }

      // Store authenticated admin session
      localStorage.setItem('penny_admin_token', data.token);
      localStorage.setItem('penny_admin_user', JSON.stringify(data.user));

      // Redirect immediately to admin dashboard
      navigate('/admin', { replace: true });
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err.message || 'Could not connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F3] flex flex-col justify-center items-center px-4 py-12 antialiased">
      <div className="w-full max-w-md">
        {/* Top Branding */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-3">
            <img src="/logo.png" alt="PENNY" className="h-8 w-auto mx-auto" />
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-charcoal text-white text-[10px] font-bold tracking-[0.2em] uppercase rounded-xs">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Owner Portal</span>
          </div>
          <h1 className="mt-4 text-2xl md:text-3xl font-serif text-brand-charcoal font-normal">
            Store Administration
          </h1>
          <p className="mt-1.5 text-xs text-neutral-500 tracking-wide">
            Private management portal for catalogue, orders, and inventory.
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white border border-neutral-200/80 shadow-sm p-8 rounded-xs">
          {error && (
            <div className="mb-6 p-3.5 bg-red-50/90 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 rounded-xs leading-relaxed animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label 
                htmlFor="admin-email" 
                className="block text-[11px] font-bold tracking-[0.1em] uppercase text-neutral-600 mb-2"
              >
                Owner Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@penny.com"
                className="w-full px-3.5 py-3 text-xs bg-neutral-50/50 border border-neutral-300 rounded-xs focus:bg-white focus:outline-none focus:border-brand-charcoal transition-colors"
              />
            </div>

            <div>
              <label 
                htmlFor="admin-password" 
                className="block text-[11px] font-bold tracking-[0.1em] uppercase text-neutral-600 mb-2"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-3 text-xs bg-neutral-50/50 border border-neutral-300 rounded-xs focus:bg-white focus:outline-none focus:border-brand-charcoal transition-colors font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 bg-brand-charcoal hover:bg-black text-white text-xs font-bold tracking-[0.2em] uppercase rounded-xs transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In To Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Security Policy Reminder */}
          <div className="mt-6 pt-6 border-t border-neutral-100 text-center">
            <p className="text-[11px] text-neutral-400 leading-normal">
              Single-owner security policy is enforced. Public administrator self-registration is permanently disabled.
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-brand-charcoal tracking-wide transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
