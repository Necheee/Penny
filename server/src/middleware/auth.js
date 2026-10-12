import { verifyToken } from '../utils/token.js';

/**
 * Middleware: Verify that the incoming request has a valid JWT token
 */
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token required.',
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication session. Please sign in again.',
    });
  }

  // Attach decoded user info to request
  req.user = decoded;
  next();
};

/**
 * Middleware: Verify that the authenticated user strictly holds the 'admin' role
 * (Enforces the single-owner business access requirement)
 */
export const requireAdmin = (req, res, next) => {
  // First ensure requireAuth has run
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required before checking admin privileges.',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden. Administrator privileges strictly required for this action.',
    });
  }

  next();
};
