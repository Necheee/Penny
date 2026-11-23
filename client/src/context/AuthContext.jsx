import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('penny_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Security cleanup: Remove any legacy plaintext passwords stored in browser localStorage
  useEffect(() => {
    try {
      const reg = JSON.parse(localStorage.getItem('penny_registered_users') || '[]');
      let modified = false;
      const cleaned = reg.map(account => {
        if (account.password) {
          modified = true;
          const { password, ...rest } = account;
          return rest;
        }
        return account;
      });
      if (modified) {
        localStorage.setItem('penny_registered_users', JSON.stringify(cleaned));
      }
    } catch {}
  }, []);

  /**
   * Secure client sign in with backend bcrypt verification
   */
  const login = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    setIsAuthLoading(true);
    try {
      const res = await fetch('/api/auth/customer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid email or password. Please verify your credentials.');
      }

      const authenticatedUser = data.user;
      if (data.token) {
        localStorage.setItem('penny_customer_token', data.token);
      }

      setUser(authenticatedUser);
      localStorage.setItem('penny_user', JSON.stringify(authenticatedUser));

      // Update in registered accounts registry (without password)
      const savedAccounts = JSON.parse(localStorage.getItem('penny_registered_users') || '[]');
      const idx = savedAccounts.findIndex(a => a.email && a.email.trim().toLowerCase() === cleanEmail);
      if (idx !== -1) {
        savedAccounts[idx] = { ...savedAccounts[idx], ...authenticatedUser };
        delete savedAccounts[idx].password;
      } else {
        savedAccounts.push(authenticatedUser);
      }
      localStorage.setItem('penny_registered_users', JSON.stringify(savedAccounts));

      return true;
    } finally {
      setIsAuthLoading(false);
    }
  };

  /**
   * Secure client logout
   */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('penny_user');
    localStorage.removeItem('penny_customer_token');
    localStorage.removeItem('penny_cart');
    localStorage.removeItem('penny_dismissed_notifications');
    localStorage.removeItem('penny_seen_notifications');
    sessionStorage.removeItem('penny_account_tab');
  };

  /**
   * Secure client registration with bcrypt hashing on the server
   */
  const createAccount = async (userData) => {
    const cleanEmail = (userData.email || '').trim().toLowerCase();

    setIsAuthLoading(true);
    try {
      const res = await fetch('/api/auth/customer-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          address: userData.address,
          city: userData.city,
          state: userData.state,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create your account. Please try again.');
      }

      const newUser = data.user;
      if (data.token) {
        localStorage.setItem('penny_customer_token', data.token);
      }

      // Ensure clean slate: brand new account must not inherit old localhost guest cart or notifications
      localStorage.removeItem('penny_cart');
      localStorage.removeItem('penny_dismissed_notifications');
      localStorage.removeItem('penny_seen_notifications');
      sessionStorage.removeItem('penny_account_tab');

      setUser(newUser);
      localStorage.setItem('penny_user', JSON.stringify(newUser));

      // Save to local registry without password
      const savedAccounts = JSON.parse(localStorage.getItem('penny_registered_users') || '[]');
      const idx = savedAccounts.findIndex(a => a.email && a.email.trim().toLowerCase() === cleanEmail);
      if (idx !== -1) {
        savedAccounts[idx] = { ...savedAccounts[idx], ...newUser };
        delete savedAccounts[idx].password;
      } else {
        savedAccounts.push(newUser);
      }
      localStorage.setItem('penny_registered_users', JSON.stringify(savedAccounts));

      return true;
    } finally {
      setIsAuthLoading(false);
    }
  };

  /**
   * Changes password securely with current password check and bcrypt hashing
   */
  const changePassword = async (currentPassword, newPassword) => {
    if (!user) throw new Error('You must be signed in to change your password.');
    const token = localStorage.getItem('penny_customer_token');

    const res = await fetch('/api/auth/customer-change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        email: user.email,
        userId: user.id,
        currentPassword,
        newPassword,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to update password.');
    }

    return true;
  };

  const updateProfile = async (updatedFields) => {
    if (!user) return;
    const oldEmail = (user.email || '').trim().toLowerCase();
    const newEmail = updatedFields.email ? updatedFields.email.trim().toLowerCase() : oldEmail;

    const updatedUser = { 
      ...user, 
      ...updatedFields, 
      email: newEmail 
    };

    setUser(updatedUser);
    localStorage.setItem('penny_user', JSON.stringify(updatedUser));

    // Update in registered accounts registry
    const savedAccounts = JSON.parse(localStorage.getItem('penny_registered_users') || '[]');
    const idx = savedAccounts.findIndex(a => 
      (a.id && a.id === user.id) || 
      (a.email && a.email.trim().toLowerCase() === oldEmail)
    );

    if (idx !== -1) {
      savedAccounts[idx] = { ...savedAccounts[idx], ...updatedUser };
      delete savedAccounts[idx].password;
    } else {
      savedAccounts.push(updatedUser);
    }
    localStorage.setItem('penny_registered_users', JSON.stringify(savedAccounts));

    // Sync to backend Neon Cloud with previousEmail to link past orders and inquiries
    try {
      const token = localStorage.getItem('penny_customer_token');
      await fetch('/api/auth/customer-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...updatedUser,
          previousEmail: oldEmail !== newEmail ? oldEmail : null,
        }),
      });
    } catch (err) {
      console.warn('Could not sync profile to backend:', err.message);
    }

    return updatedUser;
  };

  const updateAddresses = (newAddresses) => {
    if (!user) return;
    updateProfile({ addresses: newAddresses });
  };

  const deleteAccount = () => {
    if (!user) return;
    const cleanEmail = (user.email || '').trim().toLowerCase();
    const savedAccounts = JSON.parse(localStorage.getItem('penny_registered_users') || '[]');
    const remaining = savedAccounts.filter(a => 
      a.id !== user.id && 
      (!a.email || a.email.trim().toLowerCase() !== cleanEmail)
    );
    localStorage.setItem('penny_registered_users', JSON.stringify(remaining));

    setUser(null);
    localStorage.removeItem('penny_user');
    localStorage.removeItem('penny_customer_token');
  };

  // Background refresh user profile from cloud with cross-device sync
  const refreshProfile = async () => {
    const activeUser = user || (() => {
      try {
        const saved = localStorage.getItem('penny_user');
        return saved ? JSON.parse(saved) : null;
      } catch { return null; }
    })();

    if (!activeUser) return;
    const cleanEmail = (activeUser.email || '').trim().toLowerCase();
    const cleanUserId = (activeUser.id || '').trim();
    if (!cleanEmail && !cleanUserId) return;

    const token = localStorage.getItem('penny_customer_token');
    if (!token) return;

    try {
      const res = await fetch(`/api/auth/customer-profile?email=${encodeURIComponent(cleanEmail)}&userId=${encodeURIComponent(cleanUserId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          const fresh = data.user;
          setUser(prev => {
            if (!prev) return fresh;
            return {
              ...prev,
              ...fresh,
              firstName: fresh.firstName || prev.firstName || '',
              lastName: fresh.lastName || prev.lastName || '',
              phone: fresh.phone || prev.phone || '',
              email: fresh.email || prev.email || '',
              addresses: (fresh.addresses && fresh.addresses.length > 0) ? fresh.addresses : (prev.addresses || []),
            };
          });

          const currentSaved = localStorage.getItem('penny_user');
          const parsed = currentSaved ? JSON.parse(currentSaved) : {};
          const merged = {
            ...parsed,
            ...fresh,
            firstName: fresh.firstName || parsed.firstName || '',
            lastName: fresh.lastName || parsed.lastName || '',
            phone: fresh.phone || parsed.phone || '',
            email: fresh.email || parsed.email || '',
            addresses: (fresh.addresses && fresh.addresses.length > 0) ? fresh.addresses : (parsed.addresses || []),
          };
          localStorage.setItem('penny_user', JSON.stringify(merged));
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    refreshProfile();

    const interval = setInterval(refreshProfile, 10000);
    const onFocus = () => refreshProfile();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [user?.email, user?.id]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthLoading,
      login,
      logout,
      createAccount,
      changePassword,
      updateProfile,
      updateAddresses,
      deleteAccount,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
