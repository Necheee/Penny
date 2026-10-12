import { Navigate, useLocation } from 'react-router-dom';

/**
 * AdminProtectedRoute
 * Ensures that only authenticated administrators with an active JWT token
 * can view and operate the PENNY Store Administration Dashboard.
 */
export default function AdminProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem('penny_admin_token');
  const savedUser = localStorage.getItem('penny_admin_user');

  let isAdmin = false;
  if (token && savedUser) {
    try {
      const user = JSON.parse(savedUser);
      if (user.role === 'admin') {
        isAdmin = true;
      }
    } catch (e) {
      console.error('Failed to parse admin user profile', e);
    }
  }

  if (!isAdmin) {
    // Redirect unauthenticated visitor straight to the admin login portal
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}

