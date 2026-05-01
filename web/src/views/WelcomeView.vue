<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import { usePersonaStore } from "@/stores/persona";
import { hsvToRgb, rgbToHex } from "@/services/color";
import { requestVerification } from "@/services/api";

const SEEN_KEY = "nnc_seen_welcome_v1";
const SPLASH_MS = 5000;

const router = useRouter();
const auth = useAuthStore();
const toast = useToastStore();
const persona = usePersonaStore();

type Phase = "splash" | "persona" | "auth";
const phase = ref<Phase>("splash");
const showSignup = ref(false);
const email = ref("");
const password = ref("");
const busy = ref(false);
const selectedPersonaId = ref<string | null>(null);

// Generate vibrant rising bars per refresh
const bars = computed(() => {
  const out: { hex: string; delay: number; duration: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const h = (i * 28 + Math.random() * 20) % 360;
    const s = 0.7 + Math.random() * 0.2;
    const v = 0.6 + Math.random() * 0.3;
    out.push({
      hex: rgbToHex(...hsvToRgb(h, s, v)),
      delay: i * 60,
      duration: 600 + Math.random() * 400,
    });
  }
  return out;
});

const sideBarsLeft = computed(() => bars.value.slice(0, 7));
const sideBarsRight = computed(() => bars.value.slice(7, 14));

const SUB = "lab";

let timeout: ReturnType<typeof setTimeout> | null = null;

onMounted(() => {
  // If user landed here directly (router push or query reset), make sure
  // we do start from splash even if they've seen it before.
  try {
    if (window.location.hash.includes("reset=1")) {
      localStorage.removeItem(SEEN_KEY);
    }
  } catch {}

  timeout = setTimeout(() => {
    phase.value = "persona";
  }, SPLASH_MS);
});

onUnmounted(() => {
  if (timeout) clearTimeout(timeout);
});

function commitWelcomeFlag() {
  try { localStorage.setItem(SEEN_KEY, "true"); } catch {}
}

function pickPersona(id: string) {
  selectedPersonaId.value = id;
  persona.set(id);
}

function nextFromPersona() {
  // Persona is optional — proceed to auth either way
  phase.value = "auth";
}

function skipPersona() {
  phase.value = "auth";
}

function completeAuth() {
  commitWelcomeFlag();
  router.push("/generate");
}

function skipAuth() {
  commitWelcomeFlag();
  router.push("/generate");
  toast.show("Welcome — your library lives on this device only");
}

async function submitAuth() {
  if (!email.value || !password.value) return;
  busy.value = true;
  try {
    if (showSignup.value) {
      await auth.signup(email.value, password.value);
      try { await requestVerification(email.value); } catch {}
      toast.show("Account created");
    } else {
      await auth.login(email.value, password.value);
      toast.show("Welcome back");
    }
    completeAuth();
  } catch { /* error in auth.error */ }
  finally { busy.value = false; }
}
</script>

<template>
  <div class="welcome">
    <!-- Always-on side bars -->
    <div class="side side-left">
      <span
        v-for="(b, i) in sideBarsLeft" :key="'l'+i"
        class="side-bar"
        :style="{ background: b.hex, animationDelay: i * 90 + 'ms' }"
      ></span>
    </div>
    <div class="side side-right">
      <span
        v-for="(b, i) in sideBarsRight" :key="'r'+i"
        class="side-bar"
        :style="{ background: b.hex, animationDelay: (i * 90 + 200) + 'ms' }"
      ></span>
    </div>

    <!-- SPLASH -->
    <div v-if="phase === 'splash'" class="splash">
      <div class="logo-wrap">
        <div class="logo-mask big" role="img" aria-label="no noob color"></div>
        <span class="lab-badge">
          <span
            v-for="(c, i) in SUB" :key="i"
            :style="{ animationDelay: (1500 + i * 90) + 'ms' }"
            class="letter"
          >{{ c }}</span>
        </span>
      </div>

      <p class="sub">color tool for working creatives</p>

      <div class="loader">
        <span class="loader-bar"></span>
      </div>
    </div>

    <!-- PERSONA -->
    <div v-else-if="phase === 'persona'" class="step-card persona-step">
      <div class="step-eyebrow">Step 1 of 2</div>
      <h2 class="step-title">What kind of work do you do?</h2>
      <p class="step-lead">
        Pick the one closest to your day-to-day. The app surfaces tools tuned
        to that workflow first. You can change it any time.
      </p>

      <div class="persona-grid">
        <button
          v-for="p in persona.PERSONAS" :key="p.id"
          class="persona-card"
          :class="{ active: selectedPersonaId === p.id }"
          @click="pickPersona(p.id)"
        >
          <span class="p-name">{{ p.name }}</span>
          <span class="p-desc">{{ p.desc.split('.')[0] }}.</span>
        </button>
      </div>

      <div class="step-actions">
        <button class="link-btn" @click="skipPersona">skip — choose later</button>
        <button class="primary" :disabled="!selectedPersonaId" @click="nextFromPersona">
          continue →
        </button>
      </div>
    </div>

    <!-- AUTH -->
    <div v-else class="step-card auth-step">
      <div class="step-eyebrow">Step 2 of 2 · Save your work</div>
      <div class="auth-logo-row">
        <div class="logo-mask small" role="img" aria-label="no noob color"></div>
        <span class="auth-eyebrow">lab</span>
      </div>
      <h2 class="step-title">Sign in so your library follows you.</h2>
      <p class="step-lead">
        Cloud sync keeps your palettes, liked colors, taste profile and folders
        across devices. Or skip — everything still works on this device alone.
      </p>

      <div class="auth-tabs">
        <button :class="{ active: !showSignup }" @click="showSignup = false">Sign in</button>
        <button :class="{ active: showSignup }" @click="showSignup = true">Create account</button>
      </div>

      <form @submit.prevent="submitAuth">
        <label>
          <span>Email</span>
          <input v-model="email" type="email" autocomplete="email" required autofocus />
        </label>
        <label>
          <span>Password</span>
          <input v-model="password" type="password" autocomplete="current-password" minlength="8" required />
        </label>
        <p v-if="auth.error" class="err">{{ auth.error }}</p>
        <button type="submit" class="primary" :disabled="busy || auth.loading">
          <template v-if="busy || auth.loading">…</template>
          <template v-else-if="showSignup">Create account</template>
          <template v-else>Sign in</template>
        </button>
      </form>

      <button class="link-btn" @click="skipAuth">
        Skip — use anonymously on this device →
      </button>
    </div>
  </div>
</template>

<style scoped>
.welcome {
  position: fixed;
  inset: 0;
  background: #050505;
  color: #ffffff;
  z-index: 1000;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* Side bars */
.side {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 16%;
  display: flex;
  pointer-events: none;
  overflow: hidden;
  opacity: .4;
}
.side-left { left: 0; }
.side-right { right: 0; }
.side-bar {
  flex: 1;
  height: 100%;
  transform: translateY(100%);
  animation: bg-rise 1.4s cubic-bezier(.2, .8, .2, 1) forwards,
             bar-shimmer 4s ease-in-out infinite alternate 1.4s;
}
@keyframes bg-rise { to { transform: translateY(0); } }
@keyframes bar-shimmer {
  from { opacity: .8; }
  to   { opacity: 1; filter: hue-rotate(20deg); }
}
@media (max-width: 720px) {
  .side { width: 8%; opacity: .3; }
}
@media (max-width: 480px) {
  .side { display: none; }
}

/* SPLASH */
.splash {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  max-width: 100%;
}
.logo-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
}

/* Animated mask logo */
.logo-mask {
  background: conic-gradient(
    from 0deg,
    #ff6b1a, #ff00aa, #9d4bff, #00d9ff, #00ff88, #ffd400, #ff6b1a
  );
  -webkit-mask: url("/logo-lockup.png") no-repeat center / contain;
  mask: url("/logo-lockup.png") no-repeat center / contain;
  filter: saturate(1.2) brightness(1.1);
  animation: logo-spin 8s linear infinite, logo-in 1s cubic-bezier(.2, .8, .2, 1);
}
.logo-mask.big {
  width: clamp(280px, 60vw, 480px);
  aspect-ratio: 1.05 / 1;
}
.logo-mask.small {
  width: 100px;
  aspect-ratio: 1.05 / 1;
}
@keyframes logo-spin {
  from { filter: hue-rotate(0deg) saturate(1.2) brightness(1.1); }
  to   { filter: hue-rotate(360deg) saturate(1.2) brightness(1.1); }
}
@keyframes logo-in {
  from { opacity: 0; transform: scale(.92); }
  to   { opacity: 1; transform: scale(1); }
}

.lab-badge {
  display: inline-block;
  padding: 7px 18px;
  background: rgba(255, 255, 255, .14);
  border: 1px solid rgba(255, 255, 255, .35);
  border-radius: 999px;
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 14px;
  letter-spacing: .3em;
  text-transform: uppercase;
  color: #ffffff;
  backdrop-filter: blur(4px);
  font-weight: 600;
}
.lab-badge .letter {
  display: inline-block;
  opacity: 0;
  animation: letter-in .5s cubic-bezier(.2, .8, .2, 1) forwards;
}
@keyframes letter-in { to { opacity: 1; transform: translateY(0); } }

.sub {
  position: relative;
  z-index: 2;
  margin-top: 36px;
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .25em;
  color: rgba(255, 255, 255, .85);
  opacity: 0;
  animation: fade-in 1s 2.4s forwards;
}
@keyframes fade-in { to { opacity: 1; } }

.loader {
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  width: 220px;
  height: 3px;
  background: rgba(255, 255, 255, .2);
  border-radius: 999px;
  overflow: hidden;
}
.loader-bar {
  display: block;
  height: 100%;
  width: 0;
  background: linear-gradient(90deg, #ff6b1a, #ff00aa, #00d9ff, #00ff88, #ffd400);
  animation: loader 5s linear forwards;
}
@keyframes loader { to { width: 100%; } }

/* STEP CARDS (persona + auth) */
.step-card {
  position: relative;
  z-index: 2;
  width: min(560px, 100%);
  background: rgba(15, 15, 15, .92);
  border: 1px solid rgba(255, 255, 255, .25);
  border-radius: 20px;
  padding: 36px;
  backdrop-filter: blur(24px);
  animation: card-in .6s cubic-bezier(.2, .8, .2, 1);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
}
@keyframes card-in {
  from { opacity: 0; transform: translateY(20px) scale(.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.step-eyebrow {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .2em;
  color: rgba(255, 255, 255, .7);
  margin-bottom: 16px;
}
.step-title {
  font-family: "Inter", -apple-system, system-ui, sans-serif;
  font-style: italic;
  font-weight: 700;
  font-size: 28px;
  letter-spacing: -.02em;
  line-height: 1.15;
  margin: 0 0 14px;
  color: #ffffff;
}
.step-lead {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, .85);
  margin: 0 0 24px;
}

.step-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
}

/* PERSONA STEP */
.persona-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
}
.persona-card {
  text-align: left;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, .2);
  background: rgba(255, 255, 255, .04);
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: background .15s, border-color .15s, transform .15s;
}
.persona-card:hover {
  border-color: rgba(255, 255, 255, .55);
  background: rgba(255, 255, 255, .08);
  transform: translateY(-2px);
}
.persona-card.active {
  background: #ffffff;
  color: #0a0a0a;
  border-color: #ffffff;
}
.p-name {
  font-family: "Inter", -apple-system, system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -.005em;
}
.p-desc {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 9px;
  letter-spacing: .04em;
  color: rgba(255, 255, 255, .7);
  line-height: 1.4;
}
.persona-card.active .p-desc { color: rgba(10, 10, 10, .65); }

/* AUTH STEP */
.auth-logo-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}
.auth-eyebrow {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .3em;
  color: #ffffff;
  padding: 5px 14px;
  border: 1px solid rgba(255, 255, 255, .35);
  border-radius: 999px;
  background: rgba(255, 255, 255, .08);
}
.auth-tabs {
  display: flex;
  border: 1px solid rgba(255, 255, 255, .25);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 18px;
}
.auth-tabs button {
  flex: 1;
  padding: 10px 0;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, .7);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .12em;
  cursor: pointer;
  transition: background .15s, color .15s;
}
.auth-tabs button.active {
  background: #ffffff;
  color: #0a0a0a;
  font-weight: 600;
}
form { display: flex; flex-direction: column; gap: 14px; }
label { display: flex; flex-direction: column; gap: 5px; }
label span {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: rgba(255, 255, 255, .8);
}
input {
  border: 1px solid rgba(255, 255, 255, .25);
  background: rgba(0, 0, 0, .4);
  color: #ffffff;
  padding: 12px 14px;
  border-radius: 8px;
  font-family: "Inter", -apple-system, system-ui, sans-serif;
  font-size: 14px;
}
input:focus { outline: none; border-color: #ffffff; }
.err {
  margin: 0;
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 11px;
  color: #ff8888;
  letter-spacing: .04em;
}

/* SHARED BUTTONS */
.primary {
  padding: 13px 20px;
  border: 1px solid #ffffff;
  background: #ffffff;
  color: #0a0a0a;
  border-radius: 10px;
  font-family: "Inter", -apple-system, system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity .15s;
}
.primary:hover { opacity: .9; }
.primary:disabled { opacity: .4; cursor: not-allowed; }

.link-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, .8);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .12em;
  cursor: pointer;
  padding: 10px 0;
  transition: color .15s;
  margin-top: 14px;
  text-align: center;
  display: block;
  width: 100%;
}
.link-btn:hover { color: #ffffff; text-decoration: underline; }

@media (max-width: 480px) {
  .step-card { padding: 24px; }
  .step-title { font-size: 22px; }
  .logo-mask.small { width: 80px; }
  .persona-grid { grid-template-columns: 1fr 1fr; }
}
</style>
