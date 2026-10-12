import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Check local storage for mock session
  useEffect(() => {
    const savedUser = localStorage.getItem('penny_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (email, password) => {
    // Check if user account was created locally or fallback
    const savedAccounts = JSON.parse(localStorage.getItem('penny_registered_users') || '[]');
    const found = savedAccounts.find(a => a.email.toLowerCase() === email.toLowerCase());

    const activeUser = found || {
      id: 'usr_1',
      email,
      firstName: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
      lastName: '',
      phone: '+234 800 000 0000',
      addresses: [
        {
          id: 'addr_1',
          label: 'Default Shipping Address',
          fullName: 'Valued Client',
          street: '14 Victoria Island Crescent, Apt 4B',
          city: 'Victoria Island',
          state: 'Lagos',
          isDefault: true,
        }
      ]
    };

    setUser(activeUser);
    localStorage.setItem('penny_user', JSON.stringify(activeUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('penny_user');
  };

  const createAccount = (userData) => {
    const newUser = {
      id: `usr_${Date.now()}`,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone || '',
      addresses: [
        {
          id: 'addr_1',
          label: 'Primary Delivery Address',
          fullName: `${userData.firstName} ${userData.lastName}`.trim(),
          street: userData.address || '',
          city: userData.city || 'Lagos',
          state: userData.state || 'Lagos',
          isDefault: true,
        }
      ]
    };

    // Save to local registry so login remembers name and credentials
    const savedAccounts = JSON.parse(localStorage.getItem('penny_registered_users') || '[]');
    savedAccounts.push({ ...newUser, password: userData.password });
    localStorage.setItem('penny_registered_users', JSON.stringify(savedAccounts));

    setUser(newUser);
    localStorage.setItem('penny_user', JSON.stringify(newUser));
    return true;
  };

  const updateProfile = (updatedFields) => {
    if (!user) return;
    const updatedUser = { ...user, ...updatedFields };
    setUser(updatedUser);
    localStorage.setItem('penny_user', JSON.stringify(updatedUser));

    // Update in registered accounts
    const savedAccounts = JSON.parse(localStorage.getItem('penny_registered_users') || '[]');
    const idx = savedAccounts.findIndex(a => a.id === user.id || a.email === user.email);
    if (idx !== -1) {
      savedAccounts[idx] = { ...savedAccounts[idx], ...updatedFields };
      localStorage.setItem('penny_registered_users', JSON.stringify(savedAccounts));
    }
  };

  const updateAddresses = (newAddresses) => {
    if (!user) return;
    updateProfile({ addresses: newAddresses });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, createAccount, updateProfile, updateAddresses }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
