import express from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/token.js';
import { requireAuth } from '../middleware/auth.js';
import { getPool } from '../utils/cloudDb.js';
import { readJsonFile, writeJsonFile } from '../utils/persistentStorage.js';

const router = express.Router();

/**
 * Resolves administrator account strictly from private environment variables
 */
const getAdminAccount = () => {
  const email = (process.env.ADMIN_EMAIL || '').trim();
  const password = process.env.ADMIN_PASSWORD || '';
  const name = (process.env.ADMIN_NAME || 'PENNY Owner').trim();

  if (!email || !password) {
    return null;
  }

  return {
    id: 'owner-admin-01',
    email,
    password,
    name,
    role: 'admin',
  };
};

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
    const admin = getAdminAccount();

    if (!admin || cleanEmail !== admin.email.toLowerCase()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    // Secure password comparison: supports plain text or bcrypt-hashed passwords from .env
    let isMatch = password === admin.password;
    if (!isMatch && admin.password.startsWith('$2')) {
      try {
        isMatch = await bcrypt.compare(password, admin.password);
      } catch {
        isMatch = false;
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    // Generate signed JWT token
    const token = generateToken(admin);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
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

/**
 * GET /api/auth/customer-profile
 * Fetches customer profile by email from Neon Cloud or local users.json
 */
router.get('/customer-profile', async (req, res) => {
  try {
    const email = (req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email query is required.' });
    }

    // 1. Check Neon Cloud Database
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      try {
        const pool = getPool();
        const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [email]);
        if (rows.length > 0) {
          const u = rows[0];
          let userAddresses = [];
          if (Array.isArray(u.addresses)) {
            userAddresses = u.addresses;
          } else if (typeof u.addresses === 'string') {
            try { userAddresses = JSON.parse(u.addresses); } catch {}
          }
          return res.status(200).json({
            success: true,
            user: {
              id: u.id,
              email: u.email,
              firstName: u.first_name || '',
              lastName: u.last_name || '',
              phone: u.phone || '',
              addresses: userAddresses,
              role: u.role || 'customer',
            },
          });
        }
      } catch (dbErr) {
        console.warn('Could not query cloud db for customer profile:', dbErr.message);
      }
    }

    // 2. Fallback to local storage users.json
    const localUsers = readJsonFile('users.json', []) || [];
    const found = localUsers.find((u) => u.email?.trim().toLowerCase() === email);
    if (found) {
      return res.status(200).json({ success: true, user: found });
    }

    return res.status(404).json({ success: false, message: 'Customer profile not found.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/auth/customer-sync
 * Upserts customer profile to Neon Cloud and local storage users.json
 */
router.post('/customer-sync', async (req, res) => {
  try {
    const { id, email, firstName, lastName, phone, addresses } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required for sync.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userId = id || `usr_${Date.now()}`;
    const cleanFirst = firstName ? firstName.trim() : '';
    const cleanLast = lastName ? lastName.trim() : '';
    const cleanPhone = phone ? phone.trim() : '';
    const safeAddresses = Array.isArray(addresses) ? addresses : [];

    const userObj = {
      id: userId,
      email: cleanEmail,
      firstName: cleanFirst,
      lastName: cleanLast,
      phone: cleanPhone,
      addresses: safeAddresses,
      role: 'customer',
    };

    // 1. Sync to Neon Cloud Database
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      try {
        const pool = getPool();
        await pool.query(`
          INSERT INTO users (id, email, first_name, last_name, phone, role, addresses)
          VALUES ($1, $2, $3, $4, $5, 'customer', $6)
          ON CONFLICT (email) DO UPDATE SET
            first_name = CASE WHEN EXCLUDED.first_name != '' THEN EXCLUDED.first_name ELSE users.first_name END,
            last_name = CASE WHEN EXCLUDED.last_name != '' THEN EXCLUDED.last_name ELSE users.last_name END,
            phone = CASE WHEN EXCLUDED.phone != '' THEN EXCLUDED.phone ELSE users.phone END,
            addresses = CASE WHEN jsonb_array_length(EXCLUDED.addresses) > 0 THEN EXCLUDED.addresses ELSE users.addresses END
        `, [userId, cleanEmail, cleanFirst, cleanLast, cleanPhone, JSON.stringify(safeAddresses)]);
      } catch (dbErr) {
        console.warn('Could not upsert customer to cloud db:', dbErr.message);
      }
    }

    // 2. Sync to local storage users.json
    const localUsers = readJsonFile('users.json', []) || [];
    const idx = localUsers.findIndex((u) => u.email?.trim().toLowerCase() === cleanEmail);
    if (idx !== -1) {
      localUsers[idx] = {
        ...localUsers[idx],
        ...userObj,
        firstName: cleanFirst || localUsers[idx].firstName || '',
        lastName: cleanLast || localUsers[idx].lastName || '',
        phone: cleanPhone || localUsers[idx].phone || '',
        addresses: safeAddresses.length > 0 ? safeAddresses : (localUsers[idx].addresses || []),
      };
    } else {
      localUsers.push(userObj);
    }
    writeJsonFile('users.json', localUsers);

    return res.status(200).json({ success: true, user: userObj });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
