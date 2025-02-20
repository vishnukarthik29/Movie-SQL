const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const axios = require("axios");
const cron = require("node-cron");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

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

  // Create tables separately
  const createMoviesTable = `
    CREATE TABLE IF NOT EXISTS favorite_movies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      imdb_id VARCHAR(20) UNIQUE,
      title VARCHAR(255),
      year VARCHAR(10),
      runtime VARCHAR(255),
      genre VARCHAR(255),
      director VARCHAR(255),
      poster VARCHAR(255),
      plot TEXT,
      rating DECIMAL(3,1),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createLatestReleasesTable = `
    CREATE TABLE IF NOT EXISTS latest_releases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      imdb_id VARCHAR(20) UNIQUE,
      title VARCHAR(255),
      release_date DATE,
      poster VARCHAR(255),
      plot TEXT,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Execute queries sequentially
  try {
    await db.promise().query(createMoviesTable);
    console.log("Favorite Movies table ready");

    await db.promise().query(createLatestReleasesTable);
    console.log("Latest releases table ready");
  } catch (error) {
    console.error("Error creating tables:", error);
  }
});

// // Function to fetch latest releases
// async function fetchLatestReleases() {
//   const currentDate = new Date();
//   const lastYear = new Date(
//     currentDate.setFullYear(currentDate.getFullYear() - 1)
//   );

//   try {
//     // Clear existing latest releases
//     await db.promise().query("TRUNCATE TABLE latest_releases");
//     console.log("Cleared latest releases table");

//     // Search for movies released in the last 12 months
//     const response = await axios.get(
//       `https://www.omdbapi.com/?s=*&y=${new Date().getFullYear()}&type=movie&apikey=bf4ec251`
//     );

//     if (response.data.Search) {
//       console.log(`Found ${response.data.Search.length} movies to process`);

//       for (const movie of response.data.Search) {
//         try {
//           const detailsResponse = await axios.get(
//             `https://www.omdbapi.com/?i=${movie.imdbID}&apikey=bf4ec251`
//           );

//           if (detailsResponse.data.Released) {
//             const releaseDate = new Date(detailsResponse.data.Released);
//             if (releaseDate >= lastYear) {
//               await db
//                 .promise()
//                 .query(
//                   "INSERT INTO latest_releases (imdb_id, title, release_date, poster, plot, rating) VALUES (?, ?, ?, ?, ?, ?)",
//                   [
//                     movie.imdbID,
//                     detailsResponse.data.Title,
//                     releaseDate,
//                     detailsResponse.data.Poster,
//                     detailsResponse.data.Plot,
//                     detailsResponse.data.imdbRating,
//                   ]
//                 );
//               console.log(`Added movie: ${detailsResponse.data.Title}`);
//             }
//           }
//         } catch (error) {
//           console.error(
//             `Error processing movie ${movie.imdbID}:`,
//             error.message
//           );
//         }
//       }
//     }
//     console.log("Latest releases update completed");
//   } catch (error) {
//     console.error("Error updating latest releases:", error);
//   }
// }
async function fetchLatestReleases() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const lastYear = new Date(
    currentDate.setFullYear(currentDate.getFullYear() - 1)
  );

  try {
    // Clear existing latest releases
    await db.promise().query("TRUNCATE TABLE latest_releases");
    console.log("Cleared latest releases table");

    const processedMovies = new Set(); // To avoid duplicates

    // Search for current year movies
    async function searchMoviesByYear(year, page = 1) {
      console.log(`Searching movies for year ${year}, page ${page}`);
      const response = await axios.get(`https://www.omdbapi.com/`, {
        params: {
          apikey: "bf4ec251",
          s: "movie", // Search term
          type: "movie",
          y: year,
          page: page,
        },
      });
      return response.data;
    }

    // Get movie details
    async function getMovieDetails(imdbId) {
      const response = await axios.get(`https://www.omdbapi.com/`, {
        params: {
          apikey: "bf4ec251",
          i: imdbId,
          plot: "full",
        },
      });
      return response.data;
    }

    // Process both current year and last year
    const yearsToSearch = [currentYear - 1];

    for (const year of yearsToSearch) {
      let currentPage = 1;
      let totalResults = 0;

      do {
        try {
          const searchResult = await searchMoviesByYear(year, currentPage);

          if (searchResult.Response === "True" && searchResult.Search) {
            totalResults = parseInt(searchResult.totalResults);
            console.log(`Found ${totalResults} total results for year ${year}`);

            for (const movie of searchResult.Search) {
              if (!processedMovies.has(movie.imdbID)) {
                try {
                  const details = await getMovieDetails(movie.imdbID);

                  if (details.Released && details.Response === "True") {
                    const releaseDate = new Date(details.Released);

                    // Only add movies from the last 12 months
                    if (releaseDate >= lastYear) {
                      await db
                        .promise()
                        .query(
                          "INSERT INTO latest_releases (imdb_id, title, release_date, poster, plot) VALUES (?, ?, ?, ?, ?)",
                          [
                            movie.imdbID,
                            details.Title,
                            releaseDate,
                            details.Poster,
                            details.Plot,
                          ]
                        );
                      processedMovies.add(movie.imdbID);
                      console.log(
                        `Added movie: ${details.Title} (Released: ${details.Released})`
                      );
                    }
                  }

                  // Add a small delay between detail requests
                  await new Promise((resolve) => setTimeout(resolve, 250));
                } catch (error) {
                  console.error(
                    `Error fetching details for movie ${movie.imdbID}:`,
                    error.message
                  );
                }
              }
            }

            // Calculate total pages (OMDB API limits to 100 pages)
            const totalPages = Math.min(Math.ceil(totalResults / 10), 100);
            console.log(
              `Processing page ${currentPage} of ${totalPages} for year ${year}`
            );
            currentPage++;

            // Add a delay between pages
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Break if we've reached the last page or page 100
            if (currentPage > totalPages || currentPage > 100) break;
          } else {
            console.log(`No more results for year ${year}`);
            break;
          }
        } catch (error) {
          console.error(
            `Error processing page ${currentPage} for year ${year}:`,
            error.message
          );
          break;
        }
      } while (true);
    }

    // Log summary
    const [rows] = await db
      .promise()
      .query("SELECT COUNT(*) as count FROM latest_releases");
    console.log(
      `Latest releases update completed. Added ${rows[0].count} movies.`
    );
  } catch (error) {
    console.error("Error updating latest releases:", error);
  }
}

// // Schedule daily update of latest releases
// cron.schedule("0 0 * * *", () => {
//   console.log("Running scheduled update of latest releases");
//   fetchLatestReleases();
// });

// // Initial fetch of latest releases on server start
console.log("Starting initial fetch of latest releases");
fetchLatestReleases();

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
    const response = await axios.get(
      `https://www.omdbapi.com/?i=${id}&apikey=bf4ec251`
    );
    console.log(response.data);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch movie details" });
  }
});

// Get latest releases
app.get("/api/latest-releases", (req, res) => {
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

// Save movie to database
app.post("/api/favorites", (req, res) => {
  const {
    imdb_id,
    title,
    year,
    runtime,
    genre,
    director,
    poster,
    plot,
    rating,
  } = req.body;
  console.log(req.body);

  const query = `
    INSERT INTO favorite_movies (imdb_id, title, year, runtime, genre, director, poster, plot, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    title=?, year=?, poster=?, plot=?, rating=?, genre=?, director=?, runtime=?
  `;

  db.query(
    query,
    [
      imdb_id,
      title,
      year,
      runtime,
      genre,
      director,
      poster,
      plot,
      rating,
      //dupllicate key update
      title,
      year,
      runtime,
      poster,
      plot,
      rating,
      genre,
      director,
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

// Get favorite movies
app.get("/api/favorites", (req, res) => {
  db.query(
    "SELECT * FROM favorite_movies ORDER BY created_at DESC",
    (err, results) => {
      if (err) {
        res.status(500).json({ error: "Failed to fetch favorites" });
        return;
      }
      res.json(results);
    }
  );
});

// Delete movie from favorites
app.delete("/api/favorites/:imdbId", (req, res) => {
  const { imdbId } = req.params;

  db.query(
    "DELETE FROM favorite_movies WHERE imdb_id = ?",
    [imdbId],
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
    db.query(
      `SELECT * FROM favorite_movies WHERE imdb_id = ?`,
      [id], // Use parameterized query to prevent SQL injection
      (err, results) => {
        if (err) {
          res.status(500).json({ error: "Failed to fetch movie details" });
          console.log(err);
          return;
        }
        if (results.length === 0) {
          res.status(404).json({ error: "Movie not found" });
          return;
        }
        res.json(results[0]); // Return the first result (assuming imdb_id is unique)
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch movie details" });
    console.log(error);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
