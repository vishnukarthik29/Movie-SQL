const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const axios = require("axios");
const { parse, format } = require("date-fns");
const cheerio = require("cheerio");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cron = require("node-cron");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "movies_db",
});

// Database initialization
db.connect(async (err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL database");
  const createLoginTable = `CREATE TABLE IF NOT EXISTS login_details (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`;

  // Create tables separately
  const createMoviesTable = `
  CREATE TABLE IF NOT EXISTS favorite_movies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    imdb_id VARCHAR(20) UNIQUE,
    title VARCHAR(255),
    year VARCHAR(10),
    runtime VARCHAR(255),
    genre VARCHAR(255),
    actors VARCHAR(255),
    director VARCHAR(255),
    poster VARCHAR(255),
    plot TEXT,
    rating DECIMAL(3,1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT, 
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES login_details(user_id) ON DELETE CASCADE
  )
`;

  const createLatestReleasesTable = `
    CREATE TABLE IF NOT EXISTS latest_releases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      imdb_id VARCHAR(20) UNIQUE,
      title VARCHAR(255),
      release_date DATE,
      year VARCHAR(10),
      runtime VARCHAR(255),
      genre VARCHAR(255),
      actors VARCHAR(255),
      director VARCHAR(255),
      poster VARCHAR(255),
      plot TEXT,
      rating DECIMAL(3,1),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Execute queries sequentially
  try {
    await db.promise().query(createLoginTable);
    console.log("Login table ready");

    await db.promise().query(createMoviesTable);
    console.log("Favorite Movies table ready");

    await db.promise().query(createLatestReleasesTable);
    console.log("Latest releases table ready");
  } catch (error) {
    console.error("Error creating tables:", error);
  }
});

// authorization
// Add these to your existing server.cjs
const JWT_SECRET = "your-secret-key"; // In production, use environment variable

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

//register and login
// Register endpoint
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const [existingUser] = await db
      .promise()
      .query("SELECT * FROM login_details WHERE email = ?", [email]);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await db
      .promise()
      .query(
        "INSERT INTO login_details (name, email, password) VALUES (?, ?, ?)",
        [name, email, hashedPassword]
      );

    const token = jwt.sign({ userId: result.insertId }, JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({ token, userId: result.insertId });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// Login endpoint
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db
      .promise()
      .query("SELECT * FROM login_details WHERE email = ?", [email]);

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, {
      expiresIn: "24h",
    });
    res.json({ token, userId: user.user_id });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

async function fetchMoviesFromWikipedia(year) {
  try {
    const url = `https://en.wikipedia.org/wiki/List_of_American_films_of_${year}`;
    console.log(`Fetching movie list from Wikipedia: ${url}`);

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const movieNames = [];

    // Wikipedia tables often have film titles in <i><a> tags
    $("table.wikitable tbody tr td i a").each((index, element) => {
      const movieTitle = $(element).text().trim();
      if (movieTitle) {
        movieNames.push(movieTitle);
      }
    });

    console.log(`Fetched ${movieNames.length} movies from Wikipedia`);
    return movieNames;
  } catch (error) {
    console.error("Error fetching Wikipedia data:", error);
    return [];
  }
}

async function getMovieDetails(title) {
  try {
    const response = await axios.get("https://www.omdbapi.com/", {
      params: {
        apikey: "bf4ec251",
        t: title, // Search by title
        plot: "full",
      },
    });

    if (response.data.Response === "True") {
      return response.data;
    } else {
      console.log(`Movie not found on OMDB: ${title}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching details for ${title}:`, error.message);
    return null;
  }
}

async function storeMovieInDatabase(movie) {
  try {
    // Convert release date to YYYY-MM-DD format
    let formattedDate = null;
    if (movie.Released && movie.Released !== "N/A") {
      try {
        const parsedDate = parse(movie.Released, "dd MMM yyyy", new Date());
        formattedDate = format(parsedDate, "yyyy-MM-dd");
      } catch (dateError) {
        console.error(`Error parsing date: ${movie.Released}`);
      }
    }

    await db.promise().query(
      `INSERT INTO latest_releases 
      (imdb_id, title, release_date, year, runtime, genre, director, actors, poster, plot, rating) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
      ON DUPLICATE KEY UPDATE title=VALUES(title), release_date=VALUES(release_date), year=VALUES(year), runtime=VALUES(runtime), 
      genre=VALUES(genre), director=VALUES(director), actors=VALUES(actors), poster=VALUES(poster), plot=VALUES(plot), rating=VALUES(rating)`,
      [
        movie.imdbID,
        movie.Title,
        formattedDate, // Insert formatted date
        movie.Year,
        movie.Runtime,
        movie.Genre,
        movie.Director,
        movie.Actors,
        movie.Poster,
        movie.Plot,
        movie.imdbRating || null,
      ]
    );

    console.log(`Added to DB: ${movie.Title}`);
  } catch (error) {
    console.error("Error inserting into database:", error.message);
  }
}

async function updateLatestReleases() {
  const lastYear = new Date().getFullYear() - 1;

  try {
    console.log(`Starting update for movies from ${lastYear}`);

    // Clear existing latest releases
    await db.promise().query("TRUNCATE TABLE latest_releases");

    const movieTitles = await fetchMoviesFromWikipedia(lastYear);

    for (const title of movieTitles) {
      const movie = await getMovieDetails(title);
      if (movie) {
        await storeMovieInDatabase(movie);
      }
      await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay to avoid API limit
    }

    console.log("Latest releases update completed!");
  } catch (error) {
    console.error("Error updating latest releases:", error);
  }
}

// // // Run the function
// updateLatestReleases();

// API Routes
app.get("/api/search", async (req, res) => {
  const { title } = req.query;
  try {
    const response = await axios.get(
      `https://www.omdbapi.com/?s=${title}&apikey=bf4ec251`
    );
    console.log(response.data);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});

app.get("/api/movie/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // First, search in latest_releases
    db.query(
      `SELECT * FROM latest_releases WHERE imdb_id = ?`,
      [id],
      async (err, results) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: "Database query failed" });
        }

        if (results.length > 0) {
          console.log(results.data);
          // If found, return from database
          return res.json(results[0]);
        } else {
          // If not found, fetch from OMDb
          try {
            const response = await axios.get(`https://www.omdbapi.com/`, {
              params: {
                i: id,
                apikey: "bf4ec251",
                plot: "full",
              },
            });

            if (response.data.Response === "True") {
              console.log(response.data);
              return res.json(response.data);
            } else {
              return res.status(404).json({ error: "Movie not found on OMDb" });
            }
          } catch (error) {
            console.log("Error fetching from OMDb:", error.message);
            return res
              .status(500)
              .json({ error: "Failed to fetch movie details" });
          }
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get latest releases
app.get("/latest-releases", (req, res) => {
  db.query(
    "SELECT * FROM latest_releases ORDER BY release_date DESC",
    (err, results) => {
      if (err) {
        res.status(500).json({ error: "Failed to fetch latest releases" });
        return;
      }
      res.json(results);
    }
  );
});

// // Save movie to database
// app.post("/api/favorites", (req, res) => {
//   const {
//     imdb_id,
//     title,
//     year,
//     runtime,
//     genre,
//     actors,
//     director,
//     poster,
//     plot,
//     rating,
//   } = req.body;
//   console.log(req.body);

//   const query = `
//     INSERT INTO favorite_movies (imdb_id, title, year, runtime, genre, actors, director, poster, plot, rating)
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     ON DUPLICATE KEY UPDATE
//     title=?, year=?, poster=?, plot=?, rating=?, genre=?, director=?, runtime=?, actors=?
//   `;

//   db.query(
//     query,
//     [
//       imdb_id,
//       title,
//       year,
//       runtime,
//       genre,
//       actors,
//       director,
//       poster,
//       plot,
//       rating,
//       //dupllicate key update
//       title,
//       year,
//       runtime,
//       poster,
//       plot,
//       rating,
//       genre,
//       actors,
//       director,
//     ],
//     (err, result) => {
//       if (err) {
//         res.status(500).json({ error: "Failed to save movie" });
//         console.log(err);
//         return;
//       }
//       res.json({ message: "Movie saved successfully", id: result.insertId });
//     }
//   );
// });

// // Get favorite movies
// app.get("/api/favorites", (req, res) => {
//   db.query(
//     "SELECT * FROM favorite_movies ORDER BY created_at DESC",
//     (err, results) => {
//       if (err) {
//         res.status(500).json({ error: "Failed to fetch favorites" });
//         return;
//       }
//       res.json(results);
//     }
//   );
// });

// // Delete movie from favorites
// app.delete("/api/favorites/:imdbId", (req, res) => {
//   const { imdbId } = req.params;

//   db.query(
//     "DELETE FROM favorite_movies WHERE imdb_id = ?",
//     [imdbId],
//     (err, result) => {
//       if (err) {
//         res
//           .status(500)
//           .json({ error: "Failed to remove movie from favorites" });
//         return;
//       }
//       res.json({ message: "Movie removed from favorites successfully" });
//     }
//   );
// });

// Update your existing favorites endpoints to use authentication
app.post("/api/favorites", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const {
    imdb_id,
    title,
    year,
    runtime,
    genre,
    actors,
    director,
    poster,
    plot,
    rating,
  } = req.body;

  const query = `
    INSERT INTO favorite_movies (user_id, imdb_id, title, year, runtime, genre, actors, director, poster, plot, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    title=?, year=?, runtime=?, genre=?, actors=?, director=?, poster=?, plot=?, rating=?
  `;

  db.query(
    query,
    [
      userId,
      imdb_id,
      title,
      year,
      runtime,
      genre,
      actors,
      director,
      poster,
      plot,
      rating,
      title,
      year,
      runtime,
      genre,
      actors,
      director,
      poster,
      plot,
      rating,
    ],
    (err, result) => {
      if (err) {
        res.status(500).json({ error: "Failed to save movie" });
        console.log(err);
        return;
      }
      res.json({ message: "Movie saved successfully", id: result.insertId });
    }
  );
});

// Update get favorites endpoint
app.get("/api/favorites", authenticateToken, (req, res) => {
  const userId = req.user.userId;

  db.query(
    "SELECT * FROM favorite_movies WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    (err, results) => {
      if (err) {
        res.status(500).json({ error: "Failed to fetch favorites" });
        return;
      }
      res.json(results);
    }
  );
});

// Update delete favorite endpoint
app.delete("/api/favorites/:imdbId", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { imdbId } = req.params;

  db.query(
    "DELETE FROM favorite_movies WHERE imdb_id = ? AND user_id = ?",
    [imdbId, userId],
    (err, result) => {
      if (err) {
        res
          .status(500)
          .json({ error: "Failed to remove movie from favorites" });
        return;
      }
      res.json({ message: "Movie removed from favorites successfully" });
    }
  );
});

app.get("/api/moviefromdb/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // First, search in favorite_movies
    db.query(
      `SELECT * FROM favorite_movies WHERE imdb_id = ?`,
      [id],
      (err, results) => {
        if (err) {
          console.log(err);
          return res
            .status(500)
            .json({ error: "Failed to fetch movie details" });
        }

        if (results.length > 0) {
          // If found in favorite_movies, return it
          return res.json(results[0]);
        } else {
          // If not found, search in latest_releases
          db.query(
            `SELECT * FROM latest_releases WHERE imdb_id = ?`,
            [id],
            (err, latestResults) => {
              if (err) {
                console.log(err);
                return res
                  .status(500)
                  .json({ error: "Failed to fetch movie details" });
              }

              if (latestResults.length > 0) {
                return res.json(latestResults[0]);
              } else {
                return res.status(404).json({ error: "Movie not found" });
              }
            }
          );
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch movie details" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
