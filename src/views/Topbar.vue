<template>
  <nav class="bg-white shadow-lg">
    <div class="mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- Logo and Brand -->
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <router-link to="/">
              <h1 class="text-2xl font-bold text-gray-900">Movie DB</h1>
            </router-link>
          </div>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex md:items-center md:space-x-8">
          <router-link
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            :class="getLinkClass(link.path)"
          >
            {{ link.name }}
          </router-link>
          <!-- Logout Button -->
          <button
            v-if="ifuseridpresent"
            @click="logoutauth"
            class="ml-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        <!-- Mobile Menu Button -->
        <div class="flex items-center md:hidden">
          <button
            @click="isOpen = !isOpen"
            class="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          >
            <span class="sr-only">Open main menu</span>
            <!-- Menu Icon -->
            <svg
              v-if="!isOpen"
              class="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            <!-- Close Icon -->
            <svg
              v-else
              class="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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
      </div>
    </div>

    <!-- Mobile Menu -->
    <div v-show="isOpen" class="md:hidden">
      <div class="pt-2 pb-3 space-y-1">
        <router-link
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          :class="getMobileLinkClass(link.path)"
          @click="isOpen = false"
        >
          {{ link.name }}
        </router-link>
        <!-- Logout Button for Mobile -->
        <button
          v-if="ifuseridpresent"
          @click="logoutauth"
          class="block w-full text-left px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </div>
  </nav>
</template>

<script>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuth } from "../store/auth"; // Import useAuth

export default {
  setup() {
    const route = useRoute();
    const router = useRouter();
    const isOpen = ref(false);
    const auth = useAuth(); // Use auth store

    const navLinks = [
      { path: "/", name: "Latest Releases" },
      { path: "/search", name: "Search" },
      { path: "/favorites", name: "Favorites" },
    ];

    const getLinkClass = (path) => {
      return route.path === path
        ? "border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium";
    };

    const getMobileLinkClass = (path) => {
      return route.path === path
        ? "bg-indigo-50 border-indigo-500 text-indigo-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
        : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium";
    };

    const ifuseridpresent = ref(auth.token.value); // Check if user is logged in

    const logoutauth = () => {
      auth.logout(); // Call logout from auth.js
      router.push("/"); // Redirect to login page
      location.reload(); // Force page refresh
    };

    return {
      isOpen,
      navLinks,
      getLinkClass,
      getMobileLinkClass,
      logoutauth,
      ifuseridpresent,
    };
  },
};
</script>
