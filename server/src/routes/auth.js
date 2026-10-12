import express from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/token.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * In-memory / Mock fallback for initial boots before database migration
 * Provides guaranteed functionality during runtime setup
 */
let registeredUsers = [
  {
    id: 'owner-admin-01',
    email: process.env.ADMIN_EMAIL || 'owner@penny.com',
    passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'PennyAdmin2026!', 10),
    name: process.env.ADMIN_NAME || 'PENNY Owner',
    role: 'admin',
    createdAt: new Date(),
  },
];

/**
 * POST /api/auth/login
 * Strict authentication: Validates credentials and returns JWT
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email address and password.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    // Generate signed JWT token
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user profile
 */
router.get('/me', requireAuth, (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
});

/**
 * POST /api/auth/logout
 * Client-side clears the token; server confirms invalidation
 */
router.post('/logout', requireAuth, (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Successfully logged out.',
  });
});

export default router;
