# 🎬 Movie-SQL

A full-stack movie discovery web application built with **Vue 3**, **Node.js/Express**, and **MySQL**. Users can search for movies, view details, manage a personal favorites list, browse the latest releases, and explore filmographies by director — all powered by the OMDb API and Wikipedia scraping.

---

## 🚀 Tech Stack

| Layer     | Technology                        |
| --------- | --------------------------------- |
| Frontend  | Vue 3, Vite                       |
| Backend   | Node.js, Express (CommonJS)       |
| Database  | MySQL (`movies_db`)               |
| Auth      | JWT (`jsonwebtoken`) + bcrypt     |
| APIs      | OMDb API, Wikipedia (via Cheerio) |
| Scheduler | node-cron                         |

---

## 📁 Project Structure

```
Movie-SQL/
├── backend/             # Additional backend utilities
├── public/              # Static assets
├── src/                 # Vue 3 frontend components
├── server.cjs           # Main Express server
├── serverfreedb.cjs     # Alternate server (free DB config)
├── index.html           # Vite entry point
├── vite.config.js       # Vite configuration
├── package.json
└── README.md
```

---

## 🗄️ Database Schema

The app auto-creates the following MySQL tables on server start:

| Table             | Description                                  |
| ----------------- | -------------------------------------------- |
| `login_details`   | User accounts (name, email, hashed password) |
| `favorite_movies` | Per-user saved movies (FK → login_details)   |
| `latest_releases` | Auto-populated recent movie releases         |
| `director_movies` | Cached filmography results by director       |

---

## ⚙️ Features

- 🔍 **Movie Search** — Search movies by title via OMDb API
- 🎬 **Movie Details** — View full plot, cast, director, rating, runtime
- ❤️ **Favorites** — Save and manage a personal favorites list (auth-protected)
- 🆕 **Latest Releases** — Auto-scraped from Wikipedia + enriched via OMDb
- 🎥 **Director Filmography** — Search all movies by a specific director (Wikipedia + OMDb)
- 🎭 **Similar Movies** — Genre-based recommendations from local DB
- 🔐 **Auth** — JWT-based register/login with bcrypt password hashing

---

## 🛠️ Setup & Installation

### Prerequisites

- Node.js v18+
- MySQL running locally
- OMDb API key (free at [omdbapi.com](https://www.omdbapi.com/))

### 1. Clone the repository

```bash
git clone https://github.com/vishnukarthik29/Movie-SQL.git
cd Movie-SQL
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the database

Create a MySQL database:

```sql
CREATE DATABASE movies_db;
```

Update credentials in `server.cjs` if needed:

```js
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "movies_db",
});
```

> Tables are auto-created on server startup — no manual migration needed.

### 4. Run the backend

```bash
node server.cjs
```

Server runs on `http://localhost:3001`

### 5. Run the frontend (development)

```bash
npm run dev
```

### 6. Build for production

```bash
npm run build
```

The Express server serves the `dist/` folder automatically.

---

## 🔌 API Endpoints

| Method | Endpoint                            | Auth | Description                   |
| ------ | ----------------------------------- | ---- | ----------------------------- |
| POST   | `/api/auth/register`                | ❌   | Register a new user           |
| POST   | `/api/auth/login`                   | ❌   | Login and receive JWT token   |
| GET    | `/api/search?title=`                | ❌   | Search movies by title (OMDb) |
| GET    | `/api/movie/:id`                    | ❌   | Get movie details by IMDb ID  |
| GET    | `/latest-releases`                  | ❌   | Fetch latest releases from DB |
| GET    | `/api/similar-movies?genre=`        | ❌   | Get similar movies by genre   |
| GET    | `/api/search-by-director?director=` | ❌   | Fetch director's filmography  |
| POST   | `/api/favorites`                    | ✅   | Save a movie to favorites     |
| GET    | `/api/favorites`                    | ✅   | Get user's favorite movies    |
| DELETE | `/api/favorites/:imdbId`            | ✅   | Remove a movie from favorites |

> ✅ = Requires `Authorization: Bearer <token>` header

---

## 🔄 Latest Releases Auto-Update

The server includes a `updateLatestReleases()` function that:

1. Scrapes the Wikipedia list of American films for the previous year
2. Fetches full details for each film from OMDb
3. Stores them in the `latest_releases` table

To trigger manually, uncomment in `server.cjs`:

```js
// updateLatestReleases();
```

---

## 📦 Key Dependencies

```json
"express"       - REST API server
"mysql2"        - MySQL client with Promise support
"axios"         - HTTP requests to OMDb & Wikipedia
"cheerio"       - HTML scraping (Wikipedia)
"bcrypt"        - Password hashing
"jsonwebtoken"  - JWT auth
"date-fns"      - Date formatting
"node-cron"     - Scheduled tasks
"cors"          - Cross-origin requests
"dotenv"        - Environment variables
```

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Vishnukarthik S**  
[vishnukarthik.me](https://vishnukarthik.me/) · +91 8668131033
