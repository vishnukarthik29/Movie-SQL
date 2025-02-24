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
          <h1 class="text-3xl font-bold">{{ movie.title }}</h1>
          <router-link
            to="/favorites"
            class="text-gray-500 hover:text-gray-700"
          >
            ← Back To Favorite
          </router-link>
        </div>

        <div class="flex flex-col md:flex-row gap-8">
          <div class="md:w-1/3">
            <img
              :src="movie.poster"
              :alt="movie.Title"
              class="w-full rounded-lg shadow-md"
              @error="handleImageError"
            />
          </div>

          <div class="md:w-2/3">
            <div class="bg-gray-50 p-4 rounded-lg mb-6">
              <h2 class="text-xl font-semibold mb-2">Plot</h2>
              <p class="text-gray-700">{{ movie.plot }}</p>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-semibold text-gray-600">Year</h3>
                <p>{{ movie.year }}</p>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-semibold text-gray-600">Rating</h3>
                <p>{{ movie.rating }}/10</p>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-semibold text-gray-600">Runtime</h3>
                <p>{{ movie.runtime }}</p>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-semibold text-gray-600">Director</h3>
                <p>{{ movie.director }}</p>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-semibold text-gray-600">Genre</h3>
                <p v-if="movie.Genre">{{ movie.Genre }}</p>
                <p v-else>{{ movie.genre }}</p>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-semibold text-gray-600">Actors</h3>
                <p>{{ movie.actors }}</p>
              </div>
            </div>
            <div class="pt-5">
              <router-link
                :to="`/watch/${movie.imdb_id}`"
                class="bg-blue-600 text-white px-6 py-3 rounded w-full text-center hover:bg-blue-700"
              >
                Watch Now
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8">
      <p class="text-red-600">Movie not found</p>
      <router-link
        to="/favorites"
        class="mt-4 inline-block text-blue-600 hover:text-blue-800"
      >
        Back To Favorite
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
        const response = await axios.get(`/api/moviefromdb/${this.id}`);
        this.movie = response.data;
        console.log(response.data);
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
        await axios.post("/api/favorites", {
          imdb_id: this.movie.imdb_id,
          title: this.movie.title,
          year: this.movie.year,
          runtime: this.movie.runtime,
          genre: this.movie.genre,
          actors: this.movie.actors,
          director: this.movie.director,
          poster: this.movie.poster,
          plot: this.movie.plot,
          rating: this.movie.rating,
        });
        alert("Movie saved to favorites!");
        this.$router.push("/favorites");
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
