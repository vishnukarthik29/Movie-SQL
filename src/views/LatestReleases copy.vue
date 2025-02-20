<template>
  <div class="px-4 sm:px-6 lg:px-6">
    <div class="sm:flex sm:items-center mb-6">
      <h1 class="text-2xl font-bold mb-6 text-gray-900">Latest Releases</h1>
    </div>

    <!-- Movie Grid -->
    <div
      class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <div
        v-for="movie in latestReleases"
        :key="movie.imdb_id"
        class="group bg-white rounded-lg shadow-lg overflow-hidden relative h-[22rem] flex flex-col"
      >
        <div class="relative h-48">
          <img
            :src="movie.poster"
            :alt="movie.title"
            class="w-full h-96 object-fit"
          />
        </div>

        <div class="p-4 flex-grow flex flex-col">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            {{ movie.title }}
          </h3>

          <span class="text-sm text-gray-600"
            >Released:
            {{ new Date(movie.release_date).toLocaleDateString() }}</span
          >

          <div class="flex items-center justify-between mt-auto">
            <button
              @click="toggleFavorite(movie)"
              class="text-red-500 hover:text-red-600"
              :class="{ 'text-red-600': isFavorite(movie.imdb_id) }"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                :fill="isFavorite(movie.imdb_id) ? 'currentColor' : 'none'"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- View Details Button (Visible on Hover) -->
        <button
          @click="goToMovieDetails(movie.imdb_id)"
          class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg w-3/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          View Details
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "LatestReleases",
  data() {
    return {
      latestReleases: [],
      favorites: [],
    };
  },
  async created() {
    await this.fetchLatestReleases();
    await this.fetchFavorites();
  },
  methods: {
    async fetchLatestReleases() {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/latest-releases"
        );
        this.latestReleases = response.data;
      } catch (error) {
        console.error("Error fetching latest releases:", error);
      }
    },
    async fetchFavorites() {
      try {
        const response = await axios.get("/backend/api/favorites");
        this.favorites = response.data;
      } catch (error) {
        console.error("Error fetching favorites:", error);
      }
    },
    isFavorite(imdbId) {
      return this.favorites.some((movie) => movie.imdb_id === imdbId);
    },
    async toggleFavorite(movie) {
      try {
        if (this.isFavorite(movie.imdb_id)) {
          await axios.delete(`/backend/api/favorites/${movie.imdb_id}`);
        } else {
          await axios.post("/backend/api/favorites", {
            imdb_id: movie.imdb_id,
            title: movie.title,
            year: new Date(movie.release_date).getFullYear(),
            poster: movie.poster,
            plot: movie.plot,
            rating: movie.rating,
          });
        }
        await this.fetchFavorites();
      } catch (error) {
        console.error("Error toggling favorite:", error);
      }
    },
    goToMovieDetails(movieId) {
      this.$router.push({ name: "movie-details", params: { id: movieId } });
    },
  },
};
</script>
