# Design Document

## 1. Architecture Overview

```
pifpafai-bloggers/
├── backend/
│   ├── server.js          # Express.js main server
│   ├── config/
│   │   └── database.js    # MySQL connection
│   ├── routes/
│   │   ├── auth.js        # Login/register endpoints
│   │   └── reels.js       # Reels CRUD endpoints
│   ├── middleware/
│   │   └── auth.js        # JWT verification
│   └── services/
│       └── apifay.js      # APIFAY integration
├── frontend/
│   ├── index.html         # Main page (login/dashboard)
│   ├── css/
│   │   └── style.css      # Pinterest-style design
│   └── js/
│       └── app.js         # Frontend logic
├── database/
│   └── schema.sql         # MySQL schema
└── package.json
```

## 2. Database Schema

```sql
-- Users table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reels table
CREATE TABLE reels (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  reel_url VARCHAR(500) NOT NULL,
  reel_id VARCHAR(255),
  views INT DEFAULT 0,
  thumbnail_url VARCHAR(500),
  published_at DATE,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 3. API Endpoints

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login, returns JWT
- `GET /api/auth/me` - Get current user

### Reels
- `GET /api/reels` - Get all reels for authenticated user
- `POST /api/reels` - Add new Reel URL, fetches from APIFAY
- `DELETE /api/reels/:id` - Delete Reel
- `POST /api/reels/:id/refresh` - Manual refresh from APIFAY

### Analytics
- `GET /api/analytics/summary` - Get stats summary

## 4. APIFAY Integration

```javascript
// APIFAY request format
const response = await fetch(`https://api.apifay.com/instagram/reel?url=${reelUrl}&apikey=${API_KEY}`);
const data = await response.json();
// Extract: data.views, data.thumbnail, data.published_at
```

## 5. Frontend Design

**Style:** Pinterest-like masonry grid matching pifpafai.com aesthetic
- Dark theme with accent colors
- Card-based Reel display
- Responsive 3-4 column grid
- Smooth hover animations

**Pages:**
1. Login/Register page
2. Dashboard with:
   - Stats cards (total views, avg, count)
   - Pinterest grid of Reels
   - Add Reel form
   - Top performers list

## 6. Security

- Passwords: bcrypt with salt round 10
- Auth: JWT with 24h expiration
- API: Rate limiting, input validation
- CORS enabled for frontend domain