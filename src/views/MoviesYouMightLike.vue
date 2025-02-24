<template>
  <div class="mt-12">
    <h2 class="text-2xl font-semibold mb-6">Movies You Might Like</h2>
    <div v-if="loading" class="text-center py-4">
      <p class="text-gray-600">Loading recommendations...</p>
    </div>
    <div v-else-if="similarMovies.length === 0" class="text-center py-4">
      <p class="text-gray-600">No similar movies found</p>
    </div>
    <div v-else class="recommendation-slider">
      <swiper
        :slides-per-view="1.5"
        :space-between="20"
        :breakpoints="{
          '640': {
            slidesPerView: 2.5,
            spaceBetween: 20,
          },
          '768': {
            slidesPerView: 3.5,
            spaceBetween: 30,
          },
          '1024': {
            slidesPerView: 4.5,
            spaceBetween: 30,
          },
        }"
        :pagination="{ clickable: true }"
        :navigation="true"
      >
        <swiper-slide
          v-for="movie in similarMovies"
          :key="movie.imdb_id"
          class="h-auto"
        >
          <div
            class="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col"
          >
            <img
              :src="movie.poster"
              :alt="movie.title"
              class="w-full object-fit"
              @error="handleImageError"
            />
            <div class="p-4 flex flex-col flex-grow">
              <h3 class="text-lg font-semibold mb-2 line-clamp-2">
                {{ movie.title }}
              </h3>
              <div class="mt-auto">
                <router-link
                  :to="{ name: 'MovieView', params: { id: movie.imdb_id } }"
                  class="inline-block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
                >
                  View Details
                </router-link>
              </div>
            </div>
          </div>
        </swiper-slide>
      </swiper>
    </div>
  </div>
</template>

<script>
import { Swiper, SwiperSlide } from "swiper/vue";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default {
  name: "MoviesYouMightLike",
  components: {
    Swiper,
    SwiperSlide,
  },
  props: {
    currentMovie: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      similarMovies: [],
      loading: true,
    };
  },
  watch: {
    currentMovie: {
      immediate: true,
      handler(newValue) {
        if (newValue) {
          this.fetchSimilarMovies();
        }
      },
    },
  },
  methods: {
    async fetchSimilarMovies() {
      this.loading = true;
      this.similarMovies = []; // Initialize to empty array

      try {
        // Get genre from current movie
        const genre = this.currentMovie.Genre || this.currentMovie.genre;

        if (!genre) {
          console.warn("No genre found for current movie");
          this.loading = false;
          return;
        }

        // Fetch movies with similar genre, excluding the current movie
        const currentImdbId =
          this.currentMovie.imdbID || this.currentMovie.imdb_id;

        const response = await fetch(
          `/api/similar-movies?genre=${encodeURIComponent(
            genre
          )}&exclude=${currentImdbId}`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch similar movies: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          console.warn("Similar movies response is not an array:", data);
          this.loading = false;
          return;
        }

        this.similarMovies = data;
      } catch (error) {
        console.error("Error fetching similar movies:", error);
        // Don't set this.similarMovies here - keep the initialized empty array
      } finally {
        this.loading = false;
      }
    },
    handleImageError(e) {
      e.target.src = "/placeholder-movie.jpg"; // Fallback image path
    },
  },
};
</script>

<style scoped>
.swiper {
  width: 100%;
  height: 100%;
}

.swiper-slide {
  height: auto;
}
</style>
