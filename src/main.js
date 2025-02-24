import "./assets/main.css";
import axios from "./plugins/axios"; // Import axios configuration

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);
app.config.globalProperties.$axios = axios;
app.use(router);

app.mount("#app");
