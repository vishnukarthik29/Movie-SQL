<template>
  <div class="container mx-auto p-4">
    <!-- Search Section -->
    <div class="mb-8">
      <div class="flex gap-4 mb-4">
        <input
          v-model="searchQuery"
          @keyup.enter="searchMovies"
          type="text"
          placeholder="Search by title..."
          class="flex-1 p-2 border rounded"
        />
        <button
          @click="searchMovies"
          class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      <div class="flex gap-4 mb-4">
        <input
          v-model="directorQuery"
          @keyup.enter="searchByDirector"
          type="text"
          placeholder="Search by director..."
          class="flex-1 p-2 border rounded"
        />
        <button
          @click="searchByDirector"
          class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          Search
        </button>
      </div>

      <!-- <div class="flex gap-4 mb-4">
        <input
          v-model="actorQuery"
          @keyup.enter="searchByActor"
          type="text"
          placeholder="Search by actor/actress..."
          class="flex-1 p-2 border rounded"
        />
        <button
          @click="searchByActor"
          class="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
        >
          Search
        </button>
      </div> -->
    </div>

    <!-- Sorting Section -->
    <div v-if="searchResults.length" class="mb-6">
      <div class="flex items-center gap-4">
        <span class="font-medium">Sort by:</span>
        <div class="flex gap-2">
          <button
            @click="sortResults('title')"
            class="px-4 py-2 rounded border"
            :class="{
              'bg-blue-600 text-white': sortBy === 'title',
              'bg-gray-100 hover:bg-gray-200': sortBy !== 'title',
            }"
          >
            Title
            <span v-if="sortBy === 'title'">
              {{ sortDirection === "asc" ? "↑" : "↓" }}
            </span>
          </button>
          <button
            @click="sortResults('year')"
            class="px-4 py-2 rounded border"
            :class="{
              'bg-blue-600 text-white': sortBy === 'year',
              'bg-gray-100 hover:bg-gray-200': sortBy !== 'year',
            }"
          >
            Year
            <span v-if="sortBy === 'year'">
              {{ sortDirection === "asc" ? "↑" : "↓" }}
            </span>
          </button>
          <!-- Clear Button -->
          <div class="flex justify-end">
            <button
              @click="clearAll"
              class="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Search Results -->
    <div v-if="loading" class="text-center">
      <p class="text-gray-600">Loading...</p>
    </div>

    <div
      v-else-if="searchResults.length"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      <div
        v-for="movie in sortedResults"
        :key="getMovieId(movie)"
        class="bg-white rounded-lg shadow-md overflow-hidden"
      >
        <img
          :src="movie.Poster || movie.poster"
          :alt="movie.Title || movie.title"
          class="w-full h-96 object-cover"
          @error="handleImageError"
        />
        <div class="p-4">
          <h3 class="text-lg font-semibold mb-2">
            {{ movie.Title ?? movie.title }}
          </h3>
          <p class="text-gray-600">{{ movie.Year ?? movie.year }}</p>
          <div>
            <router-link
              :to="{ name: 'movie-details', params: { id: getMovieId(movie) } }"
              class="mt-4 bg-blue-600 text-white px-4 py-2 rounded w-full block text-center hover:bg-blue-700"
            >
              View Details
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- <script>
import axios from "axios";

export default {
  name: "HomeView",
  data() {
    return {
      searchQuery: "",
      directorQuery: "",
      actorQuery: "",
      searchResults: [],
      loading: false,
      sortBy: "title", // default sort field
      sortDirection: "asc", // default sort direction: asc or desc
    };
  },

  computed: {
    sortedResults() {
      // First, deduplicate the movies based on IMDB ID
      const uniqueMovies = this.deduplicateMovies(this.searchResults);

      // Then sort the unique movies
      return uniqueMovies.sort((a, b) => {
        // Handle different property naming conventions from different APIs
        const aTitle = a.Title ?? a.title ?? "";
        const bTitle = b.Title ?? b.title ?? "";
        const aYear = parseInt(a.Year ?? a.year ?? 0);
        const bYear = parseInt(b.Year ?? b.year ?? 0);

        if (this.sortBy === "title") {
          if (this.sortDirection === "asc") {
            return aTitle.localeCompare(bTitle);
          } else {
            return bTitle.localeCompare(aTitle);
          }
        } else if (this.sortBy === "year") {
          if (this.sortDirection === "asc") {
            return aYear - bYear;
          } else {
            return bYear - aYear;
          }
        }
        return 0;
      });
    },
  },

  methods: {
    // Get movie ID regardless of property naming
    getMovieId(movie) {
      return movie.imdbID || movie.imdb_id;
    },

    // Get movie title regardless of property naming
    getMovieTitle(movie) {
      return movie.Title || movie.title;
    },

    // Deduplicate movies based on IMDB ID and title
    deduplicateMovies(movies) {
      const uniqueMovies = {};

      movies.forEach((movie) => {
        const id = this.getMovieId(movie);
        const title = this.getMovieTitle(movie);

        // Create a unique key using both id and title
        const key = `${id}-${title}`;

        // Only add if this combination doesn't exist yet
        if (!uniqueMovies[key]) {
          uniqueMovies[key] = movie;
        }
      });

      return Object.values(uniqueMovies);
    },

    async searchMovies() {
      if (!this.searchQuery.trim()) return;

      this.loading = true;
      try {
        const response = await axios.get(
          `/backend/api/search?title=${this.searchQuery}`
        );
        this.searchResults = response.data.Search || [];
      } catch (error) {
        console.error("Error searching movies:", error);
      } finally {
        this.loading = false;
      }
    },

    async searchByDirector() {
      if (!this.directorQuery.trim()) return;
      this.fetchMovies(
        `/backend/api/search-by-director?director=${this.directorQuery}`
      );
    },

    async searchByActor() {
      if (!this.actorQuery.trim()) return;
      this.fetchMovies(`/backend/api/search-by-actor?actor=${this.actorQuery}`);
    },

    async fetchMovies(apiUrl) {
      this.loading = true;
      try {
        const response = await axios.get(apiUrl);
        this.searchResults = response.data || [];
        console.log(this.searchResults);
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        this.loading = false;
      }
    },

    handleImageError(e) {
      e.target.src =
        "https://via.placeholder.com/300x450?text=No+Image+Available";
    },

    sortResults(field) {
      // If clicking the same field, toggle the direction
      if (this.sortBy === field) {
        this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
      } else {
        // If clicking a different field, set as the new sort field and reset direction to asc
        this.sortBy = field;
        this.sortDirection = "asc";
      }
    },

    clearAll() {
      // Reset search results
      this.searchResults = [];

      // Reset search queries
      this.searchQuery = "";
      this.directorQuery = "";
      this.actorQuery = "";

      // Reset sorting to defaults
      this.sortBy = "title";
      this.sortDirection = "asc";
    },
  },
};
</script> -->
<script>
import axios from "axios";

export default {
  name: "HomeView",

  data() {
    return {
      searchQuery: "",
      directorQuery: "",
      actorQuery: "",
      searchResults: [],
      loading: false,
      sortBy: "title",
      sortDirection: "asc",
      OMDB_API_KEY: "bf4ec251",
    };
  },

  computed: {
    sortedResults() {
      const uniqueMovies = this.deduplicateMovies(this.searchResults);

      return uniqueMovies.sort((a, b) => {
        const aTitle = a.Title ?? a.title ?? "";
        const bTitle = b.Title ?? b.title ?? "";

        const aYear = parseInt(a.Year ?? a.year ?? 0);
        const bYear = parseInt(b.Year ?? b.year ?? 0);

        if (this.sortBy === "title") {
          return this.sortDirection === "asc"
            ? aTitle.localeCompare(bTitle)
            : bTitle.localeCompare(aTitle);
        }

        if (this.sortBy === "year") {
          return this.sortDirection === "asc" ? aYear - bYear : bYear - aYear;
        }

        return 0;
      });
    },
  },

  methods: {
    getMovieId(movie) {
      return movie.imdbID || movie.imdb_id;
    },

    getMovieTitle(movie) {
      return movie.Title || movie.title;
    },

    deduplicateMovies(movies) {
      const uniqueMovies = {};

      movies.forEach((movie) => {
        const id = this.getMovieId(movie);
        const title = this.getMovieTitle(movie);

        const key = `${id}-${title}`;

        if (!uniqueMovies[key]) {
          uniqueMovies[key] = movie;
        }
      });

      return Object.values(uniqueMovies);
    },

    // SEARCH BY TITLE
    async searchMovies() {
      if (!this.searchQuery.trim()) return;

      this.loading = true;

      try {
        const response = await axios.get(`https://www.omdbapi.com/`, {
          params: {
            s: this.searchQuery,
            apikey: this.OMDB_API_KEY,
          },
        });

        this.searchResults = response.data.Search || [];
      } catch (error) {
        console.error("Error searching movies:", error);
      } finally {
        this.loading = false;
      }
    },

    // SEARCH BY DIRECTOR
    async searchByDirector() {
      if (!this.directorQuery.trim()) return;

      this.loading = true;

      try {
        // Search director name first
        const searchResponse = await axios.get(`https://www.omdbapi.com/`, {
          params: {
            s: this.directorQuery,
            type: "movie",
            apikey: this.OMDB_API_KEY,
          },
        });

        const movies = searchResponse.data.Search || [];

        let directorMovies = [];

        // Fetch full details for each movie
        for (const movie of movies) {
          try {
            const detailsResponse = await axios.get(
              `https://www.omdbapi.com/`,
              {
                params: {
                  i: movie.imdbID,
                  apikey: this.OMDB_API_KEY,
                },
              },
            );

            const details = detailsResponse.data;

            // Match director name
            if (
              details.Director &&
              details.Director.toLowerCase().includes(
                this.directorQuery.toLowerCase(),
              )
            ) {
              directorMovies.push(details);
            }
          } catch (err) {
            console.error("Error fetching movie details:", err);
          }
        }

        this.searchResults = directorMovies;
      } catch (error) {
        console.error("Error searching by director:", error);
      } finally {
        this.loading = false;
      }
    },

    // SEARCH BY ACTOR
    async searchByActor() {
      if (!this.actorQuery.trim()) return;

      this.loading = true;

      try {
        const searchResponse = await axios.get(`https://www.omdbapi.com/`, {
          params: {
            s: this.actorQuery,
            type: "movie",
            apikey: this.OMDB_API_KEY,
          },
        });

        const movies = searchResponse.data.Search || [];

        let actorMovies = [];

        for (const movie of movies) {
          try {
            const detailsResponse = await axios.get(
              `https://www.omdbapi.com/`,
              {
                params: {
                  i: movie.imdbID,
                  apikey: this.OMDB_API_KEY,
                },
              },
            );

            const details = detailsResponse.data;

            if (
              details.Actors &&
              details.Actors.toLowerCase().includes(
                this.actorQuery.toLowerCase(),
              )
            ) {
              actorMovies.push(details);
            }
          } catch (err) {
            console.error("Error fetching actor movie details:", err);
          }
        }

        this.searchResults = actorMovies;
      } catch (error) {
        console.error("Error searching by actor:", error);
      } finally {
        this.loading = false;
      }
    },

    handleImageError(e) {
      e.target.src =
        "https://via.placeholder.com/300x450?text=No+Image+Available";
    },

    sortResults(field) {
      if (this.sortBy === field) {
        this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
      } else {
        this.sortBy = field;
        this.sortDirection = "asc";
      }
    },

    clearAll() {
      this.searchResults = [];
      this.searchQuery = "";
      this.directorQuery = "";
      this.actorQuery = "";
      this.sortBy = "title";
      this.sortDirection = "asc";
    },
  },
};
</script>
