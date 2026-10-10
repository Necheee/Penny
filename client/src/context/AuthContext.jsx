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
    // Mock login logic
    const mockUser = {
      id: 'usr_1',
      email,
      firstName: 'Guest',
      lastName: 'User'
    };
    setUser(mockUser);
    localStorage.setItem('penny_user', JSON.stringify(mockUser));
    return true; // Simulate success
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('penny_user');
  };

  const createAccount = (userData) => {
    // Mock create account
    const mockUser = {
      id: 'usr_2',
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName
    };
    setUser(mockUser);
    localStorage.setItem('penny_user', JSON.stringify(mockUser));
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, createAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
