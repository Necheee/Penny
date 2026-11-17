import { useState } from 'react';
import { Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get('redirect') || '/account';

  // If already logged in, navigate to target or account
  if (user) {
    return <Navigate to={redirectUrl} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await login(email, password);
      navigate(redirectUrl);
    } catch (err) {
      console.error('Sign-in error:', err);
      setErrorMsg(err.message || 'Unable to sign in. Please check your credentials and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-16 px-4 md:px-8 max-w-lg mx-auto min-h-[70vh] flex flex-col justify-center">
      <h1 className="text-2xl font-light mb-8 text-center">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="email" 
          placeholder="Email address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-neutral-300 p-3 text-[13px] focus:outline-none focus:border-black"
        />
        <input 
          type="password" 
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-neutral-300 p-3 text-[13px] focus:outline-none focus:border-black"
        />
        <div className="flex justify-between items-center mt-2 mb-6">
          <Link to="/account/forgot-password" className="text-[12px] text-neutral-500 hover:text-black underline-offset-4 hover:underline">
            Forgot your password?
          </Link>
        </div>
        {errorMsg && (
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xs">
            {errorMsg}
          </p>
        )}
        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-black text-white px-8 py-3 text-[13px] font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      <div className="mt-8 text-center">
        <Link to={`/create-account${redirectUrl !== '/account' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`} className="text-[13px] underline underline-offset-4 hover:text-neutral-600 transition-colors">
          Create account
        </Link>
      </div>
    </div>
  );
}
