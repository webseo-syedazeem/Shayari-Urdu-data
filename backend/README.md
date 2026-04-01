# ShayariUrdu.com Backend API

Express + TypeScript backend API with Supabase (PostgreSQL) database.

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Supabase project configured (credentials in parent `.env` file)

### Installation

```bash
cd backend
npm install
```

### Database Setup

The database schema is already created via Supabase migrations. To seed with sample data:

```bash
npm run seed
```

### Running the Server

Development mode (with hot reload):
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

The API server will run on `http://localhost:3001` by default.

## API Endpoints

### Poets

- `GET /api/poets` - List all poets
  - Query params: `page`, `pageSize`, `search`
- `GET /api/poets/:slug` - Get poet details with shayari counts

### Shayari

- `GET /api/shayari` - List shayari with filters
  - Query params: `page`, `pageSize`, `language`, `form`, `topic`, `sort`, `poetId`
  - Sort options: `trending`, `mostLoved`, `latest`
- `GET /api/shayari/:id` - Get shayari details with all language versions
- `GET /api/shayari/:id/chat` - Get chat messages for a shayari

### Topics

- `GET /api/topics` - List all topics with counts
- `GET /api/topics/:slug` - Get topic with associated shayari

### Collections

- `GET /api/collections` - List all collections
- `GET /api/collections/:slug` - Get collection with items

### Ebooks

- `GET /api/ebooks` - List ebooks
  - Query params: `page`, `pageSize`, `poetId`
- `GET /api/ebooks/:slug` - Get ebook details

### Dictionary

- `GET /api/dictionary` - Search dictionary entries
  - Query params: `query`, `page`, `pageSize`
- `GET /api/dictionary/:wordKey` - Get specific dictionary entry

### Ad Slots

- `GET /api/ad-slots` - List all active ad slots
- `GET /api/ad-slots/:key` - Get specific ad slot configuration

### Health Check

- `GET /api/health` - API health status

## Database Schema

### Core Tables

- **poets** - Poet information and biographical data
- **topics** - Categories for organizing shayari
- **shayari** - Main shayari/poetry entries
- **shayari_language_versions** - Multilingual text content
- **shayari_topics** - Many-to-many relationship
- **collections** - Curated collections of shayari
- **collection_items** - Items within collections
- **ebooks** - Digital books with multilingual metadata
- **dictionary_entries** - Urdu/Roman/Hindi/English word definitions
- **chat_messages** - Comments/discussions per shayari
- **ad_slots** - Configurable advertisement positions

## Frontend Integration

The frontend can use the provided API service:

```typescript
import { api } from './services/api';

// Fetch trending shayari
const { data } = await api.getShayari({ sort: 'trending', pageSize: 10 });

// Get poet details
const poet = await api.getPoet('mirza-ghalib');

// Search dictionary
const entries = await api.getDictionaryEntries({ query: 'khwahish' });
```

## Future Enhancements

### Planned Features

1. **WordPress Import** - Bulk import existing shayari from WordPress
2. **Authentication** - User accounts and JWT-based auth
3. **Write Operations** - POST/PUT/DELETE endpoints with proper authorization
4. **Real-time Chat** - WebSocket support for live comments
5. **Admin Panel** - CMS-style interface for content management
6. **Rate Limiting** - API throttling and abuse prevention
7. **Caching** - Redis layer for frequently accessed data
8. **Search** - Full-text search with Elasticsearch/Typesense
9. **Analytics** - Track popular shayari, user engagement
10. **Mobile Apps** - React Native apps using this API

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # Supabase client configuration
│   ├── routes/
│   │   ├── poets.ts              # Poet endpoints
│   │   ├── shayari.ts            # Shayari endpoints
│   │   ├── topics.ts             # Topic endpoints
│   │   ├── collections.ts        # Collection endpoints
│   │   ├── ebooks.ts             # Ebook endpoints
│   │   ├── dictionary.ts         # Dictionary endpoints
│   │   └── adSlots.ts            # Ad slot endpoints
│   ├── scripts/
│   │   └── seed.ts               # Database seeding
│   └── index.ts                  # Express app entry point
├── package.json
└── tsconfig.json
```

## Environment Variables

Required in parent `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Optional:

```env
PORT=3001
VITE_API_URL=http://localhost:3001/api
```

## Development Notes

- All tables have Row Level Security (RLS) enabled
- Current policies allow public READ and INSERT (for development)
- Write policies should be restricted in production
- The API returns JSON responses with consistent error handling
- Pagination is supported on list endpoints
- CORS is enabled for all origins (configure for production)
