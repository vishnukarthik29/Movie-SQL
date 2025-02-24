const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const axios = require("axios");
const { parse, format } = require("date-fns");
const cheerio = require("cheerio");
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // const createLatestReleasesTable = `
  //   CREATE TABLE IF NOT EXISTS latest_releases (
  //     id INT AUTO_INCREMENT PRIMARY KEY,
  //     imdb_id VARCHAR(20) UNIQUE,
  //     title VARCHAR(255),
  //     release_date DATE,
  //     poster VARCHAR(255),
  //     plot TEXT,
  //     last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  //   )
  // `;
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

// //working start
// async function fetchLatestReleases() {
//   const currentDate = new Date();
//   const currentYear = currentDate.getFullYear();
//   const lastYear = new Date(
//     currentDate.setFullYear(currentDate.getFullYear() - 1)
//   );

//   try {
//     // Clear existing latest releases
//     await db.promise().query("TRUNCATE TABLE latest_releases");
//     console.log("Cleared latest releases table");

//     const processedMovies = new Set(); // To avoid duplicates

//     // Search for current year movies
//     async function searchMoviesByYear(year, page = 1) {
//       console.log(`Searching movies for year ${year}, page ${page}`);
//       const response = await axios.get(`https://www.omdbapi.com/`, {
//         params: {
//           apikey: "bf4ec251",
//           type: "movie",
//           y: year,
//           page: page,
//         },
//       });
//       return response.data;
//     }

//     // Get movie details
//     async function getMovieDetails(imdbId) {
//       const response = await axios.get(`https://www.omdbapi.com/`, {
//         params: {
//           apikey: "bf4ec251",
//           i: imdbId,
//           plot: "full",
//         },
//       });
//       return response.data;
//     }

//     // Process both current year and last year
//     const yearsToSearch = [currentYear - 1];

//     for (const year of yearsToSearch) {
//       let currentPage = 1;
//       let totalResults = 0;

//       do {
//         try {
//           const searchResult = await searchMoviesByYear(year, currentPage);

//           if (searchResult.Response === "True" && searchResult.Search) {
//             totalResults = parseInt(searchResult.totalResults);
//             console.log(`Found ${totalResults} total results for year ${year}`);

//             for (const movie of searchResult.Search) {
//               if (!processedMovies.has(movie.imdbID)) {
//                 try {
//                   const details = await getMovieDetails(movie.imdbID);

//                   if (details.Released && details.Response === "True") {
//                     const releaseDate = new Date(details.Released);

//                     // Only add movies from the last 12 months
//                     if (releaseDate >= lastYear) {
//                       await db
//                         .promise()
//                         .query(
//                           "INSERT INTO latest_releases (imdb_id, title, release_date, poster, plot) VALUES (?, ?, ?, ?, ?)",
//                           [
//                             movie.imdbID,
//                             details.Title,
//                             releaseDate,
//                             details.Poster,
//                             details.Plot,
//                           ]
//                         );
//                       processedMovies.add(movie.imdbID);
//                       console.log(
//                         `Added movie: ${details.Title} (Released: ${details.Released})`
//                       );
//                     }
//                   }

//                   // Add a small delay between detail requests
//                   await new Promise((resolve) => setTimeout(resolve, 250));
//                 } catch (error) {
//                   console.error(
//                     `Error fetching details for movie ${movie.imdbID}:`,
//                     error.message
//                   );
//                 }
//               }
//             }

//             // Calculate total pages (OMDB API limits to 100 pages)
//             const totalPages = Math.min(Math.ceil(totalResults / 10), 100);
//             console.log(
//               `Processing page ${currentPage} of ${totalPages} for year ${year}`
//             );
//             currentPage++;

//             // Add a delay between pages
//             await new Promise((resolve) => setTimeout(resolve, 1000));

//             // Break if we've reached the last page or page 100
//             if (currentPage > totalPages || currentPage > 100) break;
//           } else {
//             console.log(`No more results for year ${year}`);
//             break;
//           }
//         } catch (error) {
//           console.error(
//             `Error processing page ${currentPage} for year ${year}:`,
//             error.message
//           );
//           break;
//         }
//       } while (true);
//     }

//     // Log summary
//     const [rows] = await db
//       .promise()
//       .query("SELECT COUNT(*) as count FROM latest_releases");
//     console.log(
//       `Latest releases update completed. Added ${rows[0].count} movies.`
//     );
//   } catch (error) {
//     console.error("Error updating latest releases:", error);
//   }
// }

// //working end

// // Schedule daily update of latest releases
// cron.schedule("0 0 * * *", () => {
//   console.log("Running scheduled update of latest releases");
//   fetchLatestReleases();
// });

// Initial fetch of latest releases on server start
// console.log("Starting initial fetch of latest releases");
// fetchLatestReleases();

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

// async function storeMovieInDatabase(movie) {
//   try {
//     await db.promise().query(
//       `INSERT INTO latest_releases
//       (imdb_id, title, release_date, year, runtime, genre, director, actors, poster, plot, rating)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//       ON DUPLICATE KEY UPDATE title=VALUES(title), release_date=VALUES(release_date), year=VALUES(year), runtime=VALUES(runtime),
//       genre=VALUES(genre), director=VALUES(director), actors=VALUES(actors), poster=VALUES(poster), plot=VALUES(plot), rating=VALUES(rating)`,
//       [
//         movie.imdbID,
//         movie.Title,
//         movie.Released,
//         movie.Year,
//         movie.Runtime,
//         movie.Genre,
//         movie.Director,
//         movie.Actors,
//         movie.Poster,
//         movie.Plot,
//         movie.imdbRating || null,
//       ]
//     );

//     console.log(`Added to DB: ${movie.Title}`);
//   } catch (error) {
//     console.error("Error inserting into database:", error.message);
//   }
// }

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

// app.get("/api/movie/:id", async (req, res) => {
//   const { id } = req.params;
//   try {
//     const response = await axios.get(
//       `https://www.omdbapi.com/?i=${id}&apikey=bf4ec251`
//     );
//     console.log(response.data);
//     res.json(response.data);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to fetch movie details" });
//   }
// });

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
    actors,
    director,
    poster,
    plot,
    rating,
  } = req.body;
  console.log(req.body);

  const query = `
    INSERT INTO favorite_movies (imdb_id, title, year, runtime, genre, actors, director, poster, plot, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    title=?, year=?, poster=?, plot=?, rating=?, genre=?, director=?, runtime=?, actors=?
  `;

  db.query(
    query,
    [
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
      //dupllicate key update
      title,
      year,
      runtime,
      poster,
      plot,
      rating,
      genre,
      actors,
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

// app.get("/api/moviefromdb/:id", async (req, res) => {
//   const { id } = req.params;

//   try {
//     db.query(
//       `SELECT * FROM favorite_movies WHERE imdb_id = ?`,
//       [id], // Use parameterized query to prevent SQL injection
//       (err, results) => {
//         if (err) {
//           res.status(500).json({ error: "Failed to fetch movie details" });
//           console.log(err);
//           return;
//         }
//         if (results.length === 0) {
//           res.status(404).json({ error: "Movie not found" });
//           return;
//         }
//         res.json(results[0]); // Return the first result (assuming imdb_id is unique)
//       }
//     );
//   } catch (error) {
//     res.status(500).json({ error: "Failed to fetch movie details" });
//     console.log(error);
//   }
// });

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
