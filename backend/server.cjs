// server.js
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const axios = require("axios");
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
db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL database");

  // Create movies table if it doesn't exist
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS movies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      imdb_id VARCHAR(20) UNIQUE,
      title VARCHAR(255),
      year VARCHAR(10),
      poster VARCHAR(255),
      plot TEXT,
      rating DECIMAL(3,1),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.query(createTableQuery, (err) => {
    if (err) console.error("Error creating table:", err);
    else console.log("Movies table ready");
  });
});

// API Routes
app.get("/api/search", async (req, res) => {
  const { title } = req.query;
  try {
    const response = await axios.get(
      `https://www.omdbapi.com/?s=${title}&apikey=bf4ec251`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});

app.get("/api/movie/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const response = await axios.get(
      `https://www.omdbapi.com/?i=${id}&apikey=bf4ec251`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch movie details" });
  }
});

// Save movie to database
app.post("/api/favorites", (req, res) => {
  const { imdb_id, title, year, poster, plot, rating } = req.body;

  const query = `
    INSERT INTO movies (imdb_id, title, year, poster, plot, rating)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    title=?, year=?, poster=?, plot=?, rating=?
  `;

  db.query(
    query,
    [
      imdb_id,
      title,
      year,
      poster,
      plot,
      rating,
      title,
      year,
      poster,
      plot,
      rating,
    ],
    (err, result) => {
      if (err) {
        res.status(500).json({ error: "Failed to save movie" });
        return;
      }
      res.json({ message: "Movie saved successfully", id: result.insertId });
    }
  );
});

// Get favorite movies
app.get("/api/favorites", (req, res) => {
  db.query("SELECT * FROM movies ORDER BY created_at DESC", (err, results) => {
    if (err) {
      res.status(500).json({ error: "Failed to fetch favorites" });
      return;
    }
    res.json(results);
  });
});

// Delete movie from favorites
app.delete("/api/favorites/:imdbId", (req, res) => {
  const { imdbId } = req.params;

  db.query("DELETE FROM movies WHERE imdb_id = ?", [imdbId], (err, result) => {
    if (err) {
      res.status(500).json({ error: "Failed to remove movie from favorites" });
      return;
    }
    res.json({ message: "Movie removed from favorites successfully" });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
