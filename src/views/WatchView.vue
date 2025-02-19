<template>
  <div class="container mx-auto p-4 flex flex-col md:flex-row gap-8">
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-600">Loading movie details...</p>
    </div>

    <div v-else-if="movie" class="flex flex-col md:flex-row gap-8">
      <!-- Movie Details -->
      <div class="md:w-1/3 bg-white rounded-lg shadow-lg p-6">
        <img
          :src="movie.Poster"
          :alt="movie.Title"
          class="w-full rounded-lg shadow-md"
        />
        <h1 class="text-3xl font-bold mt-4">{{ movie.Title }}</h1>
        <p class="text-gray-600 mt-2">{{ movie.Plot }}</p>
        <div class="mt-4 space-y-2">
          <p><strong>Year:</strong> {{ movie.Year }}</p>
          <p><strong>Director:</strong> {{ movie.Director }}</p>
          <p><strong>Genre:</strong> {{ movie.Genre }}</p>
          <p><strong>Actors:</strong> {{ movie.Actors }}</p>
          <p><strong>Rating:</strong> {{ movie.imdbRating }}/10</p>
        </div>
      </div>

      <!-- Video Embed -->
      <div class="md:w-2/3">
        <h2 class="text-2xl font-semibold mb-4">Watch Now</h2>
        <iframe
          v-if="videoUrl"
          :src="videoUrl"
          class="w-full h-[400px] md:h-[500px] rounded-lg shadow-lg"
          allowfullscreen
        ></iframe>
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
export default {
  name: "WatchNowView",
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      movie: null,
      videoUrl: "",
      loading: true,
    };
  },
  async created() {
    await this.loadMovieDetails();
  },
  methods: {
    async loadMovieDetails() {
      this.loading = true;
      try {
        const response = await fetch(`/backend/api/movie/${this.id}`);
        if (!response.ok) throw new Error("Failed to fetch movie details");

        this.movie = await response.json();
        this.videoUrl = `https://vidsrc.xyz/embed/movie?imdb=${this.movie.imdbID}`;
      } catch (error) {
        console.error("Error fetching movie details:", error);
        this.movie = null;
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
