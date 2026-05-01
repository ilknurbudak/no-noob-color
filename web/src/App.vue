<script setup lang="ts">
import { onMounted, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import BrandHeader from "@/components/BrandHeader.vue";
import BottomNav from "@/components/BottomNav.vue";
import Toast from "@/components/Toast.vue";
import FeedbackWidget from "@/components/FeedbackWidget.vue";
import ThemeToggle from "@/components/ThemeToggle.vue";
import { detectApi } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { useLibraryStore } from "@/stores/library";

const auth = useAuthStore();
const lib = useLibraryStore();
const route = useRoute();
const router = useRouter();

const SEEN_WELCOME_KEY = "nnc_seen_welcome_v1";

// Hide chrome (header, bottom nav, feedback) on the welcome screen
const isWelcome = computed(() => route.name === "welcome");

onMounted(async () => {
  await detectApi();
  setInterval(() => detectApi(true), 30_000);
  await auth.refresh();
  if (auth.isAuthed) await lib.sync();

  // First-time visitor (no token, no welcome flag) → /welcome
  // Authed users skip welcome — they've seen it.
  const seenWelcome = (() => {
    try { return localStorage.getItem(SEEN_WELCOME_KEY) === "true"; } catch { return false; }
  })();
  if (!auth.isAuthed && !seenWelcome && route.name !== "welcome") {
    router.replace("/welcome");
  }
});

watch(() => auth.isAuthed, async (now, prev) => {
  if (now && !prev) await lib.sync();
  else if (!now && prev) lib.resetToLocal();
});
</script>

<template>
  <div class="app" v-if="!isWelcome">
    <BrandHeader />
    <main>
      <RouterView />
    </main>
  </div>
  <RouterView v-else />
  <BottomNav v-if="!isWelcome" />
  <Toast />
  <FeedbackWidget v-if="!isWelcome" />
  <ThemeToggle />
</template>
