import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="pt-32 pb-16 px-4 md:px-8 max-w-lg mx-auto min-h-[70vh] flex flex-col justify-center">
      <h1 className="text-2xl font-light mb-4 text-center">Reset your password</h1>
      <p className="text-center text-[13px] text-neutral-500 mb-8">
        We will send you an email to reset your password.
      </p>
      
      {submitted ? (
        <div className="text-center p-6 bg-neutral-50 border border-neutral-200">
          <p className="text-[13px] font-medium mb-4">Reset link sent to {email}</p>
          <Link to="/account/login" className="text-[13px] underline underline-offset-4">
            Return to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-neutral-300 p-3 text-[13px] focus:outline-none focus:border-black"
          />
          <button 
            type="submit"
            className="w-full bg-black text-white px-8 py-3 text-[13px] font-medium hover:bg-neutral-800 transition-colors mt-2"
          >
            Submit
          </button>
        </form>
      )}
      
      {!submitted && (
        <div className="mt-8 text-center flex flex-col gap-3">
          <Link to="/account/login" className="text-[13px] underline underline-offset-4 hover:text-neutral-600 transition-colors">
            Cancel
          </Link>
        </div>
      )}
    </div>
  );
}
