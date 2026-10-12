import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'penny_default_dev_secret_key_2026';
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
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Verify and decode a JWT token
 * @param {string} token
 * @returns {Object|null} Decoded payload or null if invalid/expired
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
