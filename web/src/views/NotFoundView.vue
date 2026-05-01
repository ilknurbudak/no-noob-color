<script setup lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref } from "vue";
import { hsvToRgb, rgbToHex } from "@/services/color";

const router = useRouter();
const swatches = ref<string[]>([]);

onMounted(() => {
  // Animated palette of "lost" muted colors
  const out: string[] = [];
  for (let i = 0; i < 10; i++) {
    const h = (i * 36 + 200) % 360;
    out.push(rgbToHex(...hsvToRgb(h, 0.18, 0.85)));
  }
  swatches.value = out;
});
</script>

<template>
  <section class="nf">
    <div class="strip">
      <div v-for="(c, i) in swatches" :key="i" class="cell"
        :style="{ background: c, animationDelay: i * 80 + 'ms' }"></div>
    </div>
    <div class="msg">
      <h1>404</h1>
      <p>This palette doesn't exist (yet).</p>
      <button @click="router.push('/')">go home</button>
    </div>
  </section>
</template>

<style scoped>
.nf {
  text-align: center;
  padding: 80px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s-5);
}
.strip {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 4px;
  width: 100%;
  max-width: 500px;
}
.cell {
  height: 100px;
  border-radius: 6px;
  animation: rise .55s cubic-bezier(.2, .8, .2, 1) backwards;
}
@keyframes rise {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
h1 {
  font-family: var(--mono);
  font-size: 64px;
  font-weight: 700;
  letter-spacing: -.04em;
  color: var(--text);
  margin: 0;
}
p {
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--text-3);
  margin: var(--s-3) 0;
}
button {
  padding: 9px 18px;
  border: 1px solid var(--text);
  background: var(--text);
  color: var(--bg);
  border-radius: 8px;
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .08em;
  cursor: pointer;
}
button:hover { opacity: .85; }
</style>
