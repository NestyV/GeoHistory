-- GENERATED FILE - Canonical DB schema for GeoHistory
-- Edit as needed, then recreate database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'regular' CHECK (role IN ('regular', 'super_user')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create frames (historical frameworks) table
CREATE TABLE IF NOT EXISTS frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  frame_id UUID REFERENCES frames(id) ON DELETE SET NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  characters JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create characters table
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_frame_id ON events(frame_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_lat_lng ON events(lat, lng);
CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(name);
CREATE INDEX IF NOT EXISTS idx_frames_start_date ON frames(start_date);

-- Insert seed data (optional demo data)
INSERT INTO frames (name, description, start_date, end_date) VALUES
  ('Ancient World', 'Period from 3000 BC to 500 AD', '3000-01-01', '0500-12-31'),
  ('Medieval Period', 'Period from 500 AD to 1500 AD', '0500-01-01', '1500-12-31'),
  ('Renaissance', 'Period from 1300 to 1700', '1300-01-01', '1700-12-31'),
  ('Industrial Revolution', 'Period from 1760 to 1840', '1760-01-01', '1840-12-31'),
  ('Modern Era', 'Period from 1900 to present', '1900-01-01', '2100-12-31')
ON CONFLICT (name) DO NOTHING;

INSERT INTO characters (name, description) VALUES
  ('Leonardo da Vinci', 'Italian polymath of the Renaissance'),
  ('Napoleon Bonaparte', 'French military commander and emperor'),
  ('Cleopatra', 'Queen of ancient Egypt'),
  ('Isaac Newton', 'English mathematician and physicist'),
  ('Marie Curie', 'Polish-born physicist and chemist')
ON CONFLICT (name) DO NOTHING;
