import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "tippy.js/dist/tippy.css";
import "./style.css";
import { useThemeStore } from "@/stores/theme";

const app = createApp(App);
app.use(createPinia());
app.use(router);

// initialize theme before mount so html[data-theme] is set on first paint
useThemeStore();

app.mount("#app");
