import { defineStore } from "pinia";
import { ref } from "vue";

export const useToastStore = defineStore("toast", () => {
  const message = ref("");
  const visible = ref(false);
  let timer: number | null = null;

  function show(text: string, durationMs = 1800) {
    message.value = text;
    visible.value = true;
    if (timer !== null) window.clearTimeout(timer);
    timer = window.setTimeout(() => { visible.value = false; }, durationMs);
  }

  return { message, visible, show };
});
