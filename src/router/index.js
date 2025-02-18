// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import MovieDetails from "../views/MovieDetails.vue";
import FavoritesView from "../views/FavoritesView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/movie/:id",
      name: "movie-details",
      component: MovieDetails,
      props: true,
    },
    {
      path: "/favorites",
      name: "favorites",
      component: FavoritesView,
    },
  ],
});

export default router;
