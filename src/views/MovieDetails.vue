<!-- src/views/MovieDetails.vue -->
<template>
  <div class="container mx-auto p-4">
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-600">Loading movie details...</p>
    </div>

    <div
      v-else-if="movie"
      class="bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl mx-auto"
    >
      <div class="p-6">
        <div class="flex justify-between items-start mb-6">
          <h1 class="text-3xl font-bold">{{ movie.Title }}</h1>
          <router-link to="/" class="text-gray-500 hover:text-gray-700">
            ← Back to Search
          </router-link>
        </div>

        <div class="flex flex-col md:flex-row gap-8">
          <div class="md:w-1/3">
            <img
              :src="movie.Poster"
              :alt="movie.Title"
              class="w-full rounded-lg shadow-md"
              @error="handleImageError"
            />
            <button
              @click="saveToFavorites"
              class="mt-4 bg-green-600 text-white px-6 py-3 rounded w-full hover:bg-green-700 disabled:bg-gray-400"
              :disabled="isSaving"
            >
              {{ isSaving ? "Saving..." : "Save to Favorites" }}
            </button>
          </div>

          <div class="md:w-2/3">
            <div class="bg-gray-50 p-4 rounded-lg mb-6">
              <h2 class="text-xl font-semibold mb-2">Plot</h2>
              <p class="text-gray-700">{{ movie.Plot }}</p>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-semibold text-gray-600">Year</h3>
                <p>{{ movie.Year }}</p>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-semibold text-gray-600">Rating</h3>
                <p>{{ movie.imdbRating }}/10</p>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-semibold text-gray-600">Runtime</h3>
                <p>{{ movie.Runtime }}</p>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-semibold text-gray-600">Director</h3>
                <p>{{ movie.Director }}</p>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-semibold text-gray-600">Genre</h3>
                <p>{{ movie.Genre }}</p>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-semibold text-gray-600">Actors</h3>
                <p>{{ movie.Actors }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8">
      <p class="text-red-600">Movie not found</p>
      <router-link
        to="/"
        class="mt-4 inline-block text-blue-600 hover:text-blue-800"
      >
        Return to Search
      </router-link>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "MovieDetails",
  props: {
    id: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      movie: null,
      loading: true,
      isSaving: false,
    };
  },

  async created() {
    await this.loadMovieDetails();
  },

  methods: {
    async loadMovieDetails() {
      this.loading = true;
      try {
        const response = await axios.get(
          `http://localhost:3000/api/movie/${this.id}`
        );
        this.movie = response.data;
      } catch (error) {
        console.error("Error fetching movie details:", error);
      } finally {
        this.loading = false;
      }
    },

    async saveToFavorites() {
      if (!this.movie || this.isSaving) return;

      this.isSaving = true;
      try {
        await axios.post("http://localhost:3000/api/favorites", {
          imdb_id: this.movie.imdbID,
          title: this.movie.Title,
          year: this.movie.Year,
          poster: this.movie.Poster,
          plot: this.movie.Plot,
          rating: this.movie.imdbRating,
        });
        alert("Movie saved to favorites!");
      } catch (error) {
        console.error("Error saving to favorites:", error);
        alert("Failed to save movie to favorites");
      } finally {
        this.isSaving = false;
      }
    },

    handleImageError(e) {
      e.target.src =
        "https://via.placeholder.com/300x450?text=No+Image+Available";
    },
  },
};
</script>
