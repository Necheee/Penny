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

  const login = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const savedAccounts = JSON.parse(localStorage.getItem('penny_registered_users') || '[]');
    let localFound = savedAccounts.find(a => a.email && a.email.trim().toLowerCase() === cleanEmail);

    let cloudUser = null;
    try {
      const res = await fetch(`/api/auth/customer-profile?email=${encodeURIComponent(cleanEmail)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          cloudUser = data.user;
        }
      }
    } catch (e) {
      console.warn('Backend customer profile lookup note:', e.message);
    }

    let found = null;
    if (cloudUser && localFound) {
      found = {
        ...localFound,
        ...cloudUser,
        firstName: cloudUser.firstName || localFound.firstName || '',
        lastName: cloudUser.lastName || localFound.lastName || '',
        phone: cloudUser.phone || localFound.phone || '',
        addresses: (cloudUser.addresses && cloudUser.addresses.length > 0) ? cloudUser.addresses : (localFound.addresses || []),
      };
    } else if (cloudUser) {
      found = cloudUser;
    } else if (localFound) {
      found = localFound;
    }

    if (!found) {
      const namePart = cleanEmail.split('@')[0] || 'Client';
      const defaultFirstName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

      found = {
        id: `usr_${Date.now()}`,
        email: cleanEmail,
        firstName: defaultFirstName,
        lastName: '',
        phone: '',
        addresses: [
          {
            id: 'addr_1',
            label: 'Default Shipping Address',
            fullName: defaultFirstName,
            street: '14 Victoria Island Crescent, Apt 4B',
            city: 'Victoria Island',
            state: 'Lagos',
            isDefault: true,
          }
        ]
      };
    }

    // Ensure user is permanently saved in registered accounts registry
    const idx = savedAccounts.findIndex(a => a.email && a.email.trim().toLowerCase() === cleanEmail);
    if (idx !== -1) {
      savedAccounts[idx] = { ...savedAccounts[idx], ...found };
    } else {
      savedAccounts.push(found);
    }
    localStorage.setItem('penny_registered_users', JSON.stringify(savedAccounts));

    setUser(found);
    localStorage.setItem('penny_user', JSON.stringify(found));

    // Also sync to backend Neon Cloud in background
    fetch('/api/auth/customer-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(found),
    }).catch(() => {});

    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('penny_user');
  };

  const createAccount = async (userData) => {
    const cleanEmail = (userData.email || '').trim().toLowerCase();
    const newUser = {
      id: `usr_${Date.now()}`,
      email: cleanEmail,
      firstName: (userData.firstName || '').trim(),
      lastName: (userData.lastName || '').trim(),
      phone: (userData.phone || '').trim(),
      addresses: [
        {
          id: 'addr_1',
          label: 'Primary Delivery Address',
          fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          street: userData.address || '',
          city: userData.city || 'Lagos',
          state: userData.state || 'Lagos',
          isDefault: true,
        }
      ]
    };

    // Save to local registry so login remembers name and credentials
    const savedAccounts = JSON.parse(localStorage.getItem('penny_registered_users') || '[]');
    const idx = savedAccounts.findIndex(a => a.email && a.email.trim().toLowerCase() === cleanEmail);
    if (idx !== -1) {
      savedAccounts[idx] = { ...savedAccounts[idx], ...newUser, password: userData.password };
    } else {
      savedAccounts.push({ ...newUser, password: userData.password });
    }
    localStorage.setItem('penny_registered_users', JSON.stringify(savedAccounts));

    setUser(newUser);
    localStorage.setItem('penny_user', JSON.stringify(newUser));

    // Sync to backend Neon Cloud
    try {
      await fetch('/api/auth/customer-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
    } catch (err) {
      console.warn('Could not sync new account to backend:', err.message);
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
    } else {
      savedAccounts.push(updatedUser);
    }
    localStorage.setItem('penny_registered_users', JSON.stringify(savedAccounts));

    // Sync to backend Neon Cloud with previousEmail to link past orders and inquiries
    try {
      await fetch('/api/auth/customer-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    // Remove from local registered users
    const savedAccounts = JSON.parse(localStorage.getItem('penny_registered_users') || '[]');
    const remaining = savedAccounts.filter(a => 
      a.id !== user.id && 
      (!a.email || a.email.trim().toLowerCase() !== cleanEmail)
    );
    localStorage.setItem('penny_registered_users', JSON.stringify(remaining));

    // Clear active session
    setUser(null);
    localStorage.removeItem('penny_user');
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

    try {
      const res = await fetch(`/api/auth/customer-profile?email=${encodeURIComponent(cleanEmail)}&userId=${encodeURIComponent(cleanUserId)}`);
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

    // Check cloud for profile changes made on other devices every 10s and on window focus
    const interval = setInterval(refreshProfile, 10000);
    const onFocus = () => refreshProfile();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [user?.email, user?.id]);

  return (
    <AuthContext.Provider value={{ user, isAuthLoading, login, logout, createAccount, updateProfile, updateAddresses, deleteAccount, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
