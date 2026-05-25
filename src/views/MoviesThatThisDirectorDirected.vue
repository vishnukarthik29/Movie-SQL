<template>
  <div class="mt-12">
    <h2 class="text-2xl font-semibold mb-6">More Movies by {{ director }}</h2>
    <div v-if="loading" class="text-center py-4">
      <p class="text-gray-600">Loading director filmography...</p>
    </div>
    <div v-else-if="directorMovies.length === 0" class="text-center py-4">
      <p class="text-gray-600">No other movies found by this director</p>
    </div>
    <div v-else class="director-movies-slider">
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
          v-for="movie in directorMovies"
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
              <p class="text-sm text-gray-600 mb-2">{{ movie.year }}</p>
              <div class="flex items-center mb-2">
                <span class="text-yellow-500 mr-1">★</span>
                <span>{{ movie.rating }}/10</span>
              </div>
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
  name: "MoviesThatThisDirectorDirected",
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
      directorMovies: [],
      loading: true,
      director: "",
    };
  },
  watch: {
    currentMovie: {
      immediate: true,
      handler(newValue) {
        if (newValue) {
          this.fetchDirectorMovies();
        }
      },
    },
  },
  methods: {
    async fetchDirectorMovies() {
      this.loading = true;
      this.directorMovies = []; // Initialize to empty array

      try {
        // Get director from current movie
        this.director =
          this.currentMovie.Director || this.currentMovie.director;

        if (!this.director) {
          console.warn("No director found for current movie");
          this.loading = false;
          return;
        }

        // Fetch movies by the same director, excluding the current movie
        const currentImdbId =
          this.currentMovie.imdbID || this.currentMovie.imdb_id;

        const response = await fetch(
          `/backend/api/search-by-director?director=${encodeURIComponent(
            this.director
          )}`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch director movies: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          console.warn("Director movies response is not an array:", data);
          this.loading = false;
          return;
        }

        // Filter out the current movie
        this.directorMovies = data.filter(
          (movie) => movie.imdb_id !== currentImdbId
        );
      } catch (error) {
        console.error("Error fetching director movies:", error);
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
