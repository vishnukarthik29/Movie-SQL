// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import MovieDetails from "../views/MovieDetails.vue";
import FavoritesView from "../views/FavoritesView.vue";
import LatestReleases from "@/views/LatestReleases.vue";
import SearchViews from "@/views/SearchViews.vue";
import WatchView from "@/views/WatchView.vue";
import MovieView from "@/views/MovieView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "LatestReleases",
      component: LatestReleases,
    },
    {
      path: "/search",
      name: "SearchView",
      component: SearchViews,
    },
    {
      path: "/movie/:id",
      name: "movie-details",
      component: MovieDetails,
      props: true,
    },
    {
      path: "/watch/:id",
      name: "WatchNow",
      component: WatchView,
      props: true,
    },
    {
      path: "/favorites",
      name: "favorites",
      component: FavoritesView,
    },
    {
      path: "/movieview/:id",
      name: "MovieView",
      component: MovieView,
      props: true,
    },
  ],
});

export default router;
