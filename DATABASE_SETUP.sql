-- GENERATED FILE - Do not edit directly.
-- Source: db/schema.sql
-- Generated at: 2026-02-20T02:06:10.499Z

-- Canonical DB schema for GeoHistory
-- Edit this file as the source of truth. Run `npm run db:generate` to update DATABASE_SETUP.sql

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'regular' CHECK (role IN ('regular', 'super_user')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create frames (historical frameworks) table
CREATE TABLE frames (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  frame_id UUID REFERENCES frames(id) ON DELETE SET NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  characters JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create characters table
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indices for better performance
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_frame_id ON events(frame_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_event_date ON events(event_date);

-- Set up Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE frames ENABLE ROW LEVEL SECURITY;

-- Users can read all user profiles
CREATE POLICY "Users can read all profiles" ON users
  FOR SELECT USING (true);

-- Authenticated users can insert their own profile
CREATE POLICY "Authenticated users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Authenticated users can update their own profile
CREATE POLICY "Authenticated users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Events: Everyone can read approved events
CREATE POLICY "Anyone can read approved events" ON events
  FOR SELECT USING (status = 'approved');

-- Events: Authenticated users can read their own pending events
CREATE POLICY "Users can read their own pending events" ON events
  FOR SELECT USING (
    auth.uid() = user_id AND status = 'pending'
  );

-- Events: Authenticated users can insert events
CREATE POLICY "Authenticated users can insert events" ON events
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Events: Super users can approve events
CREATE POLICY "Super users can update events" ON events
  FOR UPDATE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_user'
  );

-- Events: Only super users can delete events
CREATE POLICY "Super users can delete events" ON events
  FOR DELETE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_user'
  );

-- Characters: Everyone can read characters
CREATE POLICY "Anyone can read characters" ON characters
  FOR SELECT USING (true);

-- Characters: Authenticated users can insert characters
CREATE POLICY "Authenticated users can insert characters" ON characters
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Characters: Only super users can update characters
CREATE POLICY "Super users can update characters" ON characters
  FOR UPDATE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_user'
  );

-- Characters: Only super users can delete characters
CREATE POLICY "Super users can delete characters" ON characters
  FOR DELETE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_user'
  );

-- Frames: Everyone can read historical frames
CREATE POLICY "Anyone can read frames" ON frames
  FOR SELECT USING (true);

-- Frames: Only super users can create frames
CREATE POLICY "Super users can insert frames" ON frames
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_user'
  );

-- Frames: Only super users can update frames
CREATE POLICY "Super users can update frames" ON frames
  FOR UPDATE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_user'
  );

-- Frames: Only super users can delete frames
CREATE POLICY "Super users can delete frames" ON frames
  FOR DELETE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_user'
  );
