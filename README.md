# GeoHistory

A collaborative web application to map historical events on a global map. Users can contribute events that are reviewed by super users before appearing on the map and timeline.

## Features

- 🌍 Global map using Leaflet and OpenStreetMap (free, open-source)
- 📅 Full date support (year/month/day) for historical accuracy
- 👥 User authentication with role-based access (Supabase - free tier)
- 🔍 Timeline bar that filters events by year
- ✅ Event approval system for data quality
- 📍 Right-click on map to add events with exact coordinates
- 👤 User roles: Regular users (submit events) and Super users (approve events)
- 🔄 Real-time updates with Supabase subscriptions

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Map**: Leaflet with OpenStreetMap (free)
- **Backend**: Supabase (PostgreSQL database, authentication, real-time)
- **Deployment**: Vercel (free tier)

## Quick Start

### 1. Clone and Install

```bash
npm install
```

### 2. Set up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > API and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Create Database Tables

In Supabase SQL Editor, run the SQL from `DATABASE_SETUP.sql`:

```bash
# Copy the entire content from DATABASE_SETUP.sql and paste it into Supabase SQL Editor
```

This creates:
- **users**: id, email, full_name, role (regular/super_user), created_at
- **events**: id, user_id, lat, lng, title, description, event_date (YYYY-MM-DD), characters (array), status (pending/approved), created_at
- **characters**: id, name, description, created_at

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

### Regular Users
1. Sign up/Login at `/auth`
2. Go to `/map`
3. Right-click on any location to add a historical event
4. Fill in: title, date (full day/month/year), description, historical figures
5. Submit for approval (status: pending)

### Super Users
1. Access `/admin` panel
2. Review pending events
3. Approve or reject events
4. Approved events appear on map and timeline

### View Historical Events
- **Map View** (`/map`): Select year from timeline bar at top, events appear as markers
- **Timeline View** (`/timeline`): Browse events chronologically by year

## Database Schema

### users table
```sql
- id (UUID, primary key)
- email (TEXT, unique)
- full_name (TEXT)
- role (TEXT: 'regular' or 'super_user')
- created_at (TIMESTAMP)
```

### events table
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key → users)
- lat (FLOAT)
- lng (FLOAT)
- title (TEXT)
- description (TEXT)
- event_date (DATE) -- Full date: YYYY-MM-DD
- characters (JSONB) -- Array of Historical figures
- status (TEXT: 'pending' or 'approved')
- created_at (TIMESTAMP)
```

### characters table
```sql
- id (UUID, primary key)
- name (TEXT, unique)
- description (TEXT)
- created_at (TIMESTAMP)
```

## Deployment

### Deploy to Vercel (Free)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy

## Free Resources Used

- **Supabase**: Free tier includes 500 MB database, 2 GB bandwidth
- **Leaflet**: Open-source, free
- **OpenStreetMap**: Open-source, free tiles
- **Next.js**: Open-source, free
- **Vercel**: Free tier for hosting

## Future Enhancements

- Add image uploads for events
- Search and filter events
- Export timeline as PDF
- Historical character profiles
- Advanced map clustering
- User ratings/reviews of events

## License

MIT