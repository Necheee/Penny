import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertCircle, ArrowLeft, KeyRound, Mail } from 'lucide-react';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email entry, 2: Code & new password, 3: Success
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [devCode, setDevCode] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to account
  if (user) {
    return <Navigate to="/account" replace />;
  }

  // Step 1: Check email existence & dispatch reset code
  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMsg('Please enter a valid standard email address (e.g. name@example.com).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'No account found with this email address. Please check your spelling or register.');
      }

      setStep(2);
      setSuccessMsg(data.message || `A 6-digit verification code has been dispatched to ${cleanEmail}.`);
      if (data.devCode) {
        setDevCode(data.devCode);
        if (!data.liveEmailSent) {
          setCode(data.devCode); // Auto-fill in local dev only if real email is not active
        }
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setErrorMsg(err.message || 'Could not verify email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Validate code and set new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!code.trim()) {
      setErrorMsg('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please ensure both passwords match.');
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
          code: code.trim(),
          newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid or expired verification code. Please try again.');
      }

      setStep(3);
      setSuccessMsg('Your password has been reset successfully!');
      setTimeout(() => {
        navigate('/account/login');
      }, 3000);
    } catch (err) {
      console.error('Password reset execution error:', err);
      setErrorMsg(err.message || 'Failed to reset password. Please check your code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-16 px-4 md:px-8 max-w-md mx-auto min-h-[70vh] flex flex-col justify-center font-sans">
      <div className="bg-white border border-brand-charcoal/10 p-6 md:p-8 rounded-xs shadow-xs">
        
        {/* Step 3: Success Screen */}
        {step === 3 ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-brand-charcoal">
              Password Reset
            </h1>
            <p className="text-xs text-neutral-600 font-serif">
              {successMsg}
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
        ) : step === 2 ? (
          /* Step 2: Enter Code & New Password */
          <div>
            <div className="text-center mb-6">
              <div className="w-10 h-10 bg-brand-offwhite text-brand-charcoal rounded-full flex items-center justify-center mx-auto mb-3 border border-brand-charcoal/10">
                <KeyRound className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold uppercase tracking-wider text-brand-charcoal">
                Enter Reset Code
              </h1>
              <p className="text-xs text-neutral-500 font-serif mt-1">
                Enter the 6-digit verification code sent to <strong className="font-sans text-brand-charcoal">{email}</strong>
              </p>
            </div>

            {devCode && (
              <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xs flex items-center justify-between">
                <span>Dev Preview Code: <strong>{devCode}</strong></span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-xs">Auto-filled</span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xs">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  6-Digit Verification Code
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. 123456"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full border border-neutral-300 p-3 text-sm tracking-widest font-mono text-center focus:outline-none focus:border-brand-charcoal rounded-xs"
                />
              </div>

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
                {isSubmitting ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs">
              <button 
                type="button" 
                onClick={() => { setStep(1); setErrorMsg(''); }}
                className="text-neutral-500 hover:text-black flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Change email
              </button>
              <Link to="/account/login" className="text-neutral-500 hover:text-black underline underline-offset-4">
                Back to sign in
              </Link>
            </div>
          </div>
        ) : (
          /* Step 1: Email Verification Form */
          <div>
            <div className="text-center mb-6">
              <div className="w-10 h-10 bg-brand-offwhite text-brand-charcoal rounded-full flex items-center justify-center mx-auto mb-3 border border-brand-charcoal/10">
                <Mail className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold uppercase tracking-wider text-brand-charcoal">
                Reset Password
              </h1>
              <p className="text-xs text-neutral-500 font-serif mt-1">
                Enter your account email. We will check if it exists and send you a secure verification code.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Account Email Address
                </label>
                <input 
                  type="email" 
                  placeholder="e.g. name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-neutral-300 p-3 text-xs focus:outline-none focus:border-brand-charcoal rounded-xs"
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-charcoal text-white py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors rounded-xs shadow-xs disabled:opacity-50 cursor-pointer mt-2"
              >
                {isSubmitting ? 'Checking Account...' : 'Send Reset Code'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-neutral-100 text-center">
              <Link to="/account/login" className="text-xs text-neutral-500 hover:text-black underline underline-offset-4">
                Remember your password? Sign in
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
