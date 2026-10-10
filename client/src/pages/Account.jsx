import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  // If not logged in, redirect
  if (!user) {
    return <Navigate to="/account/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="pt-32 pb-16 px-4 md:px-8 max-w-7xl mx-auto min-h-[70vh]">
      <div className="flex flex-col md:flex-row gap-12">
        
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 shrink-0">
          <h1 className="text-2xl font-light mb-8">My Account</h1>
          <nav className="flex flex-col space-y-4">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`text-left text-[13px] hover:underline underline-offset-4 ${activeTab === 'profile' ? 'font-medium underline' : 'text-neutral-500'}`}
            >
              Profile
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`text-left text-[13px] hover:underline underline-offset-4 ${activeTab === 'orders' ? 'font-medium underline' : 'text-neutral-500'}`}
            >
              Order History
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`text-left text-[13px] hover:underline underline-offset-4 ${activeTab === 'settings' ? 'font-medium underline' : 'text-neutral-500'}`}
            >
              Settings
            </button>
            <button 
              onClick={handleLogout}
              className="text-left text-[13px] text-neutral-500 hover:text-black hover:underline underline-offset-4 pt-4 mt-4 border-t border-neutral-200"
            >
              Log out
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-lg font-medium mb-6">Profile Details</h2>
              <div className="space-y-4 text-[13px]">
                <div>
                  <p className="text-neutral-500 mb-1">Name</p>
                  <p>{user.firstName} {user.lastName}</p>
                </div>
                <div>
                  <p className="text-neutral-500 mb-1">Email</p>
                  <p>{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h2 className="text-lg font-medium mb-6">Order History</h2>
              <p className="text-[13px] text-neutral-500">You haven't placed any orders yet.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-lg font-medium mb-6">Settings</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-[13px] font-medium mb-2">Password</h3>
                  <button className="text-[13px] underline underline-offset-4">Change Password</button>
                </div>
                <div>
                  <h3 className="text-[13px] font-medium mb-2">Addresses</h3>
                  <button className="text-[13px] underline underline-offset-4">Manage Addresses</button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
