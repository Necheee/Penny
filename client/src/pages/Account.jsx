import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  User, 
  ShoppingBag, 
  MapPin, 
  Lock, 
  LogOut, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Check, 
  ChevronRight, 
  Package, 
  ArrowRight, 
  Edit2, 
  Clock, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Bell, 
  Printer, 
  Truck, 
  Mail, 
  Palette, 
  MessageSquare 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { printOrderReceipt } from '../utils/printReceipt';
import FormattedMessage from '../components/common/FormattedMessage';
import { useDialog } from '../context/DialogContext';

export default function Account() {
  const { user, logout, updateProfile, updateAddresses, deleteAccount, refreshProfile, changePassword } = useAuth();
  const { markAllAsSeen, refreshNotifications, hasUnreadNotifications } = useNotifications();
  const { confirm, alert: showAlertDialog } = useDialog();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlTab = new URLSearchParams(window.location.search).get('tab');
      if (urlTab) return urlTab;
      const saved = sessionStorage.getItem('penny_account_tab');
      if (saved) return saved;
    }
    return 'profile';
  });

  // Listen to search param updates (e.g. clicking the navbar notification bell icon)
  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Mark notifications seen when activeTab is notifications
  useEffect(() => {
    if (activeTab === 'notifications') {
      markAllAsSeen?.();
    }
  }, [activeTab, markAllAsSeen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('penny_account_tab', activeTab);
      const url = new URL(window.location.href);
      if (url.searchParams.get('tab') !== activeTab) {
        url.searchParams.set('tab', activeTab);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [activeTab]);

  // Address Management State
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    fullName: user ? `${user.firstName} ${user.lastName}`.trim() : '',
    street: '',
    city: 'Lagos',
    state: 'Lagos',
  });

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordFeedback, setPasswordFeedback] = useState({ type: '', text: '' });
  const [profileFeedback, setProfileFeedback] = useState('');

  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user?.firstName, user?.lastName, user?.email, user?.phone]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!profileForm.email || !emailRegex.test(profileForm.email.trim())) {
      setProfileFeedback('Please enter a valid standard email address (e.g. name@example.com).');
      return;
    }

    if (profileForm.phone && /[a-zA-Z]/.test(profileForm.phone)) {
      setProfileFeedback('Phone number cannot contain letters.');
      return;
    }

    const cleanDigits = profileForm.phone ? profileForm.phone.replace(/\D/g, '') : '';
    if (profileForm.phone && cleanDigits.length < 7) {
      setProfileFeedback('Please enter a valid phone number (digits only, at least 7 numbers).');
      return;
    }

    await updateProfile({
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
      email: profileForm.email.trim().toLowerCase(),
      phone: profileForm.phone.trim(),
    });
    setIsEditingProfile(false);
    setProfileFeedback('Profile details and email address successfully updated.');
    setTimeout(() => setProfileFeedback(''), 4000);

    // Refresh orders and inquiries under the updated email
    setTimeout(() => {
      fetchUserOrders();
      fetchUserInquiries();
      refreshNotifications?.();
    }, 300);
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!newAddress.street.trim()) return;

    const currentAddresses = user.addresses || [];
    const created = {
      id: `addr_${Date.now()}`,
      label: newAddress.label || 'Home',
      fullName: newAddress.fullName || `${user.firstName} ${user.lastName}`,
      street: newAddress.street.trim(),
      city: newAddress.city.trim() || 'Lagos',
      state: newAddress.state.trim() || 'Lagos',
      isDefault: currentAddresses.length === 0,
    };

    updateAddresses([...currentAddresses, created]);
    setIsAddingAddress(false);
    setNewAddress({
      label: 'Home',
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      street: '',
      city: 'Lagos',
      state: 'Lagos',
    });
  };

  const handleDeleteAddress = (id) => {
    const currentAddresses = user.addresses || [];
    const filtered = currentAddresses.filter(a => a.id !== id);
    updateAddresses(filtered);
  };

  const handleSetDefaultAddress = (id) => {
    const currentAddresses = user.addresses || [];
    const updated = currentAddresses.map(a => ({
      ...a,
      isDefault: a.id === id,
    }));
    updateAddresses(updated);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordFeedback({ type: '', text: '' });

    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordFeedback({ type: 'success', text: 'Your password has been securely updated and hashed.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordFeedback({ type: '', text: '' }), 5000);
    } catch (err) {
      setPasswordFeedback({ type: 'error', text: err.message || 'Could not update password. Please check your current password.' });
    }
  };

  // Order History State
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const fetchUserOrders = async (isSilent = false) => {
    if (!isSilent && orders.length === 0) {
      setIsLoadingOrders(true);
    }
    try {
      let backendOrders = [];
      const userEmail = (user?.email || '').toLowerCase().trim();
      const userFullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
      const userId = user?.id || '';

      // 1. Direct query to my-orders (matches by user_id in DB, email, or customer name)
      try {
        const queryParams = new URLSearchParams();
        if (userEmail) queryParams.append('email', userEmail);
        if (userId) queryParams.append('userId', userId);
        if (userFullName) queryParams.append('customer', userFullName);

        const res = await fetch(`/api/payments/my-orders?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          backendOrders = Array.isArray(data.data) ? data.data : [];
        }
      } catch (apiErr) {
        console.warn('Could not fetch server orders via my-orders, falling back:', apiErr);
      }

      // 2. Fallback to general orders query if needed
      if (backendOrders.length === 0) {
        try {
          const res = await fetch('/api/payments/orders');
          if (res.ok) {
            const data = await res.json();
            const allOrders = Array.isArray(data.data) ? data.data : [];
            backendOrders = allOrders.filter(ord => {
              const orderEmail = (ord.email || '').toLowerCase().trim();
              const orderCustomer = (ord.customer || '').toLowerCase().trim();
              if (userId && ord.userId && ord.userId === userId) return true;
              if (userEmail && orderEmail && orderEmail === userEmail) return true;
              if (userFullName && orderCustomer && (orderCustomer.includes(userFullName.toLowerCase()) || userFullName.toLowerCase().includes(orderCustomer))) return true;
              return false;
            });
          }
        } catch (apiErr) {}
      }

      // Filter by logged-in user email, userId or matching customer full name
      const userOrders = backendOrders.filter(ord => {
        const orderEmail = (ord.email || '').toLowerCase().trim();
        const orderCustomer = (ord.customer || '').toLowerCase().trim();

        if (userId && ord.userId && ord.userId === userId) return true;
        if (userEmail && orderEmail && orderEmail === userEmail) return true;
        if (userFullName && orderCustomer && (orderCustomer === userFullName.toLowerCase() || orderCustomer.includes(userFullName.toLowerCase()) || userFullName.toLowerCase().includes(orderCustomer))) return true;
        return false;
      });

      // Sort newest first
      userOrders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setOrders(userOrders);
    } catch (err) {
      console.error('Error loading order history:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Support inquiries & custom color requests submitted by this user
  const [userInquiries, setUserInquiries] = useState([]);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);
  const [messageFilter, setMessageFilter] = useState('all');

  const [dismissedNotifications, setDismissedNotifications] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('penny_dismissed_notifications') || '[]');
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Sync cloud notifications state across devices
  const loadCloudNotificationsState = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/auth/notifications-state?email=${encodeURIComponent(user.email || '')}&userId=${encodeURIComponent(user.id || '')}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.dismissedNotifications)) {
          setDismissedNotifications(prev => {
            const merged = Array.from(new Set([...prev, ...data.dismissedNotifications]));
            localStorage.setItem('penny_dismissed_notifications', JSON.stringify(merged));
            return merged;
          });
        }
      }
    } catch (e) {}
  }, [user?.email, user?.id]);

  const handleSyncStatus = async () => {
    setIsLoadingOrders(true);
    try {
      if (refreshProfile) {
        await refreshProfile();
      }
      await loadCloudNotificationsState();
      await fetchUserOrders(true);
      await fetchUserInquiries(true);
      refreshNotifications?.();
    } catch (e) {
      console.warn('Sync status error:', e);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    const shouldDelete = await confirm({
      title: `Delete Order #${orderId}`,
      message: `Are you sure you want to remove this order from your personal order history?`,
      confirmText: 'Delete Order',
      cancelText: 'Keep',
      isDestructive: true,
    });
    if (!shouldDelete) return;

    try {
      const response = await fetch(`/api/payments/orders/${orderId}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'The order could not be deleted.');
      }
      setOrders(prev => prev.filter(o => o.id !== orderId));
      refreshNotifications?.();
      window.dispatchEvent(new Event('penny_notifications_updated'));
    } catch (e) {
      console.error('Backend order delete error:', e);
      showAlertDialog(e.message || 'The order could not be deleted.');
    }
  };

  const handleDismissNotification = async (orderId) => {
    const shouldDismiss = await confirm({
      title: 'Clear Delivery Notification',
      message: `Clear the active delivery notification for order #${orderId}? Your order record remains safe in your Order History.`,
      confirmText: 'Clear',
      cancelText: 'Cancel',
      isDestructive: false,
    });
    if (!shouldDismiss) return;

    const updated = Array.from(new Set([...dismissedNotifications, orderId]));
    setDismissedNotifications(updated);
    localStorage.setItem('penny_dismissed_notifications', JSON.stringify(updated));
    refreshNotifications?.();
    window.dispatchEvent(new Event('penny_notifications_updated'));

    // Sync cloud state for cross-device consistency
    try {
      await fetch('/api/auth/notifications-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          userId: user?.id,
          dismissedNotifications: updated,
        }),
      });
    } catch (e) {}
  };

  const handleDeleteInquiry = async (inquiryId) => {
    const shouldDelete = await confirm({
      title: 'Delete Message',
      message: `Are you sure you want to remove inquiry #${inquiryId} from your messages?`,
      confirmText: 'Delete',
      cancelText: 'Keep',
      isDestructive: true,
    });
    if (!shouldDelete) return;

    setUserInquiries(prev => prev.filter(i => i.id !== inquiryId));
    refreshNotifications?.();
    window.dispatchEvent(new Event('penny_notifications_updated'));
    try {
      await fetch(`/api/contact/messages/${inquiryId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Backend inquiry delete error:', e);
    }
  };

  const fetchUserInquiries = async (isSilent = false) => {
    if (!user?.email) return;
    try {
      if (!isSilent && userInquiries.length === 0) {
        setIsLoadingInquiries(true);
      }
      const res = await fetch(`/api/contact/my-inquiries?email=${encodeURIComponent(user.email)}&userId=${encodeURIComponent(user.id || '')}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const cloudList = data.data;
          setUserInquiries(cloudList);
          try {
            localStorage.setItem('penny_my_inquiries', JSON.stringify(cloudList));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Could not fetch user inquiries:', err);
    } finally {
      setIsLoadingInquiries(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadCloudNotificationsState();
      fetchUserOrders(false);
      fetchUserInquiries(false);

      // Silent background poll every 12s to keep statuses and dismissed notifications live across devices
      const interval = setInterval(() => {
        loadCloudNotificationsState();
        fetchUserOrders(true);
        fetchUserInquiries(true);
      }, 12000);

      const onFocus = () => {
        loadCloudNotificationsState();
        fetchUserOrders(true);
        fetchUserInquiries(true);
      };
      window.addEventListener('focus', onFocus);

      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', onFocus);
      };
    }
  }, [user?.email, user?.id, loadCloudNotificationsState]);

  useEffect(() => {
    const handleInquirySync = () => {
      fetchUserInquiries(true);
    };
    window.addEventListener('penny_inquiry_sent', handleInquirySync);
    window.addEventListener('penny_inquiry_updated', handleInquirySync);
    return () => {
      window.removeEventListener('penny_inquiry_sent', handleInquirySync);
      window.removeEventListener('penny_inquiry_updated', handleInquirySync);
    };
  }, [user?.email, user?.id]);

  // If not logged in, redirect after all hooks have been declared.
  if (!user) {
    return <Navigate to="/account/login" replace />;
  }

  const repliedInquiriesCount = userInquiries.filter(i => i.status === 'replied').length;

  const navItems = [
    { id: 'profile', label: 'Personal Details', shortLabel: 'Details', icon: User, desc: 'Name, email, contact phone' },
    { id: 'orders', label: 'Order History', shortLabel: 'Orders', icon: ShoppingBag, desc: 'Purchases & itemized breakdown' },
    { id: 'messages', label: 'Messages & Requests', shortLabel: 'Messages', icon: Mail, desc: 'Custom color requests & PENNY responses', count: userInquiries.length, repliedCount: repliedInquiriesCount },
    { id: 'notifications', label: 'Order Notifications', shortLabel: 'Notifications', icon: Bell, desc: 'Real-time order confirmation & delivery status' },
    { id: 'addresses', label: 'Saved Addresses', shortLabel: 'Addresses', icon: MapPin, desc: 'Shipping & delivery destinations' },
    { id: 'security', label: 'Security & Password', shortLabel: 'Security', icon: Lock, desc: 'Password and session security' },
  ];

  return (
    <div className="bg-[#FAF9F6] min-h-screen text-brand-charcoal font-sans pt-28 pb-24 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Luxury Account Header */}
        <div className="border-b border-brand-charcoal/10 pb-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-brand-taupe font-sans">
                PENNY Client Portal
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-light text-brand-charcoal">
              Welcome, {user.firstName || 'Client'} {user.lastName || ''}
            </h1>
            <p className="text-xs text-brand-charcoal/60 mt-1 font-serif">
              {user.email} • Member since {new Date().getFullYear()}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-brand-charcoal/60 hover:text-black py-2 px-4 border border-brand-charcoal/20 hover:border-black rounded-xs transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>

        {/* Mobile Horizontal Tab Navigation (Clean, compact, no giant stacked sidebar at top of screen) */}
        <div className="lg:hidden mb-6 -mx-4 px-4 overflow-x-auto flex items-center gap-2 pb-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xs text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer relative ${
                  isActive 
                    ? 'bg-brand-charcoal text-white shadow-xs' 
                    : 'bg-white text-brand-charcoal/70 border border-brand-charcoal/15 hover:text-black hover:bg-neutral-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-brand-taupe'}`} />
                <span>{item.shortLabel || item.label}</span>
                {item.id === 'messages' && item.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${isActive ? 'bg-white text-black' : 'bg-neutral-200 text-neutral-800'}`}>
                    {item.count}
                  </span>
                )}
                {item.id === 'notifications' && hasUnreadNotifications && (
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Navigation Sidebar (Desktop Only) */}
          <aside className="hidden lg:block lg:col-span-4 bg-white border border-brand-charcoal/10 rounded-xs p-3 shadow-xs">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left p-3.5 rounded-xs transition-all flex items-start gap-3 cursor-pointer ${
                      isActive 
                        ? 'bg-brand-charcoal text-white shadow-xs' 
                        : 'hover:bg-brand-offwhite text-brand-charcoal'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-white' : 'text-brand-taupe'}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider">
                          {item.label}
                        </p>
                        {item.id === 'messages' && item.count > 0 && (
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'}`}>
                            {item.count}
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] mt-0.5 font-serif ${isActive ? 'text-white/70' : 'text-brand-charcoal/50'}`}>
                        {item.desc}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 self-center ${isActive ? 'text-white' : 'text-neutral-300'}`} />
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 pt-6 border-t border-brand-charcoal/10 p-3 bg-brand-offwhite rounded-xs">
              <div className="flex items-center gap-2 text-brand-charcoal">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Personal Data Protection</span>
              </div>
              <p className="text-[11px] text-brand-charcoal/60 font-serif mt-1">
                Your personal preferences, measurement records, and payment credentials are encrypted and stored privately.
              </p>
            </div>
          </aside>

          {/* Dynamic Content Panel */}
          <main className="w-full lg:col-span-8 bg-white border border-brand-charcoal/10 rounded-xs p-6 md:p-8 shadow-xs min-h-[460px]">
            
            {/* TAB 1: PROFILE DETAILS */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center border-b border-brand-charcoal/10 pb-4">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-brand-charcoal">
                      Personal Details
                    </h2>
                    <p className="text-xs text-brand-charcoal/60 font-serif mt-0.5">
                      Review and manage your profile identity and contact information.
                    </p>
                  </div>
                  {!isEditingProfile && (
                    <button
                      onClick={() => {
                        setProfileForm({
                          firstName: user.firstName || '',
                          lastName: user.lastName || '',
                          email: user.email || '',
                          phone: user.phone || '',
                        });
                        setIsEditingProfile(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-charcoal border border-brand-charcoal/20 hover:border-black rounded-xs transition-colors"
                    >
                      <Edit2 className="w-3 h-3" /> Edit Profile
                    </button>
                  )}
                </div>

                {profileFeedback && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xs flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{profileFeedback}</span>
                  </div>
                )}

                {!isEditingProfile ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    <div className="p-4 bg-brand-offwhite/50 border border-brand-charcoal/10 rounded-xs">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-taupe block mb-1">
                        Full Name
                      </span>
                      <p className="text-base font-serif font-medium text-brand-charcoal">
                        {user.firstName || 'Not Specified'} {user.lastName || ''}
                      </p>
                    </div>

                    <div className="p-4 bg-brand-offwhite/50 border border-brand-charcoal/10 rounded-xs">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-taupe block mb-1">
                        Email Address
                      </span>
                      <p className="text-base font-serif font-medium text-brand-charcoal">
                        {user.email}
                      </p>
                    </div>

                    <div className="p-4 bg-brand-offwhite/50 border border-brand-charcoal/10 rounded-xs">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-taupe block mb-1">
                        Phone Number
                      </span>
                      <p className="text-base font-serif font-medium text-brand-charcoal">
                        {user.phone || 'No phone number provided'}
                      </p>
                    </div>

                    <div className="p-4 bg-brand-offwhite/50 border border-brand-charcoal/10 rounded-xs">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-taupe block mb-1">
                        Account Status
                      </span>
                      <p className="text-base font-serif font-medium text-emerald-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Verified Client
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                          className="w-full border border-brand-charcoal/20 p-2.5 text-xs focus:outline-none focus:border-brand-charcoal rounded-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                          className="w-full border border-brand-charcoal/20 p-2.5 text-xs focus:outline-none focus:border-brand-charcoal rounded-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        placeholder="client@example.com"
                        className="w-full border border-brand-charcoal/20 p-2.5 text-xs focus:outline-none focus:border-brand-charcoal rounded-xs"
                      />
                      <p className="text-[10px] text-neutral-400 font-serif mt-1">
                        Changing your email address synchronizes your order history and support correspondence automatically.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value.replace(/[^\d+()-\s]/g, '') })}
                        placeholder="+234 800 000 0000"
                        className="w-full border border-brand-charcoal/20 p-2.5 text-xs focus:outline-none focus:border-brand-charcoal rounded-xs"
                      />
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-brand-charcoal/10">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-brand-charcoal text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors rounded-xs"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2.5 border border-brand-charcoal/20 text-xs font-bold uppercase tracking-wider hover:border-black transition-colors rounded-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: SAVED ADDRESSES */}
            {activeTab === 'addresses' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center border-b border-brand-charcoal/10 pb-4">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-brand-charcoal">
                      Address Book
                    </h2>
                    <p className="text-xs text-brand-charcoal/60 font-serif mt-0.5">
                      Save delivery addresses for faster single-click checkout.
                    </p>
                  </div>
                  {!isAddingAddress && (
                    <button
                      onClick={() => setIsAddingAddress(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-charcoal text-white text-xs font-bold uppercase tracking-wider rounded-xs hover:bg-black transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Address
                    </button>
                  )}
                </div>

                {/* Add Address Form Modal / Drawer */}
                {isAddingAddress && (
                  <form onSubmit={handleAddAddress} className="p-5 bg-brand-offwhite border border-brand-charcoal/20 rounded-xs space-y-4 text-xs font-sans">
                    <h3 className="font-bold uppercase tracking-wider text-xs">New Delivery Destination</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                          Address Label (e.g. Home, Office)
                        </label>
                        <input
                          type="text"
                          value={newAddress.label}
                          onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                          className="w-full bg-white border border-brand-charcoal/20 p-2.5 rounded-xs focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                          Recipient Full Name
                        </label>
                        <input
                          type="text"
                          value={newAddress.fullName}
                          onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                          className="w-full bg-white border border-brand-charcoal/20 p-2.5 rounded-xs focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={newAddress.street}
                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                        placeholder="e.g. 14 Victoria Island Crescent, Apt 4B"
                        className="w-full bg-white border border-brand-charcoal/20 p-2.5 rounded-xs focus:outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          className="w-full bg-white border border-brand-charcoal/20 p-2.5 rounded-xs focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                          className="w-full bg-white border border-brand-charcoal/20 p-2.5 rounded-xs focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2 bg-brand-charcoal text-white text-xs font-bold uppercase tracking-wider hover:bg-black rounded-xs"
                      >
                        Save Address
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingAddress(false)}
                        className="px-4 py-2 border border-brand-charcoal/20 text-xs font-bold uppercase tracking-wider rounded-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Addresses List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(user.addresses && user.addresses.length > 0) ? (
                    user.addresses.map((addr) => (
                      <div 
                        key={addr.id} 
                        className={`p-5 border rounded-xs relative transition-all ${
                          addr.isDefault 
                            ? 'border-brand-charcoal bg-white ring-1 ring-brand-charcoal' 
                            : 'border-brand-charcoal/15 bg-brand-offwhite/30'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal bg-neutral-100 px-2 py-0.5 rounded-xs">
                            {addr.label}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                              <Check className="w-3 h-3" /> Default
                            </span>
                          )}
                        </div>

                        <p className="font-bold text-xs text-brand-charcoal mt-2">{addr.fullName}</p>
                        <p className="text-xs text-brand-charcoal/70 font-serif mt-1">{addr.street}</p>
                        <p className="text-xs text-brand-charcoal/70 font-serif">{addr.city}, {addr.state}</p>

                        <div className="mt-4 pt-3 border-t border-brand-charcoal/10 flex justify-between items-center text-[11px]">
                          {!addr.isDefault ? (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="font-bold uppercase tracking-wider text-brand-charcoal hover:underline"
                            >
                              Set as Default
                            </button>
                          ) : (
                            <span className="text-brand-charcoal/40 text-[10px]">Primary shipping destination</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-neutral-400 hover:text-red-600 transition-colors"
                            title="Delete Address"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-12 border border-dashed border-neutral-300 p-8 rounded-xs">
                      <MapPin className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">No Addresses Saved Yet</p>
                      <p className="text-xs text-brand-charcoal/60 font-serif mt-1 max-w-sm mx-auto">
                        Add your primary delivery address so your details are automatically filled during checkout.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: ORDER HISTORY */}
            {activeTab === 'orders' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-brand-charcoal/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-brand-charcoal">
                      Order History
                    </h2>
                    <p className="text-xs text-brand-charcoal/60 font-serif mt-0.5">
                      Review past capsule orders, delivery statuses, and verification receipts.
                    </p>
                  </div>
                  <button
                    onClick={handleSyncStatus}
                    disabled={isLoadingOrders}
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-charcoal/70 hover:text-black py-1.5 px-3 border border-brand-charcoal/20 hover:border-black rounded-xs transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                    Refresh Status
                  </button>
                </div>

                {isLoadingOrders ? (
                  <div className="py-16 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-brand-charcoal/40 mx-auto mb-3" />
                    <p className="text-xs uppercase tracking-wider text-brand-charcoal/60 font-bold">
                      Retrieving Client Orders...
                    </p>
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((ord) => {
                      const isExpanded = expandedOrderId === ord.id;
                      const isBankTransfer = ord.paymentMethod === 'bank_transfer';
                      const isAwaiting = ord.status === 'Awaiting Payment' || (!ord.paymentConfirmed && isBankTransfer);

                      return (
                        <div 
                          key={ord.id} 
                          className="border border-brand-charcoal/15 bg-white rounded-xs shadow-2xs overflow-hidden transition-all"
                        >
                          {/* Order Header */}
                          <div className="p-5 border-b border-brand-charcoal/10 bg-[#FAF9F6]/40 flex flex-wrap justify-between items-center gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-brand-charcoal">
                                  #{ord.id}
                                </span>
                                <span className="text-[11px] text-brand-charcoal/50 font-serif">
                                  • {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                                </span>
                              </div>
                              <p className="text-[11px] text-brand-charcoal/60">
                                {ord.items?.length || ord.itemsCount || 1} {(ord.items?.length || ord.itemsCount || 1) === 1 ? 'item' : 'items'} • Standard Luxury Delivery
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xs inline-flex items-center gap-1.5 border ${
                                isAwaiting 
                                  ? 'bg-amber-50 text-amber-900 border-amber-300' 
                                  : ord.status === 'Delivered' 
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
                                  : 'bg-neutral-900 text-white border-neutral-900'
                              }`}>
                                {isAwaiting ? (
                                  <>
                                    <Clock className="w-3 h-3 text-amber-700" />
                                    Awaiting Bank Transfer
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    {ord.status || 'Processing'}
                                  </>
                                )}
                              </span>

                              <button
                                onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                                className="p-1 text-brand-charcoal/60 hover:text-black transition-colors"
                                title="Toggle details"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Items Preview List */}
                          <div className="p-5 space-y-4">
                            {Array.isArray(ord.items) && ord.items.length > 0 ? (
                              <div className="divide-y divide-brand-charcoal/10">
                                {ord.items.map((item, idx) => (
                                  <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={item.image || '/images/products/linen-set-1.jpg'}
                                        alt={item.name}
                                        className="w-14 h-16 object-cover bg-neutral-100 rounded-xs border border-brand-charcoal/10 shrink-0"
                                      />
                                      <div>
                                        <p className="font-bold text-xs text-brand-charcoal leading-tight">
                                          {item.name}
                                        </p>
                                        <div className="text-[11px] text-brand-charcoal/60 font-serif mt-1 flex items-center gap-2 flex-wrap">
                                          {item.size && <span>Size: {item.size}</span>}
                                          {item.color && (
                                            <span className="inline-flex items-center gap-1">
                                              • Color: {item.color}
                                              {item.color.includes('(Custom Color)') && (
                                                <span className="text-[9px] bg-amber-100 text-amber-950 border border-amber-300 px-1 py-0.2 rounded-xs font-sans font-bold uppercase">
                                                  Custom
                                                </span>
                                              )}
                                            </span>
                                          )}
                                          <span>• Qty: {item.quantity || 1}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                      <p className="font-serif font-bold text-xs text-brand-charcoal">
                                        ₦ {Number((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-brand-charcoal/60 font-serif">
                                {ord.itemsCount || 1} items in order package
                              </div>
                            )}

                            {/* Bank transfer payment verification prompt if awaiting */}
                            {isAwaiting && (
                              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xs text-[11px] text-amber-900 leading-relaxed font-serif">
                                <strong className="font-sans font-bold uppercase tracking-wider block text-[10px] text-amber-950 mb-0.5">
                                  Payment Verification in Progress
                                </strong>
                                We are reviewing your bank transfer. Once confirmed by the store administrator, your fulfillment will commence and an official payment receipt will be sent to <strong>{ord.email}</strong>.
                                {ord.transferAccountName && (
                                  <span className="block mt-1 font-sans text-[10px] text-amber-800">
                                    Registered sender account: <strong>{ord.transferAccountName}</strong>
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Detailed Breakdown (When expanded or summary) */}
                            <div className="pt-3 border-t border-brand-charcoal/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                              <div className="text-brand-charcoal/70 font-serif">
                                <span className="font-sans font-bold text-brand-charcoal text-[11px] uppercase tracking-wider block">
                                  Delivery Address
                                </span>
                                {ord.address ? `${ord.address}, ` : ''}{ord.city}, {ord.state}
                              </div>

                              <div className="flex items-center gap-2 sm:self-end">
                                <button
                                  type="button"
                                  onClick={() => printOrderReceipt(ord)}
                                  className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-charcoal hover:bg-brand-charcoal hover:text-white px-3 py-1.5 border border-brand-charcoal/20 rounded-xs transition-colors cursor-pointer"
                                  title="Print or save official receipt"
                                >
                                  <Printer className="w-3.5 h-3.5" /> Print Receipt
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOrder(ord.id)}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 border border-neutral-200 hover:border-red-300 rounded-xs transition-colors cursor-pointer"
                                  title="Delete order from history"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                                <div className="text-right pl-2">
                                  <span className="text-[10px] uppercase tracking-wider text-brand-charcoal/60 block">
                                    Order Total
                                  </span>
                                  <span className="font-serif font-bold text-base text-brand-charcoal">
                                    ₦ {Number(ord.total || 0).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 border border-dashed border-neutral-300 p-8 rounded-xs bg-white">
                    <Package className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-brand-charcoal">No Orders Placed Yet</h3>
                    <p className="text-xs text-brand-charcoal/60 font-serif mt-1 max-w-sm mx-auto mb-6">
                      Your purchase records and receipts will automatically appear here once you place an order.
                    </p>
                    <Link
                      to="/shop"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-brand-charcoal text-white text-xs font-bold uppercase tracking-[0.15em] hover:bg-black transition-colors rounded-xs"
                    >
                      Browse Capsule <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* TAB: MESSAGES, CUSTOM REQUESTS & PENNY TEAM RESPONSES */}
            {activeTab === 'messages' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-brand-charcoal/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-brand-charcoal flex items-center gap-2">
                      <Mail className="w-4 h-4 text-brand-taupe" />
                      Messages & Custom Color Requests
                    </h2>
                    <p className="text-xs text-brand-charcoal/60 font-serif mt-0.5">
                      Every sent request and received response from the PENNY team is saved here in your Client Portal.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchUserInquiries}
                      disabled={isLoadingInquiries}
                      className="p-2 border border-brand-charcoal/20 hover:border-black rounded-xs text-xs text-brand-charcoal flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Refresh Messages"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingInquiries ? 'animate-spin' : ''}`} />
                      <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Refresh</span>
                    </button>

                    <Link
                      to="/contact"
                      className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal border border-brand-charcoal/20 hover:border-black hover:bg-black hover:text-white px-3 py-2 rounded-xs transition-colors"
                    >
                      New Inquiry &rarr;
                    </Link>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2 border-b border-brand-charcoal/10 pb-3">
                  {[
                    { id: 'all', label: `All (${userInquiries.length})` },
                    { id: 'custom_color', label: `Custom Colors (${userInquiries.filter(i => i.type === 'custom_color' || i.orderNumber?.startsWith('COLOR')).length})` },
                    { id: 'replied', label: `Replied (${userInquiries.filter(i => i.status === 'replied').length})` },
                    { id: 'pending', label: `Pending (${userInquiries.filter(i => i.status !== 'replied').length})` },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setMessageFilter(tab.id)}
                      className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xs transition-all cursor-pointer ${
                        messageFilter === tab.id
                          ? 'bg-brand-charcoal text-white shadow-xs'
                          : 'bg-white border border-brand-charcoal/15 text-brand-charcoal/70 hover:border-brand-charcoal'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Messages Content */}
                {isLoadingInquiries ? (
                  <div className="py-12 text-center text-xs text-neutral-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    Loading your messages and PENNY team replies...
                  </div>
                ) : userInquiries.length === 0 ? (
                  <div className="bg-white border border-dashed border-neutral-300 rounded-xs p-10 text-center text-neutral-400">
                    <Mail className="w-8 h-8 mx-auto mb-2 opacity-40 text-brand-charcoal" />
                    <p className="font-bold uppercase tracking-wider text-xs text-brand-charcoal">No Messages Yet</p>
                    <p className="text-xs font-serif mt-1 text-brand-charcoal/60 max-w-md mx-auto">
                      When you request a custom color on any piece or send a message to the store, all your communications and the PENNY team's replies are securely saved here.
                    </p>
                    <Link
                      to="/shop"
                      className="inline-block mt-4 px-4 py-2 bg-brand-charcoal text-white text-[10px] font-bold uppercase tracking-wider hover:bg-black transition-colors rounded-xs"
                    >
                      Browse Capsule Pieces
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userInquiries
                      .filter(inq => {
                        const isCustom = inq.type === 'custom_color' || inq.orderNumber?.startsWith('COLOR');
                        if (messageFilter === 'custom_color') return isCustom;
                        if (messageFilter === 'replied') return inq.status === 'replied';
                        if (messageFilter === 'pending') return inq.status !== 'replied';
                        return true;
                      })
                      .map(inq => {
                        const isCustom = inq.type === 'custom_color' || inq.orderNumber?.startsWith('COLOR');
                        const isReplied = inq.status === 'replied';
                        return (
                          <div key={inq.id} className="border border-brand-charcoal/15 bg-white rounded-xs p-5 shadow-xs transition-all">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-charcoal/10 pb-3 mb-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-xs text-brand-charcoal">#{inq.id}</span>
                                <span className="text-[11px] text-neutral-400 font-serif">
                                  • {new Date(inq.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isCustom ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-amber-50 text-amber-900 border border-amber-200">
                                    <Palette className="w-2.5 h-2.5" /> Custom Color Request
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-neutral-100 text-neutral-800 border border-neutral-200">
                                    Inquiry
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-xs border ${
                                  isReplied
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}>
                                  {isReplied ? '✓ Replied by PENNY Team' : 'Awaiting Response'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteInquiry(inq.id)}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-neutral-400 hover:text-red-600 hover:bg-red-50 px-2 py-0.5 border border-neutral-200 hover:border-red-300 rounded-xs transition-colors cursor-pointer"
                                  title="Delete message record"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                              </div>
                            </div>

                            {/* Sent Message Content */}
                            <div className="text-xs text-neutral-700 bg-[#FAF9F6] p-3.5 rounded-xs border border-brand-charcoal/10 mb-3 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal/60">
                                  {isCustom ? 'Custom Request Details:' : 'Your Message:'}
                                </span>
                                {inq.subject && (
                                  <span className="text-[10px] font-bold text-brand-charcoal font-serif">{inq.subject}</span>
                                )}
                              </div>
                              <p className="font-serif leading-relaxed text-[12px] whitespace-pre-wrap pt-1">{inq.message}</p>
                            </div>

                            {/* PENNY Team Response */}
                            {inq.reply ? (
                              <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xs text-xs">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                                    <Check className="w-3.5 h-3.5 text-emerald-700" /> Response from PENNY Team
                                  </span>
                                  <span className="text-[10px] text-neutral-400 font-mono">
                                    {inq.repliedAt ? new Date(inq.repliedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                  </span>
                                </div>
                                <p className="text-emerald-950 font-serif text-[13px] leading-relaxed whitespace-pre-wrap">
                                  {inq.reply}
                                </p>
                                <p className="text-[10px] text-emerald-700/70 mt-3 pt-2 border-t border-emerald-200/50">
                                  Dispatched to your email ({inq.email}) and permanently logged in your client portal.
                                </p>
                              </div>
                            ) : (
                              <div className="p-3 bg-amber-50/50 border border-amber-200/50 rounded-xs text-[11px] text-amber-900 flex items-center justify-between">
                                <span className="italic font-serif">
                                  Your message has been received by the PENNY production team. We review fabric & color requests and respond within 24 hours.
                                </span>
                                <span className="text-[10px] font-mono text-amber-800/60 uppercase font-bold tracking-wider">
                                  Turnaround: 24h
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: ORDER NOTIFICATIONS & LIVE TRACKING */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-brand-charcoal/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-brand-charcoal">
                      Order Notifications & Delivery Tracking
                    </h2>
                    <p className="text-xs text-brand-charcoal/60 font-serif mt-0.5">
                      Live status updates, payment confirmations, tailoring milestones, and delivery dispatch.
                    </p>
                  </div>
                  <button
                    onClick={handleSyncStatus}
                    disabled={isLoadingOrders}
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-charcoal/70 hover:text-black py-1.5 px-3 border border-brand-charcoal/20 hover:border-black rounded-xs transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                    Sync Status
                  </button>
                </div>

                {isLoadingOrders ? (
                  <div className="py-16 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-brand-charcoal/40 mx-auto mb-3" />
                    <p className="text-xs uppercase tracking-wider text-brand-charcoal/60 font-bold">
                      Checking Real-Time Order Feeds...
                    </p>
                  </div>
                ) : orders.filter(ord => !dismissedNotifications.includes(ord.id)).length > 0 ? (
                  <div className="space-y-6">
                    {orders.filter(ord => !dismissedNotifications.includes(ord.id)).map((ord) => {
                      const isBankTransfer = ord.paymentMethod === 'bank_transfer';
                      const isPaymentConfirmed = ord.paymentConfirmed || !isBankTransfer;
                      const status = ord.status || (isPaymentConfirmed ? 'Processing' : 'Awaiting Payment');
                      
                      // Calculate active stage index: 0=Placed, 1=Paid, 2=Processing, 3=Shipped, 4=Delivered
                      let activeStageIndex = 0;
                      if (status === 'Delivered') activeStageIndex = 4;
                      else if (status === 'Shipped') activeStageIndex = 3;
                      else if (status === 'Processing') activeStageIndex = 2;
                      else if (isPaymentConfirmed) activeStageIndex = 1;

                      const stages = [
                        { label: 'Order Placed', desc: 'Order received & logged' },
                        { label: 'Payment Verified', desc: isPaymentConfirmed ? 'Transfer verified' : 'Awaiting confirmation' },
                        { label: 'Processing & Packaging', desc: 'Inspection & packaging' },
                        { label: 'Dispatched / In Transit', desc: 'Handed to courier' },
                        { label: 'Delivered', desc: 'Delivered to recipient' },
                      ];

                      return (
                        <div 
                          key={ord.id} 
                          className="border border-brand-charcoal/15 bg-white rounded-xs shadow-xs overflow-hidden"
                        >
                          {/* Notification Card Header */}
                          <div className="p-5 bg-[#FAF9F6] border-b border-brand-charcoal/10 flex flex-wrap justify-between items-center gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <Bell className="w-4 h-4 text-brand-taupe" />
                                <span className="font-mono font-bold text-sm text-brand-charcoal">
                                  #{ord.id}
                                </span>
                                <span className="text-[11px] text-brand-charcoal/50 font-serif">
                                  • {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                                </span>
                              </div>
                              <p className="text-xs text-brand-charcoal/70 font-serif mt-0.5">
                                Recipient: <strong>{ord.customer || user?.firstName}</strong> • Delivery: {ord.city || 'Lagos'}, {ord.state || 'Lagos'}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => printOrderReceipt(ord)}
                                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-charcoal bg-white hover:bg-brand-charcoal hover:text-white px-3 py-1.5 border border-brand-charcoal/20 rounded-xs transition-colors cursor-pointer"
                              >
                                <Printer className="w-3 h-3" /> Receipt
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDismissNotification(ord.id)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:text-red-600 bg-white hover:bg-red-50 px-2.5 py-1.5 border border-neutral-200 hover:border-red-300 rounded-xs transition-colors cursor-pointer"
                                title="Delete this order notification"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xs inline-flex items-center gap-1.5 border ${
                                status === 'Delivered' 
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
                                  : status === 'Shipped' 
                                  ? 'bg-blue-50 text-blue-900 border-blue-300'
                                  : status === 'Processing'
                                  ? 'bg-neutral-900 text-white border-neutral-900'
                                  : 'bg-amber-50 text-amber-900 border-amber-300'
                              }`}>
                                {status === 'Delivered' && <Check className="w-3 h-3 text-emerald-600" />}
                                {status === 'Shipped' && <Truck className="w-3 h-3 text-blue-600" />}
                                {status === 'Processing' && <Package className="w-3 h-3 text-white" />}
                                {status === 'Awaiting Payment' && <Clock className="w-3 h-3 text-amber-600" />}
                                {status}
                              </span>
                            </div>
                          </div>

                          {/* 5-Stage Interactive Progress Bar */}
                          <div className="p-6 border-b border-brand-charcoal/10">
                            <div className="relative">
                              {/* Horizontal track line for desktop */}
                              <div className="hidden md:block absolute top-4 left-6 right-6 h-0.5 bg-neutral-200 -z-0" />
                              
                              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
                                {stages.map((stage, sIdx) => {
                                  const isComplete = sIdx <= activeStageIndex;
                                  const isCurrent = sIdx === activeStageIndex;

                                  return (
                                    <div key={sIdx} className="flex md:flex-col items-center md:text-center gap-3 md:gap-2">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                                        isComplete 
                                          ? 'bg-brand-charcoal text-white shadow-xs' 
                                          : 'bg-neutral-100 text-neutral-400 border border-neutral-300'
                                      } ${isCurrent ? 'ring-2 ring-brand-charcoal ring-offset-2' : ''}`}>
                                        {isComplete ? <Check className="w-4 h-4" /> : (sIdx + 1)}
                                      </div>
                                      <div>
                                        <p className={`text-xs font-bold uppercase tracking-wider ${
                                          isComplete ? 'text-brand-charcoal' : 'text-neutral-400'
                                        }`}>
                                          {stage.label}
                                        </p>
                                        <p className="text-[10px] text-brand-charcoal/60 font-serif">
                                          {stage.desc}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Live Alert Status Message */}
                          <div className="p-5 space-y-3">
                            {status === 'Delivered' && (
                              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xs font-serif">
                                <strong className="font-sans font-bold uppercase tracking-wider block text-[10px] text-emerald-950 mb-0.5">
                                  Package Successfully Delivered
                                </strong>
                                Your order has been delivered to <strong>{ord.address || ord.city}</strong>. We hope your PENNY pieces elevate your wardrobe. For any exchange requests, feel free to contact PENNY support.
                              </div>
                            )}

                            {status === 'Shipped' && (
                              <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xs font-serif">
                                <strong className="font-sans font-bold uppercase tracking-wider block text-[10px] text-blue-950 mb-0.5">
                                  Package In Transit
                                </strong>
                                Your order has been dispatched from our store and handed to our logistics partner. Standard Lagos deliveries arrive within 1 to 3 business days.
                              </div>
                            )}

                            {status === 'Processing' && (
                              <div className="p-3.5 bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs rounded-xs font-serif">
                                <strong className="font-sans font-bold uppercase tracking-wider block text-[10px] text-neutral-900 mb-0.5">
                                  Order Confirmed & Quality Check
                                </strong>
                                Payment has been verified. Our team is currently inspecting, steaming, and packaging your items with complimentary garment bags.
                              </div>
                            )}

                            {status === 'Awaiting Payment' && (
                              <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xs font-serif">
                                <strong className="font-sans font-bold uppercase tracking-wider block text-[10px] text-amber-950 mb-0.5">
                                  Direct Bank Transfer Verification
                                </strong>
                                Order placed successfully. Please ensure your bank transfer has been made using reference <strong>#{ord.id}</strong>. Once our accounting team confirms credit, fulfillment commences immediately and you will receive an updated status here.
                              </div>
                            )}

                            {/* Ordered Items Preview */}
                            <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs">
                              <span className="text-neutral-500 font-serif">
                                Package Contents: <strong>{ord.items?.length || ord.itemsCount || 1}</strong> piece(s) • Total Paid: <strong className="font-sans text-brand-charcoal">₦ {Number(ord.total || 0).toLocaleString()}</strong>
                              </span>
                              <Link
                                to="/contact"
                                className="text-xs text-brand-charcoal font-bold uppercase tracking-wider hover:underline"
                              >
                                Need Help? Contact Support &rarr;
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 border border-dashed border-neutral-300 p-8 rounded-xs bg-white">
                    <Bell className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-brand-charcoal">No Order Notifications</h3>
                    <p className="text-xs text-brand-charcoal/60 font-serif mt-1 max-w-sm mx-auto mb-6">
                      When you place an order, live delivery tracking and confirmation milestones will be updated here in real-time.
                    </p>
                    <Link
                      to="/shop"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-brand-charcoal text-white text-xs font-bold uppercase tracking-[0.15em] hover:bg-black transition-colors rounded-xs"
                    >
                      Explore Catalogue <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}

                {/* Customer Inquiries & PENNY Responses Section */}
                <div className="mt-12 pt-8 border-t border-brand-charcoal/15">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-charcoal flex items-center gap-2">
                        <Mail className="w-4 h-4 text-brand-taupe" /> Customer Inquiries & PENNY Responses
                      </h3>
                      <p className="text-[11px] text-brand-charcoal/60 font-serif mt-0.5">
                        Inquiries submitted through the Contact page and official responses from PENNY.
                      </p>
                    </div>
                    <Link
                      to="/contact"
                      className="self-start sm:self-auto text-[11px] font-bold uppercase tracking-wider text-brand-charcoal border border-brand-charcoal/20 hover:border-black px-3 py-1.5 rounded-xs transition-colors"
                    >
                      New Inquiry &rarr;
                    </Link>
                  </div>

                  {isLoadingInquiries ? (
                    <div className="py-8 text-center text-xs text-neutral-400">
                      <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-neutral-400" />
                      Loading messages...
                    </div>
                  ) : userInquiries.length > 0 ? (
                    <div className="space-y-4">
                      {userInquiries.map((inq) => (
                        <div key={inq.id} className="border border-brand-charcoal/15 bg-white rounded-xs p-5 shadow-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-charcoal/10 pb-3 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-brand-charcoal">#{inq.id}</span>
                              <span className="text-[11px] text-neutral-400 font-serif">
                                • {new Date(inq.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {inq.orderNumber && (
                                <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-xs border border-neutral-200">
                                  Order: #{inq.orderNumber}
                                </span>
                              )}
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs border ${
                                inq.status === 'replied' 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                {inq.status === 'replied' ? '✓ Replied by Store' : 'Awaiting Response'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteInquiry(inq.id)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-neutral-400 hover:text-red-600 hover:bg-red-50 px-2 py-0.5 border border-neutral-200 hover:border-red-300 rounded-xs transition-colors cursor-pointer"
                                title="Delete inquiry record"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </div>

                          {/* Customer's original inquiry */}
                          <div className="text-xs text-neutral-600 mb-3 bg-[#FAF9F6] p-3 rounded-xs border border-brand-charcoal/10">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                              Your Inquiry:
                            </span>
                            <FormattedMessage message={inq.message} type={inq.type} />
                          </div>

                          {/* Admin response */}
                          {inq.reply ? (
                            <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xs text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-emerald-700" /> PENNY Response (from Admin)
                                </span>
                                <span className="text-[10px] text-neutral-400 font-mono">
                                  {inq.repliedAt ? new Date(inq.repliedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              <p className="text-emerald-950 font-serif text-[13px] leading-relaxed mt-2 whitespace-pre-wrap">
                                {inq.reply}
                              </p>
                              <p className="text-[10px] text-neutral-400 mt-3 pt-2 border-t border-emerald-200/50">
                                This message was also dispatched to your email address ({inq.email}).
                              </p>
                            </div>
                          ) : (
                            <p className="text-[11px] text-amber-800 italic font-serif">
                              Inquiry logged. Our team responds to client emails within 24 hours.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 bg-brand-offwhite/50 border border-brand-charcoal/10 rounded-xs text-center text-xs text-brand-charcoal/60">
                      <p className="font-serif">You have no active inquiries. Need sizing advice or order updates? Contact PENNY support anytime.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: SECURITY & PASSWORD */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in max-w-lg">
                <div className="border-b border-brand-charcoal/10 pb-4">
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-brand-charcoal">
                    Account Security
                  </h2>
                  <p className="text-xs text-brand-charcoal/60 font-serif mt-0.5">
                    Update your client password to maintain secure portal access.
                  </p>
                </div>

                {passwordFeedback.text && (
                  <div className={`p-3.5 rounded-xs text-xs font-medium border flex items-center gap-2 ${
                    passwordFeedback.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                      : 'bg-red-50 text-red-900 border-red-200'
                  }`}>
                    {passwordFeedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-red-600" />}
                    <span>{passwordFeedback.text}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 text-xs font-sans">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                      Current Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="••••••••••••"
                      className="w-full border border-brand-charcoal/20 p-2.5 rounded-xs focus:outline-none focus:border-brand-charcoal"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                      New Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Minimum 6 characters"
                      className="w-full border border-brand-charcoal/20 p-2.5 rounded-xs focus:outline-none focus:border-brand-charcoal"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Repeat new password"
                      className="w-full border border-brand-charcoal/20 p-2.5 rounded-xs focus:outline-none focus:border-brand-charcoal"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-brand-charcoal text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors rounded-xs"
                    >
                      Update Password
                    </button>
                  </div>
                </form>

                {/* Danger Zone: Delete Account */}
                <div className="mt-12 pt-8 border-t border-red-200">
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-red-700 mb-1">
                    Danger Zone
                  </h3>
                  <p className="text-xs text-brand-charcoal/60 font-serif mb-4">
                    Permanently delete your PENNY client account, saved delivery addresses, and profile details. This action is irreversible.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      const shouldDelete = await confirm({
                        title: 'Permanently Delete Account',
                        message: 'Are you sure you want to permanently delete your account? All saved addresses, delivery records, and profile details will be erased.',
                        confirmText: 'Delete Account',
                        cancelText: 'Cancel',
                        isDestructive: true,
                      });
                      if (shouldDelete) {
                        deleteAccount();
                        navigate('/');
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider border border-red-200 rounded-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Account
                  </button>
                </div>
              </div>
            )}

          </main>
        </div>

      </div>
    </div>
  );
}
