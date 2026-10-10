import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CreateAccount() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { createAccount } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    createAccount({ firstName, lastName, email });
    navigate('/account');
  };

  return (
    <div className="pt-32 pb-16 px-4 md:px-8 max-w-lg mx-auto min-h-[70vh] flex flex-col justify-center">
      <h1 className="text-2xl font-light mb-8 text-center">Create Account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="text" 
          placeholder="First name"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full border border-neutral-300 p-3 text-[13px] focus:outline-none focus:border-black"
        />
        <input 
          type="text" 
          placeholder="Last name"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full border border-neutral-300 p-3 text-[13px] focus:outline-none focus:border-black"
        />
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
        
        <button 
          type="submit"
          className="w-full bg-black text-white px-8 py-3 text-[13px] font-medium hover:bg-neutral-800 transition-colors mt-6"
        >
          Create
        </button>
      </form>
      <div className="mt-8 text-center">
        <Link to="/account/login" className="text-[13px] underline underline-offset-4 hover:text-neutral-600 transition-colors">
          Return to login
        </Link>
      </div>
    </div>
  );
}
