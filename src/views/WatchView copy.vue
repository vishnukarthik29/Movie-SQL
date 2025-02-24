<template>
  <div class="container flex flex-col md:flex-row gap-8">
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-600">Loading movie details...</p>
    </div>

    <div v-else-if="movie" class="flex flex-col md:flex-row gap-8">
      <!-- Movie Details -->
      <div class="md:w-2/5 bg-white rounded-lg shadow-lg p-6">
        <img
          :src="movie.poster"
          :alt="movie.title"
          class="w-full object-cover rounded-lg shadow-md"
        />
        <h1 class="text-3xl font-bold mt-4">{{ movie.title }}</h1>
        <p class="text-gray-600 mt-2">{{ movie.plot }}</p>
        <div class="mt-4 space-y-2">
          <p><strong>Year:</strong> {{ movie.year }}</p>
          <p><strong>Director:</strong> {{ movie.director }}</p>
          <p><strong>Genre:</strong> {{ movie.genre }}</p>
          <p><strong>Rating:</strong> {{ movie.rating }}/10</p>
        </div>
      </div>

      <!-- Video Embed -->
      <div class="md:w-3/5">
        <h2 class="text-2xl font-semibold mb-4">Watch Now</h2>
        <iframe
          v-if="videoUrl"
          :src="videoUrl"
          class="w-[1280px] h-[720px] md:h-[720px] rounded-lg shadow-lg"
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
        const response = await fetch(`/backend/api/moviefromdb/${this.id}`);
        if (!response.ok) throw new Error("Failed to fetch movie details");

        this.movie = await response.json();
        this.videoUrl = `https://vidsrc.xyz/embed/movie?imdb=${this.movie.imdb_id}`;
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
