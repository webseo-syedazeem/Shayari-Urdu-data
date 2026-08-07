# ShayariUrdu.com - Multilingual Poetry Platform

A modern web platform for discovering and sharing Urdu, Hindi, Roman Urdu, and English poetry (Shayari). Features a clean frontend built with React + TypeScript + Vite, and a RESTful API backend with Express + Supabase.

## Features

### Current Features

- **Multilingual Poetry**: Browse shayari in Roman Urdu, Urdu, Hindi, and English
- **Poet Profiles**: Detailed pages for classical and contemporary poets
- **Topics & Collections**: Organized poetry by themes and curated collections
- **Interactive Dictionary**: Click words in shayari to see inline definitions
- **Digital Library**: Multilingual ebooks with language-specific content
- **Search & Filter**: Find poetry by form, mood, poet, language
- **Responsive Design**: Beautiful UI that works on all devices

### Backend API (New)

- **RESTful API**: Clean JSON endpoints for all content
- **Supabase Database**: PostgreSQL with Row Level Security
- **Type-Safe**: Full TypeScript implementation
- **Paginated Responses**: Efficient data loading
- **Ready for Growth**: Structured for WordPress import, auth, mobile apps

## Project Structure

```
project/
├── src/                          # Frontend React app
│   ├── components/               # Reusable UI components
│   ├── pages/                    # Route/page components
│   ├── data/                     # Current dummy data (to be migrated)
│   ├── services/
│   │   └── api.ts                # API service for backend calls
│   └── ...
├── backend/                      # Backend API server
│   ├── src/
│   │   ├── config/               # Database configuration
│   │   ├── routes/               # API endpoints
│   │   └── scripts/              # Utility scripts (seeding, etc.)
│   └── README.md                 # Backend documentation
├── dist/                         # Frontend build output
└── ...
```

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (free tier works)

### Initial Setup

1. **Clone and install dependencies:**
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```

2. **Configure environment:**

   The `.env` file should already contain your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Seed the database:**
   ```bash
   npm run seed
   ```
   This populates the database with sample poets, shayari, topics, etc.

### Running the Application

You'll need **two terminal windows**:

**Terminal 1 - Frontend (port 5173):**
```bash
npm run dev
```

**Terminal 2 - Backend API (port 3001):**
```bash
npm run dev:backend
```

Now open http://localhost:5173 in your browser!

### Building for Production

```bash
# Build frontend
npm run build

# Build backend
npm run build:backend
```

## API Documentation

See [backend/README.md](backend/README.md) for complete API documentation.

### Quick API Examples

All endpoints are prefixed with `/api`:

```bash
# Get all poets
curl http://localhost:3001/api/poets

# Get trending shayari
curl http://localhost:3001/api/shayari?sort=trending

# Get topics
curl http://localhost:3001/api/topics

# Search dictionary
curl http://localhost:3001/api/dictionary?query=khwahish
```

## Database Schema

The backend uses Supabase (PostgreSQL) with these main tables:

- **poets** - Poet biographical information
- **shayari** - Poetry entries with metadata
- **shayari_language_versions** - Multilingual text content
- **topics** - Categories for organizing content
- **collections** - Curated collections
- **ebooks** - Digital books with multilingual metadata
- **dictionary_entries** - Word definitions
- **chat_messages** - Comments/discussions
- **ad_slots** - Advertisement configuration

All tables have Row Level Security enabled. See the migrations in Supabase dashboard for full schema.

## Migration from Dummy Data to API

Currently, the frontend uses hardcoded dummy data (`src/data/dummyData.ts`). The backend API is ready for progressive migration:

### Using the API Service

```typescript
// Import the API service
import { api } from './services/api';

// Replace dummy data with API calls
const { data: poets } = await api.getPoets();
const { data: shayari } = await api.getShayari({ sort: 'trending' });
const poet = await api.getPoet('mirza-ghalib');
```

### Migration Steps (per page)

1. Import `api` service
2. Use `useState` and `useEffect` for data fetching
3. Add loading and error states
4. Replace dummy data with API responses
5. Test thoroughly

Example:
```typescript
const [poets, setPoets] = useState<Poet[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  api.getPoets().then(response => {
    setPoets(response.data);
    setLoading(false);
  });
}, []);
```

## Future Roadmap

### Phase 1: Content Import
- WordPress import script for existing poetry
- Bulk data migration tools
- Data validation and cleanup

### Phase 2: User Features
- User authentication (signup/login)
- Save favorites
- Create personal collections
- Comment on shayari

### Phase 3: Content Management
- Admin dashboard
- Content moderation
- Analytics and insights

### Phase 4: Mobile Apps
- React Native iOS app
- React Native Android app
- Shared API backend

### Phase 5: Enhancements
- Real-time collaborative features
- Advanced search (Elasticsearch)
- Recommendations engine
- Social sharing features

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide Icons

### Backend
- Node.js + Express
- TypeScript
- Supabase (PostgreSQL)
- CORS enabled
- RESTful JSON API

## Durable QStash Persistence

Admin tag and shayari writes update Redis first, then publish a signed QStash callback to `POST /api/internal/persist`. The callback persists the latest cached revision to Supabase. The Redis dirty set and five-minute flusher remain as a retry safety net.

Add these backend environment variables:

```env
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
BACKEND_PUBLIC_URL=https://api.example.com
```

`BACKEND_PUBLIC_URL` must be the public backend origin reachable by QStash. Use HTTPS in production; a plain HTTP IP sends callback traffic without transport encryption. QStash cannot call `localhost`. For local callback testing, either use a deployed backend URL or run the Upstash local development server with `npx @upstash/qstash-cli dev` and configure its forwarding URL.

The internal persistence endpoint consumes the raw request body and verifies the `Upstash-Signature` header before parsing JSON. Do not place JSON body parsing before this route.
## Development Notes

- Frontend runs on port 5173 (Vite default)
- Backend runs on port 3001
- Hot reload enabled for both
- Database migrations via Supabase dashboard
- All API responses are JSON
- CORS configured for local development

## Contributing

This is a private project. For questions or issues, contact the development team.

## License

Proprietary - All rights reserved
