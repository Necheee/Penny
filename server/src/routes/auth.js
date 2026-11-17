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
 * Fetches customer profile by email or userId from Neon Cloud or local users.json
 */
router.get('/customer-profile', async (req, res) => {
  try {
    const email = (req.query.email || '').trim().toLowerCase();
    const userId = (req.query.userId || '').trim();
    if (!email && !userId) {
      return res.status(400).json({ success: false, message: 'Email or userId query is required.' });
    }

    // 1. Check Neon Cloud Database
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      try {
        const pool = getPool();
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS cart TEXT DEFAULT '[]';`);
        const { rows } = await pool.query(
          'SELECT * FROM users WHERE (LOWER(email) = $1 AND $1 != \'\') OR (id = $2 AND $2 != \'\') LIMIT 1',
          [email, userId]
        );
        if (rows.length > 0) {
          const u = rows[0];
          let userAddresses = [];
          if (Array.isArray(u.addresses)) {
            userAddresses = u.addresses;
          } else if (typeof u.addresses === 'string') {
            try { userAddresses = JSON.parse(u.addresses); } catch {}
          }
          let userCart = [];
          if (u.cart) {
            try {
              userCart = typeof u.cart === 'string' ? JSON.parse(u.cart) : u.cart;
            } catch {}
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
              cart: Array.isArray(userCart) ? userCart : [],
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
    const found = localUsers.find((u) => (email && u.email?.trim().toLowerCase() === email) || (userId && u.id === userId));
    if (found) {
      return res.status(200).json({ success: true, user: found });
    }

    return res.status(404).json({ success: false, message: 'Customer profile not found.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/auth/cart
 * Retrieves synced cloud cart for logged-in user
 */
router.get('/cart', async (req, res) => {
  try {
    const email = (req.query.email || '').trim().toLowerCase();
    const userId = (req.query.userId || '').trim();
    if (!email && !userId) {
      return res.status(400).json({ success: false, message: 'Email or userId is required.' });
    }

    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      try {
        const pool = getPool();
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS cart TEXT DEFAULT '[]';`);
        const { rows } = await pool.query(
          'SELECT cart FROM users WHERE (LOWER(email) = $1 AND $1 != \'\') OR (id = $2 AND $2 != \'\')',
          [email, userId]
        );
        if (rows.length > 0 && rows[0].cart) {
          const cart = typeof rows[0].cart === 'string' ? JSON.parse(rows[0].cart) : rows[0].cart;
          return res.status(200).json({ success: true, cart: Array.isArray(cart) ? cart : [] });
        }
      } catch (dbErr) {
        console.warn('Could not query cloud db for cart:', dbErr.message);
      }
    }

    const localUsers = readJsonFile('users.json', []) || [];
    const found = localUsers.find(u => (u.email?.trim().toLowerCase() === email && email !== '') || (u.id === userId && userId !== ''));
    const cart = found?.cart || [];
    return res.status(200).json({ success: true, cart: Array.isArray(cart) ? cart : [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/auth/cart
 * Updates cloud cart for logged-in user across devices
 */
router.post('/cart', async (req, res) => {
  try {
    const { email, userId, cart } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanUserId = (userId || '').trim();

    if (!cleanEmail && !cleanUserId) {
      return res.status(400).json({ success: false, message: 'Email or userId is required.' });
    }

    const safeCart = Array.isArray(cart) ? cart : [];
    const cartJson = JSON.stringify(safeCart);

    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      try {
        const pool = getPool();
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS cart TEXT DEFAULT '[]';`);
        await pool.query(
          'UPDATE users SET cart = $1 WHERE (LOWER(email) = $2 AND $2 != \'\') OR (id = $3 AND $3 != \'\')',
          [cartJson, cleanEmail, cleanUserId]
        );
      } catch (dbErr) {
        console.warn('Could not update cloud db cart:', dbErr.message);
      }
    }

    const localUsers = readJsonFile('users.json', []) || [];
    const idx = localUsers.findIndex(u => (u.email?.trim().toLowerCase() === cleanEmail && cleanEmail !== '') || (u.id === cleanUserId && cleanUserId !== ''));
    if (idx !== -1) {
      localUsers[idx].cart = safeCart;
      writeJsonFile('users.json', localUsers);
    }

    return res.status(200).json({ success: true, cart: safeCart });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/auth/notifications-state
 * Retrieves seen and dismissed notification IDs from user profile
 */
router.get('/notifications-state', async (req, res) => {
  try {
    const email = (req.query.email || '').trim().toLowerCase();
    const userId = (req.query.userId || '').trim();

    if (!email && !userId) {
      return res.status(200).json({ success: true, seenNotifications: [], dismissedNotifications: [] });
    }

    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      try {
        const pool = getPool();
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS seen_notifications TEXT DEFAULT '[]';`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS dismissed_notifications TEXT DEFAULT '[]';`);
        const { rows } = await pool.query(
          'SELECT seen_notifications, dismissed_notifications FROM users WHERE (LOWER(email) = $1 AND $1 != \'\') OR (id = $2 AND $2 != \'\')',
          [email, userId]
        );
        if (rows.length > 0) {
          const row = rows[0];
          let seen = [];
          let dismissed = [];
          try { seen = typeof row.seen_notifications === 'string' ? JSON.parse(row.seen_notifications) : (row.seen_notifications || []); } catch {}
          try { dismissed = typeof row.dismissed_notifications === 'string' ? JSON.parse(row.dismissed_notifications) : (row.dismissed_notifications || []); } catch {}
          return res.status(200).json({
            success: true,
            seenNotifications: Array.isArray(seen) ? seen : [],
            dismissedNotifications: Array.isArray(dismissed) ? dismissed : []
          });
        }
      } catch (dbErr) {
        console.warn('Could not query notifications-state from db:', dbErr.message);
      }
    }

    const localUsers = readJsonFile('users.json', []) || [];
    const found = localUsers.find(u => (u.email?.trim().toLowerCase() === email && email !== '') || (u.id === userId && userId !== ''));
    return res.status(200).json({
      success: true,
      seenNotifications: Array.isArray(found?.seen_notifications) ? found.seen_notifications : [],
      dismissedNotifications: Array.isArray(found?.dismissed_notifications) ? found.dismissed_notifications : []
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/auth/notifications-state
 * Saves seen and dismissed notification IDs for cross-device sync
 */
router.post('/notifications-state', async (req, res) => {
  try {
    const { email, userId, seenNotifications, dismissedNotifications } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanUserId = (userId || '').trim();

    if (!cleanEmail && !cleanUserId) {
      return res.status(400).json({ success: false, message: 'Email or userId required.' });
    }

    const hasSeen = Array.isArray(seenNotifications);
    const hasDismissed = Array.isArray(dismissedNotifications);

    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      try {
        const pool = getPool();
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS seen_notifications TEXT DEFAULT '[]';`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS dismissed_notifications TEXT DEFAULT '[]';`);

        if (hasSeen && hasDismissed) {
          const seenJson = JSON.stringify(seenNotifications);
          const dismissedJson = JSON.stringify(dismissedNotifications);
          await pool.query(
            `UPDATE users 
             SET seen_notifications = $1, dismissed_notifications = $2 
             WHERE (LOWER(email) = $3 AND $3 != '') OR (id = $4 AND $4 != '')`,
            [seenJson, dismissedJson, cleanEmail, cleanUserId]
          );
        } else if (hasSeen) {
          const seenJson = JSON.stringify(seenNotifications);
          await pool.query(
            `UPDATE users 
             SET seen_notifications = $1 
             WHERE (LOWER(email) = $2 AND $2 != '') OR (id = $3 AND $3 != '')`,
            [seenJson, cleanEmail, cleanUserId]
          );
        } else if (hasDismissed) {
          const dismissedJson = JSON.stringify(dismissedNotifications);
          await pool.query(
            `UPDATE users 
             SET dismissed_notifications = $1 
             WHERE (LOWER(email) = $2 AND $2 != '') OR (id = $3 AND $3 != '')`,
            [dismissedJson, cleanEmail, cleanUserId]
          );
        }
      } catch (dbErr) {
        console.warn('Could not update notifications-state in db:', dbErr.message);
      }
    }

    const localUsers = readJsonFile('users.json', []) || [];
    const idx = localUsers.findIndex(u => (u.email?.trim().toLowerCase() === cleanEmail && cleanEmail !== '') || (u.id === cleanUserId && cleanUserId !== ''));
    if (idx !== -1) {
      if (hasSeen) localUsers[idx].seen_notifications = seenNotifications;
      if (hasDismissed) localUsers[idx].dismissed_notifications = dismissedNotifications;
      writeJsonFile('users.json', localUsers);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/auth/customer-register
 * Secure customer account creation with bcrypt password hashing
 */
router.post('/customer-register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, address, city, state } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanFirst = (firstName || '').trim();
    const cleanLast = (lastName || '').trim();
    const cleanPhone = (phone || '').trim();
    const userId = `usr_${Date.now()}`;

    // Hash password safely with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    const initialAddress = address ? [{
      id: 'addr_1',
      label: 'Primary Delivery Address',
      fullName: `${cleanFirst} ${cleanLast}`.trim() || cleanEmail.split('@')[0],
      street: address.trim(),
      city: (city || 'Lagos').trim(),
      state: (state || 'Lagos').trim(),
      isDefault: true,
    }] : [];

    const safeUser = {
      id: userId,
      email: cleanEmail,
      firstName: cleanFirst,
      lastName: cleanLast,
      phone: cleanPhone,
      addresses: initialAddress,
      cart: [],
      role: 'customer',
    };

    // 1. Check Neon Cloud Database and Insert
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      try {
        const pool = getPool();
        // Check if user already exists
        const checkRes = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);
        if (checkRes.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'An account with this email address already exists. Please sign in instead.',
          });
        }

        await pool.query(
          `INSERT INTO users (id, email, first_name, last_name, phone, password_hash, role, addresses, cart)
           VALUES ($1, $2, $3, $4, $5, $6, 'customer', $7, '[]')`,
          [userId, cleanEmail, cleanFirst, cleanLast, cleanPhone, passwordHash, JSON.stringify(initialAddress)]
        );
      } catch (dbErr) {
        console.warn('[AUTH] Neon registration error, using local fallback:', dbErr.message);
      }
    }

    // 2. Also register in local persistent storage (storing bcrypt hash only)
    const localUsers = readJsonFile('users.json', []) || [];
    const existingIdx = localUsers.findIndex(u => u.email?.trim().toLowerCase() === cleanEmail);
    if (existingIdx !== -1) {
      localUsers[existingIdx] = {
        ...localUsers[existingIdx],
        ...safeUser,
        password_hash: passwordHash,
      };
      delete localUsers[existingIdx].password; // remove any plain password
    } else {
      localUsers.push({
        ...safeUser,
        password_hash: passwordHash,
      });
    }
    writeJsonFile('users.json', localUsers);

    const token = generateToken(safeUser);

    return res.status(201).json({
      success: true,
      message: 'Account created securely.',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('[AUTH] Customer registration error:', err);
    return res.status(500).json({ success: false, message: 'Server error creating account.' });
  }
});

/**
 * POST /api/auth/customer-login
 * Secure customer login with bcrypt password verification
 */
router.post('/customer-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let userRow = null;

    // 1. Query Neon Cloud Database
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      try {
        const pool = getPool();
        const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);
        if (rows.length > 0) {
          userRow = rows[0];
        }
      } catch (dbErr) {
        console.warn('[AUTH] DB error fetching customer for login:', dbErr.message);
      }
    }

    // 2. Fallback to local users.json
    if (!userRow) {
      const localUsers = readJsonFile('users.json', []) || [];
      const found = localUsers.find(u => u.email?.trim().toLowerCase() === cleanEmail);
      if (found) {
        userRow = {
          id: found.id,
          email: found.email,
          first_name: found.firstName || found.first_name || '',
          last_name: found.lastName || found.last_name || '',
          phone: found.phone || '',
          password_hash: found.password_hash || found.password || '',
          role: found.role || 'customer',
          addresses: found.addresses || [],
          cart: found.cart || [],
        };
      }
    }

    if (!userRow) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // 3. Verify password safely with bcrypt (with auto-upgrade for legacy accounts)
    const storedHash = userRow.password_hash || '';
    let isMatch = false;

    if (storedHash) {
      if (storedHash.startsWith('$2')) {
        isMatch = await bcrypt.compare(password, storedHash);
      } else {
        // Legacy plaintext match
        isMatch = (storedHash === password);
        if (isMatch) {
          // Immediately auto-upgrade stored password to bcrypt hash!
          try {
            const upgradedHash = await bcrypt.hash(password, 10);
            if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
              const pool = getPool();
              await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [upgradedHash, userRow.id]);
            }
            const localUsers = readJsonFile('users.json', []) || [];
            const idx = localUsers.findIndex(u => u.id === userRow.id || u.email?.toLowerCase() === cleanEmail);
            if (idx !== -1) {
              localUsers[idx].password_hash = upgradedHash;
              delete localUsers[idx].password;
              writeJsonFile('users.json', localUsers);
            }
          } catch (upgradeErr) {
            console.warn('[AUTH] Auto-upgrade password hash note:', upgradeErr.message);
          }
        }
      }
    } else {
      // User registered through guest checkout or sync without password: set password now
      const newHash = await bcrypt.hash(password, 10);
      try {
        if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
          const pool = getPool();
          await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userRow.id]);
        }
      } catch {}
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    let userAddresses = [];
    if (Array.isArray(userRow.addresses)) {
      userAddresses = userRow.addresses;
    } else if (typeof userRow.addresses === 'string') {
      try { userAddresses = JSON.parse(userRow.addresses); } catch {}
    }

    let userCart = [];
    if (userRow.cart) {
      try { userCart = typeof userRow.cart === 'string' ? JSON.parse(userRow.cart) : userRow.cart; } catch {}
    }

    const safeUser = {
      id: userRow.id,
      email: userRow.email,
      firstName: userRow.first_name || '',
      lastName: userRow.last_name || '',
      phone: userRow.phone || '',
      addresses: userAddresses,
      cart: Array.isArray(userCart) ? userCart : [],
      role: userRow.role || 'customer',
    };

    const token = generateToken(safeUser);

    return res.status(200).json({
      success: true,
      message: 'Sign in successful.',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('[AUTH] Customer login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during sign in.' });
  }
});

/**
 * POST /api/auth/customer-change-password
 * Changes customer password with current password verification and bcrypt hashing
 */
router.post('/customer-change-password', async (req, res) => {
  try {
    const { email, userId, currentPassword, newPassword } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanUserId = (userId || '').trim();

    if ((!cleanEmail && !cleanUserId) || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    let currentHash = '';
    let targetUserId = cleanUserId;

    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      try {
        const pool = getPool();
        const { rows } = await pool.query(
          'SELECT id, password_hash FROM users WHERE (LOWER(email) = $1 AND $1 != \'\') OR (id = $2 AND $2 != \'\') LIMIT 1',
          [cleanEmail, cleanUserId]
        );
        if (rows.length > 0) {
          currentHash = rows[0].password_hash || '';
          targetUserId = rows[0].id;
        }
      } catch (dbErr) {
        console.warn('[AUTH] DB error checking password:', dbErr.message);
      }
    }

    if (!currentHash) {
      const localUsers = readJsonFile('users.json', []) || [];
      const found = localUsers.find(u => (u.email?.trim().toLowerCase() === cleanEmail && cleanEmail !== '') || (u.id === cleanUserId && cleanUserId !== ''));
      if (found) {
        currentHash = found.password_hash || found.password || '';
        targetUserId = found.id;
      }
    }

    // Verify current password if one is set
    if (currentHash) {
      let isCurrentValid = false;
      if (currentHash.startsWith('$2')) {
        isCurrentValid = await bcrypt.compare(currentPassword, currentHash);
      } else {
        isCurrentValid = (currentHash === currentPassword);
      }

      if (!isCurrentValid) {
        return res.status(400).json({ success: false, message: 'Current password does not match.' });
      }
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update Neon Cloud
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      try {
        const pool = getPool();
        await pool.query(
          'UPDATE users SET password_hash = $1 WHERE (LOWER(email) = $2 AND $2 != \'\') OR (id = $3 AND $3 != \'\')',
          [newPasswordHash, cleanEmail, targetUserId]
        );
      } catch (dbErr) {
        console.warn('[AUTH] Error updating password in db:', dbErr.message);
      }
    }

    // Update local users.json
    const localUsers = readJsonFile('users.json', []) || [];
    const idx = localUsers.findIndex(u => (u.email?.trim().toLowerCase() === cleanEmail && cleanEmail !== '') || (u.id === targetUserId && targetUserId !== ''));
    if (idx !== -1) {
      localUsers[idx].password_hash = newPasswordHash;
      delete localUsers[idx].password;
      writeJsonFile('users.json', localUsers);
    }

    return res.status(200).json({ success: true, message: 'Password updated securely.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/auth/customer-sync
 * Upserts customer profile to Neon Cloud and local storage users.json with safe password hashing
 */
router.post('/customer-sync', async (req, res) => {
  try {
    const { id, email, previousEmail, firstName, lastName, phone, addresses, cart, password } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required for sync.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userId = id || `usr_${Date.now()}`;
    const cleanFirst = firstName ? firstName.trim() : '';
    const cleanLast = lastName ? lastName.trim() : '';
    const cleanPhone = phone ? phone.trim() : '';
    const safeAddresses = Array.isArray(addresses) ? addresses : [];
    const safeCart = Array.isArray(cart) ? cart : [];

    // If password provided in sync, hash it before writing
    let passwordHash = null;
    if (password && typeof password === 'string' && password.trim().length >= 6) {
      passwordHash = password.startsWith('$2') ? password : await bcrypt.hash(password, 10);
    }

    const userObj = {
      id: userId,
      email: cleanEmail,
      firstName: cleanFirst,
      lastName: cleanLast,
      phone: cleanPhone,
      addresses: safeAddresses,
      cart: safeCart,
      role: 'customer',
    };

    // 1. Sync to Neon Cloud Database
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      try {
        const pool = getPool();
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS cart TEXT DEFAULT '[]';`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);`);

        // If email was changed from a previous email address, migrate linked orders and inquiries
        if (previousEmail && previousEmail.trim().toLowerCase() !== cleanEmail) {
          const oldEmail = previousEmail.trim().toLowerCase();
          try {
            await pool.query('UPDATE users SET email = $1 WHERE (LOWER(email) = $2 OR id = $3)', [cleanEmail, oldEmail, userId]);
            await pool.query('UPDATE orders SET email = $1 WHERE LOWER(email) = $2', [cleanEmail, oldEmail]);
            await pool.query('UPDATE contact_inquiries SET email = $1 WHERE LOWER(email) = $2 OR user_id = $3', [cleanEmail, oldEmail, userId]);
          } catch (migErr) {
            console.warn('Email rename migration notice:', migErr.message);
          }
        }

        await pool.query(`
          INSERT INTO users (id, email, first_name, last_name, phone, role, addresses, cart, password_hash)
          VALUES ($1, $2, $3, $4, $5, 'customer', $6, $7, $8)
          ON CONFLICT (email) DO UPDATE SET
            first_name = CASE WHEN EXCLUDED.first_name != '' THEN EXCLUDED.first_name ELSE users.first_name END,
            last_name = CASE WHEN EXCLUDED.last_name != '' THEN EXCLUDED.last_name ELSE users.last_name END,
            phone = CASE WHEN EXCLUDED.phone != '' THEN EXCLUDED.phone ELSE users.phone END,
            addresses = CASE WHEN jsonb_array_length(EXCLUDED.addresses) > 0 THEN EXCLUDED.addresses ELSE users.addresses END,
            cart = CASE WHEN EXCLUDED.cart != '[]' THEN EXCLUDED.cart ELSE users.cart END,
            password_hash = CASE WHEN EXCLUDED.password_hash IS NOT NULL THEN EXCLUDED.password_hash ELSE users.password_hash END
        `, [userId, cleanEmail, cleanFirst, cleanLast, cleanPhone, JSON.stringify(safeAddresses), JSON.stringify(safeCart), passwordHash]);
      } catch (dbErr) {
        console.warn('Could not upsert customer to cloud db:', dbErr.message);
      }
    }

    // 2. Sync to local storage users.json
    const localUsers = readJsonFile('users.json', []) || [];
    const idx = localUsers.findIndex((u) => 
      (u.email?.trim().toLowerCase() === cleanEmail) || 
      (previousEmail && u.email?.trim().toLowerCase() === previousEmail.trim().toLowerCase()) ||
      (u.id === userId)
    );
    if (idx !== -1) {
      localUsers[idx] = {
        ...localUsers[idx],
        ...userObj,
        firstName: cleanFirst || localUsers[idx].firstName || '',
        lastName: cleanLast || localUsers[idx].lastName || '',
        phone: cleanPhone || localUsers[idx].phone || '',
        addresses: safeAddresses.length > 0 ? safeAddresses : (localUsers[idx].addresses || []),
        cart: safeCart.length > 0 ? safeCart : (localUsers[idx].cart || []),
        password_hash: passwordHash || localUsers[idx].password_hash || undefined,
      };
      delete localUsers[idx].password; // strip any plain password
    } else {
      localUsers.push({
        ...userObj,
        password_hash: passwordHash || undefined,
      });
    }
    writeJsonFile('users.json', localUsers);

    return res.status(200).json({ success: true, user: userObj });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
