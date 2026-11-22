import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is missing in production!');
    }
    return 'penny_default_dev_secret_key_2026';
  }
  return secret;
};

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a signed JWT for an authenticated user
 * @param {Object} user - User payload { id, email, role, name }
 * @returns {string} Signed JWT token
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || user.email.split('@')[0],
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Verify and decode a JWT token strictly against cryptographic signature
 * @param {string} token
 * @returns {Object|null} Decoded payload or null if invalid/expired
 */
export const verifyToken = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
};
