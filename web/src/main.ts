import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "tippy.js/dist/tippy.css";
import "./style.css";

// Inject Plausible domain (build-time env) for privacy-respecting analytics.
// If VITE_PLAUSIBLE_DOMAIN is not set, no script loads.
const plausibleDomain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;
if (plausibleDomain) {
  document.documentElement.dataset.plausibleDomain = plausibleDomain;
}

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount("#app");
