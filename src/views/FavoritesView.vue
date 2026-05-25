<!-- src/views/FavoritesView.vue -->
<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-6">My Favorite Movies</h1>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-600">Loading your favorites...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!favorites.length"
      class="text-center py-12 bg-white rounded-lg shadow"
    >
      <div class="max-w-md mx-auto">
        <h2 class="text-xl font-semibold text-gray-700 mb-2">
          No Favorites Yet
        </h2>
        <p class="text-gray-600 mb-6">
          Start building your collection by adding movies you love!
        </p>
        <router-link
          to="/"
          class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Search Movies
        </router-link>
      </div>
    </div>

    <!-- Favorites Grid -->
    <div v-else>
      <!-- Sort Controls -->
      <div class="mb-6 flex flex-wrap gap-4 items-center">
        <label class="font-medium text-gray-700">Sort by:</label>
        <select v-model="sortBy" class="border rounded-md px-3 py-2 bg-white">
          <option value="title">Title</option>
          <option value="rating">Rating</option>
          <option value="year">Year</option>
          <option value="dateAdded">Date Added</option>
        </select>
        <button
          @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
          class="px-3 py-2 border rounded-md hover:bg-gray-50"
        >
          {{ sortOrder === "asc" ? "↑" : "↓" }}
        </button>
      </div>

      <!-- Genre Filter -->
      <div class="mb-6 flex flex-wrap gap-4 items-center">
        <label class="font-medium text-gray-700">Filter by Genre:</label>
        <select
          v-model="selectedGenre"
          class="border rounded-md px-3 py-2 bg-white"
        >
          <option value="">All Genres</option>
          <option v-for="genre in uniqueGenres" :key="genre" :value="genre">
            {{ genre }}
          </option>
        </select>
      </div>

      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6"
      >
        <div
          v-for="movie in sortedFavorites"
          :key="movie.imdb_id"
          class="bg-white rounded-lg shadow-md overflow-hidden group relative"
        >
          <!-- Movie Poster -->
          <div class="relative">
            <!-- <div
              class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-300 ease-in-out"
            ></div> -->
            <img
              v-if="movie.poster && movie.poster !== 'N/A'"
              :src="movie.poster"
              :alt="movie.title"
              class="w-full h-96 object-fit"
              @error="handleImageError"
            />
          </div>

          <!-- Movie Info -->
          <div class="p-4">
            <h3 class="text-md font-semibold mb-2">{{ movie.title }}</h3>
            <div class="flex justify-between items-center mb-10">
              <span class="text-gray-600">{{ movie.year }}</span>
              <span class="flex items-center text-yellow-500">
                <span class="mr-1">★</span>
                {{ movie.rating }}/10
              </span>
            </div>

            <!-- Action Buttons -->
            <div class="absolute bottom-0 left-0 right-0 p-[6px]">
              <div class="flex justify-between items-center">
                <router-link
                  :to="{ name: 'MovieView', params: { id: movie.imdb_id } }"
                  class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Details
                </router-link>

                <button
                  @click="confirmRemove(movie)"
                  class="text-red-600 px-4 py-2 rounded border border-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div
      v-if="movieToRemove"
      class="fixed inset-0 backdrop-blur-xs bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 class="text-xl font-bold mb-4">Remove from Favorites?</h2>
        <p class="text-gray-600 mb-6">
          Are you sure you want to remove "{{ movieToRemove.title }}" from your
          favorites?
        </p>
        <div class="flex justify-end gap-4">
          <button
            @click="movieToRemove = null"
            class="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            @click="removeFromFavorites"
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "FavoritesView",

  data() {
    return {
      favorites: [],
      loading: true,
      movieToRemove: null,
      sortBy: "title",
      sortOrder: "asc",
      selectedGenre: "", // Stores the selected genre
      uniqueGenres: [], // Stores distinct genres from favorites
    };
  },

  // computed: {
  //   sortedFavorites() {
  //     return [...this.favorites].sort((a, b) => {
  //       let comparison = 0;

  //       switch (this.sortBy) {
  //         case "title":
  //           comparison = a.title.localeCompare(b.title);
  //           break;
  //         case "rating":
  //           comparison = b.rating - a.rating;
  //           break;
  //         case "year":
  //           comparison = parseInt(b.year) - parseInt(a.year);
  //           break;
  //         case "dateAdded":
  //           comparison = new Date(b.created_at) - new Date(a.created_at);
  //           break;
  //       }

  //       return this.sortOrder === "asc" ? comparison : -comparison;
  //     });
  //   },
  // },

  computed: {
    filteredFavorites() {
      return this.selectedGenre
        ? this.favorites.filter((movie) =>
            movie.genre
              .split(",")
              .map((g) => g.trim())
              .includes(this.selectedGenre),
          )
        : this.favorites;
    },

    sortedFavorites() {
      return [...this.filteredFavorites].sort((a, b) => {
        let comparison = 0;

        switch (this.sortBy) {
          case "title":
            comparison = a.title.localeCompare(b.title);
            break;
          case "rating":
            comparison = b.rating - a.rating;
            break;
          case "year":
            comparison = parseInt(b.year) - parseInt(a.year);
            break;
          case "dateAdded":
            comparison = new Date(b.created_at) - new Date(a.created_at);
            break;
        }

        return this.sortOrder === "asc" ? comparison : -comparison;
      });
    },
  },

  async created() {
    await this.loadFavorites();
  },

  methods: {
    async loadFavorites() {
      this.loading = true;
      try {
        const response = await axios.get("/backend/api/favorites");
        console.log("Favorites data:", response.data); // Debugging
        this.favorites = response.data;
        // Extract all genres
        let genreSet = new Set();
        this.favorites.forEach((movie) => {
          if (movie.genre) {
            movie.genre.split(",").forEach((g) => genreSet.add(g.trim()));
          }
        });

        // Store unique genres
        this.uniqueGenres = [...genreSet].sort();
      } catch (error) {
        console.error("Error loading favorites:", error);
      } finally {
        this.loading = false;
      }
    },

    confirmRemove(movie) {
      this.movieToRemove = movie;
    },

    async removeFromFavorites() {
      if (!this.movieToRemove) return;

      try {
        await axios.delete(`/api/favorites/${this.movieToRemove.imdb_id}`);
        this.favorites = this.favorites.filter(
          (m) => m.imdb_id !== this.movieToRemove.imdb_id,
        );
        this.movieToRemove = null;
      } catch (error) {
        console.error("Error removing from favorites:", error);
        alert("Failed to remove movie from favorites");
      }
    },

    handleImageError(e) {
      e.target.src =
        "https://via.placeholder.com/300x450?text=No+Image+Available";
    },
  },
};
</script>
