import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [token, setToken] = useState(tokenParam);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
    if (tokenParam) setToken(tokenParam);
  }, [emailParam, tokenParam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!email.trim()) {
      setErrorMsg('Email address is required.');
      return;
    }

    if (!token.trim() && !code.trim()) {
      setErrorMsg('Reset token or 6-digit verification code is required.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify both passwords match.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          token: token.trim() || undefined,
          code: code.trim() || undefined,
          newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to reset password. The link or code may have expired.');
      }

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/account/login');
      }, 3000);
    } catch (err) {
      console.error('Reset password error:', err);
      setErrorMsg(err.message || 'An error occurred while resetting your password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-16 px-4 md:px-8 max-w-md mx-auto min-h-[70vh] flex flex-col justify-center font-sans">
      <div className="bg-white border border-brand-charcoal/10 p-6 md:p-8 rounded-xs shadow-xs">
        
        {isSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-brand-charcoal">
              Password Reset Complete
            </h1>
            <p className="text-xs text-neutral-600 font-serif">
              Your password has been successfully updated. You can now use your new password to sign in.
            </p>
            <p className="text-[11px] text-neutral-400">
              Redirecting you to sign in in 3 seconds...
            </p>
            <div className="pt-2">
              <Link 
                to="/account/login" 
                className="inline-block w-full bg-brand-charcoal text-white text-xs font-bold uppercase tracking-widest py-3 px-6 hover:bg-black transition-colors rounded-xs"
              >
                Sign In Now
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <div className="w-10 h-10 bg-brand-offwhite text-brand-charcoal rounded-full flex items-center justify-center mx-auto mb-3 border border-brand-charcoal/10">
                <KeyRound className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold uppercase tracking-wider text-brand-charcoal">
                Create New Password
              </h1>
              <p className="text-xs text-neutral-500 font-serif mt-1">
                Enter your account email and your new password below.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Account Email Address
                </label>
                <input 
                  type="email" 
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-neutral-300 p-3 text-xs focus:outline-none focus:border-brand-charcoal rounded-xs"
                />
              </div>

              {!token && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    6-Digit Verification Code
                  </label>
                  <input 
                    type="text" 
                    placeholder="123456"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full border border-neutral-300 p-3 text-sm tracking-widest font-mono text-center focus:outline-none focus:border-brand-charcoal rounded-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  New Password
                </label>
                <input 
                  type="password" 
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-neutral-300 p-3 text-xs focus:outline-none focus:border-brand-charcoal rounded-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Confirm New Password
                </label>
                <input 
                  type="password" 
                  placeholder="Re-enter your new password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-neutral-300 p-3 text-xs focus:outline-none focus:border-brand-charcoal rounded-xs"
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-charcoal text-white py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors rounded-xs shadow-xs disabled:opacity-50 cursor-pointer mt-2"
              >
                {isSubmitting ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-neutral-100 text-center">
              <Link to="/account/login" className="text-xs text-neutral-500 hover:text-black underline underline-offset-4">
                Back to sign in
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
