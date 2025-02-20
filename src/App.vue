<template>
  <div class="min-h-screen bg-gray-100">
    <nav class="bg-white shadow-lg">
      <div class="max-w-screen mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-2xl font-bold text-gray-900">Movie DB</h1>
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <router-link to="/" :class="getLinkClass('/')">
                Latest Releases
              </router-link>
              <router-link to="/search" :class="getLinkClass('/search')">
                Search
              </router-link>
              <router-link to="/favorites" :class="getLinkClass('/favorites')">
                Favorites
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-screen mx-auto py-6 sm:px-6 lg:px-8">
      <router-view></router-view>
    </main>
  </div>
</template>

<script>
import { useRoute } from "vue-router";

export default {
  name: "App",
  setup() {
    const route = useRoute();

    const getLinkClass = (path) => {
      return route.path === path
        ? "border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium";
    };

    return { getLinkClass };
  },
};
</script>
