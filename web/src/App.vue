<script setup lang="ts">
import { onMounted } from "vue";
import BrandHeader from "@/components/BrandHeader.vue";
import BottomNav from "@/components/BottomNav.vue";
import Toast from "@/components/Toast.vue";
import { detectApi } from "@/services/api";

onMounted(() => {
  detectApi();
  setInterval(() => detectApi(true), 30_000);
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
