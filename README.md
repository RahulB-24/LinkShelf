# LinkShelf

A full-stack bookmark management application for organizing web resources, built with React, Node.js, and PostgreSQL.

<img width="3199" height="1832" alt="Image" src="https://github.com/user-attachments/assets/745bebbc-3a24-425e-9830-0fec4e7450ca" />
<img width="3199" height="1833" alt="Image" src="https://github.com/user-attachments/assets/dd7507bb-ba5a-4b4a-96c7-ec7a108ef75d" />
## Features

### Core Functionality
- **Smart Bookmarking** - Automatically extracts title, description, and favicon from URLs
- **Collections** - Organize bookmarks into folders with auto-generated slugs
- **Tags** - Flexible tagging system with dedicated tag filtering
- **Full-text Search** - Search across titles, descriptions, URLs, and tags
- **Visit Tracking** - Track bookmark usage with visit counts

### User Experience
- **Dark Mode** - Theme toggle with system preference detection and persistence
- **Batch Operations** - Select multiple bookmarks to delete or move simultaneously
- **Import/Export** - Import from Chrome, Brave, or Firefox HTML exports; export as JSON
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Smooth Animations** - Page transitions and micro-interactions using Framer Motion

### Security
- **JWT Authentication** - Token-based authentication with 7-day expiry
- **Password Hashing** - bcrypt implementation with 10 salt rounds
- **Rate Limiting** - API protection at 500 requests per 15 minutes per IP
- **Input Validation** - Server-side validation on all endpoints

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS
- Framer Motion
- React Router
- Vite

### Backend
- Node.js with Express
- PostgreSQL (Supabase)
- JSON Web Tokens
- bcrypt
- express-validator

## Getting Started

### Prerequisites
- Node.js 18 or higher
- PostgreSQL database (or Supabase account)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/LinkShelf.git
cd LinkShelf
```

2. Install dependencies
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

3. Configure environment variables

Create `backend/.env`:
```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_super_secret_jwt_key
PORT=3001
FRONTEND_URL=http://localhost:5173
```

4. Run database migrations

Execute the SQL in `backend/migrations/001_schema.sql` on your database.

5. Start development servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

6. Open http://localhost:5173 in your browser.

## Project Structure

```
LinkShelf/
├── frontend/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route pages
│   ├── context/        # React context (Auth, Theme)
│   ├── services/       # API service functions
│   └── types/          # TypeScript type definitions
│
├── backend/
│   ├── routes/         # API route handlers
│   ├── middleware/     # Auth, validation, error handling
│   ├── config/         # Database configuration
│   └── migrations/     # SQL schema files
```

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create new account |
| POST | `/api/auth/login` | Authenticate user |
| GET | `/api/auth/me` | Get current user |

### Bookmarks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookmarks` | Retrieve all bookmarks |
| POST | `/api/bookmarks` | Create bookmark |
| PUT | `/api/bookmarks/:id` | Update bookmark |
| DELETE | `/api/bookmarks/:id` | Delete bookmark |
| POST | `/api/bookmarks/:id/visit` | Track visit |
| POST | `/api/bookmarks/scrape` | Scrape URL metadata |

### Collections
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/collections` | Retrieve all collections |
| POST | `/api/collections` | Create collection |
| PUT | `/api/collections/:id` | Update collection |
| DELETE | `/api/collections/:id` | Delete collection |

### Tags
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tags` | Retrieve all tags with counts |

## Deployment

### Frontend (Vercel)
1. Push repository to GitHub
2. Import project in Vercel dashboard
3. Set build command: `cd frontend && npm run build`
4. Set output directory: `frontend/dist`
5. Configure environment variables

### Backend (Render)
1. Create Web Service from GitHub repository
2. Set root directory: `backend`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Configure environment variables

## License

MIT License

## Author

Rahul B
