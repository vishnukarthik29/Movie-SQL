<template>
  <div class="container flex flex-col gap-8">
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-600">Loading movie details...</p>
    </div>

    <div v-else-if="movie" class="flex flex-col gap-8 w-full">
      <!-- Movie Details Section -->
      <div class="flex flex-col md:flex-row gap-8 w-full">
        <div
          class="md:w-2/5 bg-white rounded-lg shadow-lg p-6 flex flex-col items-center"
        >
          <img
            :src="movie.Poster || movie.poster"
            :alt="movie.Title || movie.title"
            class="w-full max-w-xs md:max-w-sm object-cover rounded-lg shadow-md"
          />
          <h1 class="text-3xl font-bold mt-4 text-center">
            {{ movie.Title ?? movie.title }}
          </h1>
          <p class="text-gray-600 mt-2 text-center">
            {{ movie.Plot ?? movie.plot }}
          </p>
          <div class="mt-4 space-y-2 text-center">
            <p><strong>Year:</strong> {{ movie.Year ?? movie.year }}</p>
            <p>
              <strong>Director:</strong> {{ movie.Director ?? movie.director }}
            </p>
            <p><strong>Genre:</strong> {{ movie.Genre ?? movie.genre }}</p>
            <p>
              <strong>Rating:</strong> {{ movie.imdbRating ?? movie.rating }}/10
            </p>
          </div>
        </div>

        <!-- Video Embed -->
        <div class="md:w-3/5">
          <h2 class="text-2xl font-semibold mb-4">Watch Now</h2>
          <div class="w-full aspect-video rounded-lg shadow-lg">
            <iframe
              v-if="videoUrl"
              :src="videoUrl"
              class="w-full h-full rounded-lg"
              allowfullscreen
            ></iframe>
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

  <!-- Other Movies by Same Director Section -->
  <MoviesThatThisDirectorDirected v-if="movie" :currentMovie="movie" />

  <!-- Movies You Might Like Section -->
  <MoviesYouMightLike v-if="movie" :currentMovie="movie" />
</template>

<script>
import MoviesYouMightLike from "./MoviesYouMightLike.vue";
import MoviesThatThisDirectorDirected from "./MoviesThatThisDirectorDirected.vue";

export default {
  name: "WatchNowView",
  components: {
    MoviesYouMightLike,
    MoviesThatThisDirectorDirected,
  },
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
        this.videoUrl = `https://vidsrc-embed.ru/embed/movie?imdb=${this.id}`;
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
