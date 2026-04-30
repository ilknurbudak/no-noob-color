<script setup lang="ts">
import { onMounted, watch } from "vue";
import BrandHeader from "@/components/BrandHeader.vue";
import BottomNav from "@/components/BottomNav.vue";
import Toast from "@/components/Toast.vue";
import { detectApi } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { useLibraryStore } from "@/stores/library";

const auth = useAuthStore();
const lib = useLibraryStore();

onMounted(async () => {
  await detectApi();
  setInterval(() => detectApi(true), 30_000);
  await auth.refresh();
  if (auth.isAuthed) await lib.sync();
});

watch(() => auth.isAuthed, async (now, prev) => {
  if (now && !prev) await lib.sync();
  else if (!now && prev) lib.resetToLocal();
});
</script>

<template>
  <div class="app">
    <BrandHeader />
    <main>
      <RouterView />
    </main>
  </div>
  <BottomNav />
  <Toast />
</template>
