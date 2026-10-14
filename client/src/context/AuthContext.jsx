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
    const cleanEmail = (user.email || '').trim().toLowerCase();
    const updatedUser = { ...user, ...updatedFields, email: cleanEmail };

    setUser(updatedUser);
    localStorage.setItem('penny_user', JSON.stringify(updatedUser));

    // Update in registered accounts registry
    const savedAccounts = JSON.parse(localStorage.getItem('penny_registered_users') || '[]');
    const idx = savedAccounts.findIndex(a => 
      (a.id && a.id === user.id) || 
      (a.email && a.email.trim().toLowerCase() === cleanEmail)
    );

    if (idx !== -1) {
      savedAccounts[idx] = { ...savedAccounts[idx], ...updatedUser };
    } else {
      savedAccounts.push(updatedUser);
    }
    localStorage.setItem('penny_registered_users', JSON.stringify(savedAccounts));

    // Sync to backend Neon Cloud
    try {
      await fetch('/api/auth/customer-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });
    } catch (err) {
      console.warn('Could not sync profile to backend:', err.message);
    }
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

  // Background refresh user profile from cloud if session exists
  useEffect(() => {
    if (user && user.email) {
      const cleanEmail = user.email.trim().toLowerCase();
      fetch(`/api/auth/customer-profile?email=${encodeURIComponent(cleanEmail)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.user) {
            setUser(prev => {
              if (!prev) return data.user;
              return {
                ...prev,
                ...data.user,
                firstName: data.user.firstName || prev.firstName || '',
                lastName: data.user.lastName || prev.lastName || '',
                phone: data.user.phone || prev.phone || '',
                addresses: (data.user.addresses && data.user.addresses.length > 0) ? data.user.addresses : (prev.addresses || []),
              };
            });
            const currentSaved = localStorage.getItem('penny_user');
            if (currentSaved) {
              const parsed = JSON.parse(currentSaved);
              const merged = {
                ...parsed,
                ...data.user,
                firstName: data.user.firstName || parsed.firstName || '',
                lastName: data.user.lastName || parsed.lastName || '',
                phone: data.user.phone || parsed.phone || '',
                addresses: (data.user.addresses && data.user.addresses.length > 0) ? data.user.addresses : (parsed.addresses || []),
              };
              localStorage.setItem('penny_user', JSON.stringify(merged));
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthLoading, login, logout, createAccount, updateProfile, updateAddresses, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
