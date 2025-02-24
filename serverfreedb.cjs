const express = require("express");
const path = require("path");
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

// Serve the frontend (dist folder)
app.use(express.static(path.join(__dirname, "dist")));

// Database connection
const db = mysql.createConnection({
  host: "sql.freedb.tech",
  user: "freedb_vishnu",
  password: "$rNC&q4H5d9hp%#",
  database: "freedb_movies_db",
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
    imdb_id VARCHAR(20),
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
  const creatdirectortable = `CREATE TABLE IF NOT EXISTS director_movies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  director VARCHAR(255) NOT NULL,
  imdb_id VARCHAR(20) UNIQUE,
  title VARCHAR(255),
  year VARCHAR(10),
  runtime VARCHAR(255),
  genre VARCHAR(255),
  actors VARCHAR(255),
  director_name VARCHAR(255),
  poster VARCHAR(255),
  plot TEXT,
  rating DECIMAL(3,1),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
  const createactoractresstable = `CREATE TABLE IF NOT EXISTS actor_movies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actor VARCHAR(255) NOT NULL,
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

  // Execute queries sequentially
  try {
    await db.promise().query(createLoginTable);
    console.log("Login table ready");

    await db.promise().query(createMoviesTable);
    console.log("Favorite Movies table ready");

    await db.promise().query(createLatestReleasesTable);
    console.log("Latest releases table ready");
    await db.promise().query(creatdirectortable);
    console.log("Director table ready");
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

// Endpoint to get similar movies by genre
app.get("/api/similar-movies", async (req, res) => {
  try {
    const { genre, exclude } = req.query;

    if (!genre) {
      return res.status(400).json({ error: "Genre parameter is required" });
    }

    // Split the genre string to handle multiple genres (e.g. "Action, Adventure")
    const genreTerms = genre.split(",").map((term) => term.trim());

    // Create the LIKE conditions for each genre term
    const genreLikeConditions = genreTerms
      .map((term) => `genre LIKE ?`)
      .join(" OR ");

    // Create the parameter array for the query
    const queryParams = genreTerms.map((term) => `%${term}%`);

    // Add the excluded movie ID if provided
    let excludeCondition = "";
    if (exclude) {
      excludeCondition = " AND imdb_id != ?";
      queryParams.push(exclude);
    }

    // SQL query to fetch similar movies from latest_releases table
    const query = `
      SELECT * FROM latest_releases 
      WHERE (${genreLikeConditions})${excludeCondition}
      ORDER BY rating DESC
      LIMIT 10
    `;

    const [rows] = await db.promise().query(query, queryParams);

    console.log(rows);

    res.json(rows);
  } catch (error) {
    console.error("Error fetching similar movies:", error);
    res.status(500).json({ error: "Failed to fetch similar movies" });
  }
});

// // Search by Director using wikipedia api and omdb
app.get("/api/search-by-director", async (req, res) => {
  const { director } = req.query;

  if (!director) {
    console.log("Error: Director name is missing from the request.");
    return res.status(400).json({ error: "Director name is required" });
  }

  try {
    console.log(`Checking database for cached movies of director: ${director}`);

    // Check if movies are already stored in the database
    const [existing] = await db
      .promise()
      .query("SELECT * FROM director_movies WHERE director = ?", [director]);

    if (existing.length > 0) {
      console.log(`Returning cached results for ${director}`);
      return res.json(existing);
    }

    console.log(
      `No cached data found. Fetching filmography from Wikipedia for: ${director}`
    );

    // Fetch Wikipedia page
    const wikiUrl = `https://en.wikipedia.org/wiki/${director.replace(
      / /g,
      "_"
    )}#Filmography`;
    const wikiResponse = await axios.get(wikiUrl);
    const $ = cheerio.load(wikiResponse.data);

    // Extract movie titles from Wikipedia's Filmography section
    let movieTitles = [];

    $("table.wikitable tbody tr").each((index, element) => {
      const movieTitle = $(element).find("td i a").first().text().trim(); // Extract movie title from <i><a> tag

      if (movieTitle) {
        movieTitles.push(movieTitle);
      }
    });

    console.log(
      `Extracted ${movieTitles.length} movies from Wikipedia for ${director}`
    );

    if (movieTitles.length === 0) {
      console.log(`No valid filmography found on Wikipedia for: ${director}`);
      return res
        .status(404)
        .json({ error: "No movies found for this director on Wikipedia" });
    }

    let movieData = [];

    // Fetch movie details from OMDb API
    for (const title of movieTitles) {
      console.log(`Fetching details for: ${title}`);

      try {
        const omdbResponse = await axios.get(
          `https://www.omdbapi.com/?t=${encodeURIComponent(
            title
          )}&apikey=bf4ec251`
        );
        const movie = omdbResponse.data;

        if (movie.Response === "True") {
          const processedMovie = {
            imdb_id: movie.imdbID || "N/A",
            title: movie.Title || "Unknown Title",
            year: movie.Year || "Unknown",
            runtime: movie.Runtime || "Unknown",
            genre: movie.Genre || "Unknown",
            actors: movie.Actors || "Unknown",
            director_name: director,
            poster: movie.Poster || null,
            plot: movie.Plot || "Plot not available",
            rating: movie.imdbRating || "N/A",
          };

          movieData.push(processedMovie);

          // Store movie in database
          await db
            .promise()
            .query(
              "INSERT IGNORE INTO director_movies (director, imdb_id, title, year, runtime, genre, actors, director_name, poster, plot, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [
                director,
                processedMovie.imdb_id,
                processedMovie.title,
                processedMovie.year,
                processedMovie.runtime,
                processedMovie.genre,
                processedMovie.actors,
                processedMovie.director_name,
                processedMovie.poster,
                processedMovie.plot,
                processedMovie.rating,
              ]
            );
        } else {
          console.log(`No OMDb data found for: ${title}`);
        }
      } catch (omdbError) {
        console.error(
          `Error fetching details from OMDb for ${title}:`,
          omdbError
        );
      }
    }

    if (movieData.length === 0) {
      console.log(`No detailed movie data found for ${director}`);
      return res
        .status(404)
        .json({ error: "No verified movies found for this director" });
    }

    console.log(
      `Successfully stored ${movieData.length} movies for ${director}. Returning data.`
    );
    res.json(movieData);
  } catch (error) {
    console.error("Error searching by director:", error);
    res.status(500).json({ error: "Failed to fetch director movies" });
  }
});
// Move this to the bottom of your file, after all API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = 3001 || process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
