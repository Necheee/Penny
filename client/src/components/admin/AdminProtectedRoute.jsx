import { Navigate, useLocation } from 'react-router-dom';

function isJwtExpired(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

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
    if (isJwtExpired(token)) {
      console.warn('Admin token has expired. Redirecting to login portal.');
      localStorage.removeItem('penny_admin_token');
      localStorage.removeItem('penny_admin_user');
    } else {
      try {
        const user = JSON.parse(savedUser);
        if (user.role === 'admin') {
          isAdmin = true;
        }
      } catch (e) {
        console.error('Failed to parse admin user profile', e);
      }
    }
  }

  if (!isAdmin) {
    // Redirect unauthenticated visitor straight to the admin login portal
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}

