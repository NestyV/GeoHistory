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
  password: process.env.DB_PASSWORD || 'change_this_password_12345',
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

// Helper: Verificar si es super_user
const isSuperUser = async (userId) => {
  const result = await pool.query(
    'SELECT role FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0]?.role === 'super_user';
};

// Helper: Verificar si es al menos curator (curator o super_user)
const isAtLeastCurator = async (userId) => {
  const result = await pool.query(
    'SELECT role FROM users WHERE id = $1',
    [userId]
  );
  const role = result.rows[0]?.role;
  return role === 'curator' || role === 'super_user';
};

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, full_name, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, full_name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role',
      [email, full_name || null, hashedPassword, 'regular']
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '7d' }
    );

    res.status(201).json({ message: 'User created successfully', user, token });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await pool.query(
      'SELECT id, email, full_name, role, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '7d' }
    );

    res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
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

app.get('/api/events', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT e.id, e.user_id, e.frame_id, e.place_id, COALESCE(e.lat, p.lat) as lat, COALESCE(e.lng, p.lng) as lng, e.title, e.description, e.event_date, e.characters, e.status, e.created_at, p.current_name as place_name, p.previous_name as place_previous_name, pt.name as place_type_name, pt.icon as place_type_icon FROM events e LEFT JOIN places p ON e.place_id = p.id LEFT JOIN place_types pt ON p.place_type_id = pt.id WHERE e.status = $1 ORDER BY e.event_date DESC',
      ['approved']
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Server error fetching events' });
  }
});

app.get('/api/events/my', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.id, e.user_id, e.frame_id, e.place_id,
        COALESCE(e.lat, p.lat) as lat,
        COALESCE(e.lng, p.lng) as lng,
        e.title, e.description, e.event_date, e.characters, e.status, e.created_at,
        p.current_name as place_name,
        p.previous_name as place_previous_name,
        pt.name as place_type_name,
        pt.icon as place_type_icon
      FROM events e
      LEFT JOIN places p ON e.place_id = p.id
      LEFT JOIN place_types pt ON p.place_type_id = pt.id
      WHERE e.user_id = $1
      ORDER BY e.created_at DESC
      `, [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ error: 'Server error fetching events' });
  }
});

// POST /api/events - Create a new event (supports place_id or legacy lat/lng)
app.post('/api/events', authenticateToken, async (req, res) => {
  try {
    const { frame_id, place_id, lat, lng, title, description, event_date, characters } = req.body;

    if (!title || !event_date) {
      return res.status(400).json({ error: 'Missing required fields: title, event_date' });
    }

    let final_place_id = place_id;
    let final_lat = lat;
    let final_lng = lng;

    // Si no se proporcionó place_id pero se proporcionaron lat/lng, buscar o crear lugar
    if (!final_place_id && final_lat !== undefined && final_lng !== undefined) {
      // Buscar lugar existente cercano (radio de 100 metros aproximadamente)
      const existingPlace = await pool.query(
        `SELECT id FROM places
         WHERE ABS(lat - $1) < 0.001 AND ABS(lng - $2) < 0.001
         LIMIT 1`,
        [final_lat, final_lng]
      );

      if (existingPlace.rows.length > 0) {
        final_place_id = existingPlace.rows[0].id;
      } else {
        // Crear lugar temporal con un tipo por defecto (Ciudad)
        const defaultPlaceType = await pool.query(
          "SELECT id FROM place_types WHERE name = 'Ciudad' LIMIT 1"
        );

        if (defaultPlaceType.rows.length > 0) {
          const newPlace = await pool.query(
            `INSERT INTO places (place_type_id, current_name, lat, lng)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [defaultPlaceType.rows[0].id, `Lugar: ${title.substring(0, 50)}`, final_lat, final_lng]
          );
          final_place_id = newPlace.rows[0].id;
        }
      }
    }

    if (!final_place_id) {
      return res.status(400).json({ error: 'Se requiere place_id o coordenadas (lat/lng)' });
    }

    const result = await pool.query(
      `INSERT INTO events (user_id, frame_id, place_id, title, description, event_date, characters, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, frame_id || null, final_place_id, title, description || null, event_date, JSON.stringify(characters || []), 'pending']
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

app.patch('/api/events/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!await isAtLeastCurator(req.user.id)) {
      return res.status(403).json({ error: 'Se requieren permisos de Curador o Administrador' });
    }

    const result = await pool.query(
      'UPDATE events SET status = $1 WHERE id = $2 RETURNING *',
      ['approved', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event approved', event: result.rows[0] });
  } catch (error) {
    console.error('Error approving event:', error);
    res.status(500).json({ error: 'Server error approving event' });
  }
});

app.put('/api/events/:id', authenticateToken, async (req, res) => {
  try {
    if (!await isAtLeastCurator(req.user.id)) {
      return res.status(403).json({ error: 'Se requieren permisos de Curador o Administrador' });
    }
    
    const { id } = req.params;
    const { title, description, event_date, frame_id, lat, lng, characters } = req.body;
    
    // Validar campos requeridos
    if (!title || !event_date || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    
    const result = await pool.query(
      `UPDATE events 
       SET title = $1, description = $2, event_date = $3, frame_id = $4, 
           lat = $5, lng = $6, characters = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [title, description || null, event_date, frame_id || null, lat, lng, JSON.stringify(characters || []), id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    
    res.json({ message: 'Evento actualizado correctamente', event: result.rows[0] });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Error al actualizar el evento' });
  }
});

app.delete('/api/events/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!await isSuperUser(req.user.id)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING id', [id]);

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

app.get('/api/characters', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, alias, description, image_url, created_at FROM characters ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).json({ error: 'Server error fetching characters' });
  }
});

app.post('/api/characters', authenticateToken, async (req, res) => {
  try {
    // Permitir a cualquier usuario autenticado crear personajes
    //if (!await isAtLeastCurator(req.user.id)) {
    //  return res.status(403).json({ error: 'Se requieren permisos de Curador o Administrador' });
    //}

    const { name, alias, description, image_url } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }

    const result = await pool.query(
      'INSERT INTO characters (name, alias, description, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, alias || null, description || null, image_url || null]
    );

    res.status(201).json({ message: 'Character created successfully', character: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Character name already exists' });
    }
    console.error('Error creating character:', error);
    res.status(500).json({ error: 'Server error creating character' });
  }
});

app.put('/api/characters/:id', authenticateToken, async (req, res) => {
  try {
    if (!await isAtLeastCurator(req.user.id)) {
      return res.status(403).json({ error: 'Se requieren permisos de Curador o Administrador' });
    }

    const { id } = req.params;
    const { name, alias, description, image_url } = req.body;

    const result = await pool.query(
      'UPDATE characters SET name = $1, alias = $2, description = $3, image_url = $4 WHERE id = $5 RETURNING *',
      [name, alias || null, description || null, image_url || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json({ message: 'Character updated successfully', character: result.rows[0] });
  } catch (error) {
    console.error('Error updating character:', error);
    res.status(500).json({ error: 'Server error updating character' });
  }
});

app.delete('/api/characters/:id', authenticateToken, async (req, res) => {
  try {
    if (!await isAtLeastCurator(req.user.id)) {
      return res.status(403).json({ error: 'Se requieren permisos de Curador o Administrador' });
    }

    const { id } = req.params;
    const result = await pool.query('DELETE FROM characters WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json({ message: 'Character deleted successfully' });
  } catch (error) {
    console.error('Error deleting character:', error);
    res.status(500).json({ error: 'Server error deleting character' });
  }
});

// ============================================================================
// FRAMES ENDPOINTS
// ============================================================================

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

app.post('/api/frames', authenticateToken, async (req, res) => {
  try {
    if (!await isAtLeastCurator(req.user.id)) {
      return res.status(403).json({ error: 'Se requieren permisos de Curador o Administrador' });
    }

    const { name, description, start_date, end_date } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }

    const result = await pool.query(
      'INSERT INTO frames (name, description, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description || null, start_date || null, end_date || null]
    );

    res.status(201).json({ message: 'Frame created successfully', frame: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Frame name already exists' });
    }
    console.error('Error creating frame:', error);
    res.status(500).json({ error: 'Server error creating frame' });
  }
});

app.put('/api/frames/:id', authenticateToken, async (req, res) => {
  try {
    if (!await isAtLeastCurator(req.user.id)) {
      return res.status(403).json({ error: 'Se requieren permisos de Curador o Administrador' });
    }

    const { id } = req.params;
    const { name, description, start_date, end_date } = req.body;

    const result = await pool.query(
      'UPDATE frames SET name = $1, description = $2, start_date = $3, end_date = $4 WHERE id = $5 RETURNING *',
      [name, description || null, start_date || null, end_date || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Frame not found' });
    }

    res.json({ message: 'Frame updated successfully', frame: result.rows[0] });
  } catch (error) {
    console.error('Error updating frame:', error);
    res.status(500).json({ error: 'Server error updating frame' });
  }
});

app.delete('/api/frames/:id', authenticateToken, async (req, res) => {
  try {
    if (!await isAtLeastCurator(req.user.id)) {
      return res.status(403).json({ error: 'Se requieren permisos de Curador o Administrador' });
    }

    const { id } = req.params;
    const result = await pool.query('DELETE FROM frames WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Frame not found' });
    }

    res.json({ message: 'Frame deleted successfully' });
  } catch (error) {
    console.error('Error deleting frame:', error);
    res.status(500).json({ error: 'Server error deleting frame' });
  }
});

// ============================================================================
// USER PREFERENCES ENDPOINTS
// ============================================================================

app.get('/api/user/preferences', authenticateToken, async (req, res) => {
  try {
    console.log("🔍 Buscando preferencias para usuario:", req.user.id);
    const result = await pool.query(
      'SELECT last_frame_id, last_year, last_lat, last_lng, last_zoom FROM user_preferences WHERE user_id = $1',
      [req.user.id]
    );
    
    console.log("📊 Resultado:", result.rows);
    if (result.rows.length === 0) {
      console.log('📭 No se encontraron preferencias para usuario:', req.user.id);
      return res.json({ hasPreferences: false });
    }
    
    console.log('✅ Preferencias encontradas:', result.rows[0]);
    res.json({
      hasPreferences: true,
      preferences: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ error: 'Error al obtener preferencias' });
  }
});

app.post('/api/user/preferences', authenticateToken, async (req, res) => {
  try {
    const { last_frame_id, last_year, last_lat, last_lng, last_zoom } = req.body;
    
    const result = await pool.query(
      `INSERT INTO user_preferences (user_id, last_frame_id, last_year, last_lat, last_lng, last_zoom, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         last_frame_id = EXCLUDED.last_frame_id,
         last_year = EXCLUDED.last_year,
         last_lat = EXCLUDED.last_lat,
         last_lng = EXCLUDED.last_lng,
         last_zoom = EXCLUDED.last_zoom,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.user.id, last_frame_id || null, last_year || null, last_lat || null, last_lng || null, last_zoom || null]
    );
    
    res.json({ message: 'Preferencias guardadas', preferences: result.rows[0] });
  } catch (error) {
    console.error('Error saving user preferences:', error);
    res.status(500).json({ error: 'Error al guardar preferencias' });
  }
});

app.delete('/api/user/preferences', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM user_preferences WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Preferencias eliminadas' });
  } catch (error) {
    console.error('Error deleting user preferences:', error);
    res.status(500).json({ error: 'Error al eliminar preferencias' });
  }
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

app.get('/api/admin/events/pending', authenticateToken, async (req, res) => {
  try {
    if (!await isAtLeastCurator(req.user.id)) {
      return res.status(403).json({ error: 'Se requieren permisos de Curador o Administrador' });
    }

    const result = await pool.query(
      `
      SELECT
        e.id, e.user_id, e.frame_id, e.place_id,
        COALESCE(e.lat, p.lat) as lat,
        COALESCE(e.lng, p.lng) as lng,
        e.title, e.description, e.event_date, e.characters, e.status, e.created_at,
        u.email, u.full_name,
        p.current_name as place_name,
        p.previous_name as place_previous_name,
        pt.name as place_type_name,
        pt.icon as place_type_icon
      FROM events e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN places p ON e.place_id = p.id
      LEFT JOIN place_types pt ON p.place_type_id = pt.id
      WHERE e.status = $1
      ORDER BY e.created_at ASC
       `,
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 GeoHistory Backend running on port ${PORT}`);
  console.log(`📝 API URL: http://localhost:${PORT}`);
  console.log(`🗄️ Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});

process.on('SIGINT', async () => {
  console.log('\n📍 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

// ============================================================================
// PLACE TYPES ENDPOINTS (CRUD)
// ============================================================================

// GET /api/place-types - Obtener todos los tipos de lugar
app.get('/api/place-types', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, icon, created_at FROM place_types ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching place types:', error);
    res.status(500).json({ error: 'Error al obtener tipos de lugar' });
  }
});

// GET /api/place-types/:id - Obtener un tipo de lugar por ID
app.get('/api/place-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, name, description, icon, created_at FROM place_types WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tipo de lugar no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching place type:', error);
    res.status(500).json({ error: 'Error al obtener tipo de lugar' });
  }
});

// POST /api/place-types - Crear un nuevo tipo de lugar (Curador/Admin)
app.post('/api/place-types', authenticateToken, async (req, res) => {
  try {
    if (!await isAtLeastCurator(req.user.id)) {
      return res.status(403).json({ error: 'Se requieren permisos de Curador o Administrador' });
    }
    
    const { name, description, icon } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    
    const result = await pool.query(
      'INSERT INTO place_types (name, description, icon) VALUES ($1, $2, $3) RETURNING *',
      [name, description || null, icon || null]
    );
    
    res.status(201).json({ message: 'Tipo de lugar creado', place_type: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'El nombre del tipo de lugar ya existe' });
    }
    console.error('Error creating place type:', error);
    res.status(500).json({ error: 'Error al crear tipo de lugar' });
  }
});

// PUT /api/place-types/:id - Actualizar un tipo de lugar (Curador/Admin)
app.put('/api/place-types/:id', authenticateToken, async (req, res) => {
  try {
    if (!await isAtLeastCurator(req.user.id)) {
      return res.status(403).json({ error: 'Se requieren permisos de Curador o Administrador' });
    }
    
    const { id } = req.params;
    const { name, description, icon } = req.body;
    
    const result = await pool.query(
      'UPDATE place_types SET name = $1, description = $2, icon = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, description || null, icon || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tipo de lugar no encontrado' });
    }
    
    res.json({ message: 'Tipo de lugar actualizado', place_type: result.rows[0] });
  } catch (error) {
    console.error('Error updating place type:', error);
    res.status(500).json({ error: 'Error al actualizar tipo de lugar' });
  }
});

// DELETE /api/place-types/:id - Eliminar un tipo de lugar (Curador/Admin)
app.delete('/api/place-types/:id', authenticateToken, async (req, res) => {
  try {
    if (!await isAtLeastCurator(req.user.id)) {
      return res.status(403).json({ error: 'Se requieren permisos de Curador o Administrador' });
    }
    
    const { id } = req.params;
    
    // Verificar si hay lugares usando este tipo
    const checkResult = await pool.query(
      'SELECT COUNT(*) FROM places WHERE place_type_id = $1',
      [id]
    );
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el tipo de lugar porque hay lugares asociados' 
      });
    }
    
    const result = await pool.query('DELETE FROM place_types WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tipo de lugar no encontrado' });
    }
    
    res.json({ message: 'Tipo de lugar eliminado' });
  } catch (error) {
    console.error('Error deleting place type:', error);
    res.status(500).json({ error: 'Error al eliminar tipo de lugar' });
  }
});

// ============================================================================
// PLACES ENDPOINTS (CRUD)
// ============================================================================

// GET /api/places - Obtener todos los lugares
app.get('/api/places', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.current_name, p.previous_name, p.lat, p.lng, 
             p.place_type_id, pt.name as place_type_name, pt.icon as place_type_icon,
             p.created_at, p.updated_at
      FROM places p
      LEFT JOIN place_types pt ON p.place_type_id = pt.id
      ORDER BY p.current_name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ error: 'Error al obtener lugares' });
  }
});

// GET /api/places/nearby - Obtener lugares cercanos a una coordenada
app.get('/api/places/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Se requieren latitud y longitud' });
    }
    
    // Búsqueda por radio aproximado (en kilómetros)
    const result = await pool.query(`
      SELECT p.id, p.current_name, p.previous_name, p.lat, p.lng, 
             p.place_type_id, pt.name as place_type_name, pt.icon as place_type_icon,
             (6371 * acos(cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2)) 
             + sin(radians($1)) * sin(radians(lat)))) AS distance
      FROM places p
      LEFT JOIN place_types pt ON p.place_type_id = pt.id
      WHERE (6371 * acos(cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2)) 
             + sin(radians($1)) * sin(radians(lat)))) < $3
      ORDER BY distance ASC
    `, [lat, lng, radius]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    res.status(500).json({ error: 'Error al obtener lugares cercanos' });
  }
});

// GET /api/places/:id - Obtener un lugar por ID
app.get('/api/places/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT p.id, p.current_name, p.previous_name, p.lat, p.lng, 
             p.place_type_id, pt.name as place_type_name, pt.icon as place_type_icon,
             p.created_at, p.updated_at
      FROM places p
      LEFT JOIN place_types pt ON p.place_type_id = pt.id
      WHERE p.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lugar no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching place:', error);
    res.status(500).json({ error: 'Error al obtener lugar' });
  }
});

// POST /api/places - Crear un nuevo lugar (Curador/Admin)
app.post('/api/places', authenticateToken, async (req, res) => {
  try {
    //if (!await isAtLeastCurator(req.user.id)) {
    //  return res.status(403).json({ error: 'Se requieren permisos de Curador o Administrador' });
    //}
    
    const { place_type_id, current_name, previous_name, lat, lng } = req.body;
    
    if (!place_type_id || !current_name || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Faltan campos requeridos: place_type_id, current_name, lat, lng' });
    }
    
    const result = await pool.query(
      `INSERT INTO places (place_type_id, current_name, previous_name, lat, lng) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [place_type_id, current_name, previous_name || null, lat, lng]
    );
    
    res.status(201).json({ message: 'Lugar creado', place: result.rows[0] });
  } catch (error) {
    console.error('Error creating place:', error);
    res.status(500).json({ error: 'Error al crear lugar' });
  }
});

// PUT /api/places/:id - Actualizar un lugar (Curador/Admin)
app.put('/api/places/:id', authenticateToken, async (req, res) => {
  try {
    if (!await isAtLeastCurator(req.user.id)) {
      return res.status(403).json({ error: 'Se requieren permisos de Curador o Administrador' });
    }
    
    const { id } = req.params;
    const { place_type_id, current_name, previous_name, lat, lng } = req.body;
    
    const result = await pool.query(
      `UPDATE places SET 
         place_type_id = $1, current_name = $2, previous_name = $3, 
         lat = $4, lng = $5, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $6 RETURNING *`,
      [place_type_id, current_name, previous_name || null, lat, lng, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lugar no encontrado' });
    }
    
    res.json({ message: 'Lugar actualizado', place: result.rows[0] });
  } catch (error) {
    console.error('Error updating place:', error);
    res.status(500).json({ error: 'Error al actualizar lugar' });
  }
});

// DELETE /api/places/:id - Eliminar un lugar (Curador/Admin)
app.delete('/api/places/:id', authenticateToken, async (req, res) => {
  try {
    if (!await isAtLeastCurator(req.user.id)) {
      return res.status(403).json({ error: 'Se requieren permisos de Curador o Administrador' });
    }
    
    const { id } = req.params;
    
    // Verificar si hay eventos usando este lugar
    const checkResult = await pool.query(
      'SELECT COUNT(*) FROM events WHERE place_id = $1',
      [id]
    );
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el lugar porque hay eventos asociados' 
      });
    }
    
    const result = await pool.query('DELETE FROM places WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lugar no encontrado' });
    }
    
    res.json({ message: 'Lugar eliminado' });
  } catch (error) {
    console.error('Error deleting place:', error);
    res.status(500).json({ error: 'Error al eliminar lugar' });
  }
});

// ============================================================================
// CHARACTERS FILTERED BY FRAME
// ============================================================================

// GET /api/characters/by-frame/:frameId - Obtener personajes asociados a eventos de un marco
app.get('/api/characters/by-frame/:frameId', async (req, res) => {
  try {
    const { frameId } = req.params;
    const result = await pool.query(`
      SELECT DISTINCT c.id, c.name, c.alias, c.description, c.image_url, c.created_at
      FROM characters c
      JOIN events e ON e.characters ? c.name
      WHERE e.frame_id = $1
      ORDER BY c.name ASC
    `, [frameId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching characters by frame:', error);
    res.status(500).json({ error: 'Error al obtener personajes por marco' });
  }
});

// ============================================================================
// PLACES FILTERED BY FRAME
// ============================================================================

// GET /api/places/by-frame/:frameId - Obtener lugares asociados a eventos de un marco
app.get('/api/places/by-frame/:frameId', async (req, res) => {
  try {
    const { frameId } = req.params;
    const result = await pool.query(`
      SELECT DISTINCT p.id, p.current_name, p.previous_name, p.lat, p.lng, 
             p.place_type_id, pt.name as place_type_name, pt.icon as place_type_icon,
             p.created_at, p.updated_at
      FROM places p
      JOIN events e ON e.place_id = p.id
      LEFT JOIN place_types pt ON p.place_type_id = pt.id
      WHERE e.frame_id = $1
      ORDER BY p.current_name ASC
    `, [frameId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching places by frame:', error);
    res.status(500).json({ error: 'Error al obtener lugares por marco' });
  }
});
