<template>
  <div class="min-h-screen bg-gray-100">
    <TopBar />
    <main class="mx-auto py-6 sm:px-6 lg:px-8">
      <router-view></router-view>
    </main>
  </div>
</template>

<script>
import TopBar from "@/views/Topbar.vue"; // Ensure correct path

export default {
  name: "App",
  components: {
    TopBar,
  },
};
</script>
