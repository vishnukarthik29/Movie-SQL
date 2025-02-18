<!-- src/views/HomeView.vue -->
<template>
  <div class="container mx-auto p-4">
    <!-- Search Section -->
    <div class="mb-8">
      <div class="flex gap-4 mb-4">
        <input
          v-model="searchQuery"
          @keyup.enter="searchMovies"
          type="text"
          placeholder="Search for movies..."
          class="flex-1 p-2 border rounded"
        />
        <button
          @click="searchMovies"
          class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Search
        </button>
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
        v-for="movie in searchResults"
        :key="movie.imdbID"
        class="bg-white rounded-lg shadow-md overflow-hidden"
      >
        <img
          :src="movie.Poster"
          :alt="movie.Title"
          class="w-full h-96 object-cover"
          @error="handleImageError"
        />
        <div class="p-4">
          <h3 class="text-lg font-semibold mb-2">{{ movie.Title }}</h3>
          <p class="text-gray-600">{{ movie.Year }}</p>
          <router-link
            :to="{ name: 'movie-details', params: { id: movie.imdbID } }"
            class="mt-4 bg-blue-600 text-white px-4 py-2 rounded w-full block text-center hover:bg-blue-700"
          >
            View Details
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "HomeView",
  data() {
    return {
      searchQuery: "",
      searchResults: [],
      loading: false,
    };
  },

  methods: {
    async searchMovies() {
      if (!this.searchQuery.trim()) return;

      this.loading = true;
      try {
        const response = await axios.get(
          `http://localhost:3000/api/search?title=${this.searchQuery}`
        );
        this.searchResults = response.data.Search || [];
      } catch (error) {
        console.error("Error searching movies:", error);
      } finally {
        this.loading = false;
      }
    },

    handleImageError(e) {
      e.target.src =
        "https://via.placeholder.com/300x450?text=No+Image+Available";
    },
  },
};
</script>
