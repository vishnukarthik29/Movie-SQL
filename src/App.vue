<!-- src/App.vue -->
<template>
  <div class="min-h-screen bg-gray-100">
    <nav class="bg-blue-600 text-white p-4">
      <div class="container mx-auto flex justify-between items-center">
        <router-link to="/" class="text-2xl font-bold"
          >Movie Search App</router-link
        >
        <div class="flex gap-4">
          <router-link
            to="/"
            class="px-4 py-2 rounded hover:bg-blue-700"
            :class="{ 'bg-blue-700': $route.name === 'home' }"
          >
            Search
          </router-link>
          <router-link
            to="/favorites"
            class="px-4 py-2 rounded hover:bg-blue-700"
            :class="{ 'bg-blue-700': $route.name === 'favorites' }"
          >
            Favorites
          </router-link>
        </div>
      </div>
    </nav>

    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: "App",
};
</script>
