const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database Pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'geohistory',
  user: process.env.DB_USER || 'geohistory_user',
  password: process.env.DB_PASSWORD || 'password',
  max: parseInt(process.env.DB_POOL_SIZE) || 10,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Helper: Check if user is super_user
const isSuperUser = async (userId) => {
  const result = await pool.query(
    'SELECT role FROM users WHERE id = $1',
    [userId]
  );
  return result.rows.length > 0 && result.rows[0].role === 'super_user';
};

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

// POST /api/auth/signup - Register a new user
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, full_name, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, full_name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role',
      [email, full_name || null, hashedPassword, 'regular']
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user,
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// POST /api/auth/login - Authenticate user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Get user
    const result = await pool.query(
      'SELECT id, email, full_name, role, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ============================================================================
// EVENTS ENDPOINTS
// ============================================================================

// GET /api/events - Get all approved events (public)
app.get('/api/events', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, user_id, frame_id, lat, lng, title, description, event_date, characters, created_at FROM events WHERE status = $1 ORDER BY event_date DESC',
      ['approved']
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Server error fetching events' });
  }
});

// GET /api/events/my - Get user's own events
app.get('/api/events/my', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, user_id, frame_id, lat, lng, title, description, event_date, characters, status, created_at FROM events WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ error: 'Server error fetching events' });
  }
});

// POST /api/events - Create a new event
app.post('/api/events', authenticateToken, async (req, res) => {
  try {
    const { frame_id, lat, lng, title, description, event_date, characters } = req.body;

    if (!lat || !lng || !title || !event_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      'INSERT INTO events (user_id, frame_id, lat, lng, title, description, event_date, characters, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [req.user.id, frame_id || null, lat, lng, title, description || null, event_date, JSON.stringify(characters || []), 'pending']
    );

    res.status(201).json({
      message: 'Event created successfully (pending approval)',
      event: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Server error creating event' });
  }
});

// PATCH /api/events/:id/approve - Approve an event (super_user only)
app.patch('/api/events/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!await isSuperUser(req.user.id)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const result = await pool.query(
      'UPDATE events SET status = $1 WHERE id = $2 RETURNING *',
      ['approved', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      message: 'Event approved',
      event: result.rows[0],
    });
  } catch (error) {
    console.error('Error approving event:', error);
    res.status(500).json({ error: 'Server error approving event' });
  }
});

// DELETE /api/events/:id - Delete an event (super_user only)
app.delete('/api/events/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!await isSuperUser(req.user.id)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const result = await pool.query(
      'DELETE FROM events WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Server error deleting event' });
  }
});

// ============================================================================
// CHARACTERS ENDPOINTS
// ============================================================================

// GET /api/characters - Get all characters (public)
app.get('/api/characters', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, image_url, created_at FROM characters ORDER BY name ASC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).json({ error: 'Server error fetching characters' });
  }
});

// POST /api/characters - Create a new character (auth required)
app.post('/api/characters', authenticateToken, async (req, res) => {
  try {
    const { name, description, image_url } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }

    const result = await pool.query(
      'INSERT INTO characters (name, description, image_url) VALUES ($1, $2, $3) RETURNING *',
      [name, description || null, image_url || null]
    );

    res.status(201).json({
      message: 'Character created successfully',
      character: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Character name already exists' });
    }
    console.error('Error creating character:', error);
    res.status(500).json({ error: 'Server error creating character' });
  }
});

// ============================================================================
// FRAMES ENDPOINTS
// ============================================================================

// GET /api/frames - Get all historical frames (public)
app.get('/api/frames', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, start_date, end_date, created_at FROM frames ORDER BY start_date ASC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching frames:', error);
    res.status(500).json({ error: 'Server error fetching frames' });
  }
});

// POST /api/frames - Create a new frame (super_user only)
app.post('/api/frames', authenticateToken, async (req, res) => {
  try {
    if (!await isSuperUser(req.user.id)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { name, description, start_date, end_date } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }

    const result = await pool.query(
      'INSERT INTO frames (name, description, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description || null, start_date || null, end_date || null]
    );

    res.status(201).json({
      message: 'Frame created successfully',
      frame: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Frame name already exists' });
    }
    console.error('Error creating frame:', error);
    res.status(500).json({ error: 'Server error creating frame' });
  }
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

// GET /api/admin/events/pending - Get all pending events (super_user only)
app.get('/api/admin/events/pending', authenticateToken, async (req, res) => {
  try {
    if (!await isSuperUser(req.user.id)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const result = await pool.query(
      `SELECT e.id, e.user_id, e.frame_id, e.lat, e.lng, e.title, e.description, 
              e.event_date, e.characters, e.status, e.created_at, u.email, u.full_name
       FROM events e
       JOIN users u ON e.user_id = u.id
       WHERE e.status = $1
       ORDER BY e.created_at ASC`,
      ['pending']
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pending events:', error);
    res.status(500).json({ error: 'Server error fetching events' });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// ERROR HANDLING & SERVER START
// ============================================================================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 GeoHistory Backend running on port ${PORT}`);
  console.log(`📝 API URL: http://localhost:${PORT}`);
  console.log(`🗄️ Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n📍 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});
