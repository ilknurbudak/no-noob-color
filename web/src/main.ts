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

const pinia = createPinia();
const app = createApp(App);
app.use(pinia);
app.use(router);

// Init theme store BEFORE mount so [data-theme="dark"] is set before
// the first paint — otherwise we get a flash of light theme on first load,
// and the Welcome view (which doesn't use BrandHeader) never triggers init.
import { useThemeStore } from "@/stores/theme";
useThemeStore();

app.mount("#app");
