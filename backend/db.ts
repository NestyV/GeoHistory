import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'geohistory',
  user: process.env.DB_USER || 'geohistory_user',
  password: process.env.DB_PASSWORD || 'Aregua10#',
});

export default pool;
