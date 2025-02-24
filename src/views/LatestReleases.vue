<template>
  <div class="px-4 sm:px-6 lg:px-6">
    <div class="sm:flex sm:items-center mb-6">
      <h1 class="text-2xl font-bold mb-6 text-gray-900">Latest Releases</h1>
    </div>

    <!-- Movie Grid -->
    <div
      class="grid grid-cols-1 gap-6 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 xl:grid-cols-6"
    >
      <div
        v-for="movie in latestReleases"
        :key="movie.imdb_id"
        class="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-lg transition-shadow duration-300 relative"
      >
        <div class="relative">
          <img
            :src="movie.poster"
            :alt="movie.title"
            class="w-full h-96 object-fit"
          />
        </div>
        <div class="p-4">
          <div class="flex items-center justify-between mb-2">
            <!-- Movie Title -->
            <h3 class="text-md font-semibold text-gray-900">
              {{ movie.title }}
            </h3>
            <!-- Heart Icon -->
            <button
              @click="handleFavoriteClick(movie)"
              class="text-red-500 hover:text-red-600 mr-2"
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

          <span class="text-sm text-gray-600">
            Released: {{ new Date(movie.release_date).toLocaleDateString() }}
          </span>
        </div>

        <!-- View Details Link -->
        <div class="mb-6"></div>
        <div
          class="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center pb-[6px]"
        >
          <router-link
            :to="{ name: 'movie-details', params: { id: movie.imdb_id } }"
            class="bottom-0 pb-3block text-center bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          >
            <button>View Details</button>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Auth Modal -->
    <div
      v-if="showAuthModal"
      class="fixed inset-0 backdrop-blur-xs flex items-center justify-center"
    >
      <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">{{ isLogin ? "Login" : "Sign Up" }}</h2>
          <button
            @click="showAuthModal = false"
            class="text-gray-500 hover:text-gray-700"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div v-if="!isLogin">
            <label class="block text-sm font-medium text-gray-700">Name</label>
            <input
              v-model="authForm.name"
              type="text"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <input
              v-model="authForm.email"
              type="email"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Password</label
            >
            <input
              v-model="authForm.password"
              type="password"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {{ isLogin ? "Login" : "Sign Up" }}
          </button>
        </form>

        <div class="mt-4 text-center">
          <button
            @click="isLogin = !isLogin"
            class="text-sm text-blue-600 hover:text-blue-500"
          >
            {{
              isLogin
                ? "Need an account? Sign up"
                : "Already have an account? Login"
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { useAuth } from "../store/auth";

export default {
  name: "LatestReleases",
  data() {
    return {
      latestReleases: [],
      favorites: [],
      showAuthModal: false,
      isLogin: true,
      pendingMovie: null,
      authForm: {
        name: "",
        email: "",
        password: "",
      },
    };
  },
  setup() {
    const auth = useAuth();
    return { auth };
  },

  async created() {
    await this.fetchLatestReleases();
    if (this.auth.isAuthenticated()) {
      await this.fetchFavorites();
    }
  },
  methods: {
    async fetchLatestReleases() {
      try {
        const response = await axios.get("/latest-releases");
        this.latestReleases = response.data;
      } catch (error) {
        console.error("Error fetching latest releases:", error);
      }
    },

    async fetchFavorites() {
      try {
        const response = await axios.get("/api/favorites");
        this.favorites = response.data;
      } catch (error) {
        console.error("Error fetching favorites:", error);
      }
    },

    isFavorite(imdbId) {
      return this.favorites.some((movie) => movie.imdb_id === imdbId);
    },

    checkAuthAndShowModal(movie) {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        this.pendingMovie = movie;
        this.showAuthModal = true;
        return false;
      }
      return true;
    },

    async handleFavoriteClick(movie) {
      if (!this.auth.isAuthenticated()) {
        this.pendingMovie = movie;
        this.showAuthModal = true;
        this.isLogin = true; // Ensure login form is shown
        return;
      }
      await this.toggleFavorite(movie);
    },

    async toggleFavorite(movie) {
      try {
        if (this.isFavorite(movie.imdb_id)) {
          await axios.delete(`/api/favorites/${movie.imdb_id}`);
        } else {
          await axios.post("/api/favorites", {
            imdb_id: movie.imdb_id,
            title: movie.title,
            runtime: movie.runtime,
            director: movie.director,
            genre: movie.genre,
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

    async handleSubmit() {
      let success = false;

      try {
        if (this.isLogin) {
          success = await this.auth.login(
            this.authForm.email,
            this.authForm.password
          );
        } else {
          success = await this.auth.register(
            this.authForm.name,
            this.authForm.email,
            this.authForm.password
          );
        }

        if (success) {
          location.reload(); // Force page refresh
          this.showAuthModal = false;
          await this.fetchFavorites();

          if (this.pendingMovie) {
            await this.toggleFavorite(this.pendingMovie);
            this.pendingMovie = null;
          }

          this.resetAuthForm();
        }
      } catch (error) {
        console.error("Authentication error:", error);
      }
    },

    resetAuthForm() {
      this.authForm = {
        name: "",
        email: "",
        password: "",
      };
      this.isLogin = true;
    },

    closeAuthModal() {
      this.showAuthModal = false;
      this.pendingMovie = null;
      this.resetAuthForm();
    },
  },
  watch: {
    "auth.token"(newToken) {
      if (newToken) {
        this.fetchFavorites();
      } else {
        this.favorites = [];
      }
    },
  },
};
</script>
