import express from 'express';
import pool from '../lib/db';

const router = express.Router();

// Get all events
router.get('/events', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events WHERE status = $1', ['approved']);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create an event
router.post('/events', async (req, res) => {
  const { lat, lng, title, description, event_date, characters } = req.body;
  const userId = req.user.id; // You'll need authentication middleware
  
  try {
    const result = await pool.query(
      'INSERT INTO events (user_id, lat, lng, title, description, event_date, characters) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, lat, lng, title, description, event_date, characters || '[]']
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
