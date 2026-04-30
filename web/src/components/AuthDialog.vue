<script setup lang="ts">
import { ref, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const auth = useAuthStore();
const toast = useToastStore();

const mode = ref<"login" | "signup">("login");
const email = ref("");
const password = ref("");

watch(() => props.open, (o) => {
  if (o) { email.value = ""; password.value = ""; auth.error = null; }
});

async function submit() {
  try {
    if (mode.value === "login") await auth.login(email.value, password.value);
    else await auth.signup(email.value, password.value);
    toast.show(mode.value === "login" ? "Welcome back" : "Account created");
    emit("close");
  } catch { /* error already in auth.error */ }
}
</script>

<template>
  <div v-if="open" class="auth-overlay" @click.self="emit('close')">
    <div class="auth-card">
      <div class="auth-tabs">
        <button :class="{ active: mode === 'login' }" @click="mode = 'login'">Sign in</button>
        <button :class="{ active: mode === 'signup' }" @click="mode = 'signup'">Create account</button>
      </div>
      <form @submit.prevent="submit">
        <label>
          <span>Email</span>
          <input v-model="email" type="email" autocomplete="email" required />
        </label>
        <label>
          <span>Password</span>
          <input v-model="password" type="password" autocomplete="current-password" minlength="8" required />
        </label>
        <p v-if="auth.error" class="err">{{ auth.error }}</p>
        <button type="submit" class="primary" :disabled="auth.loading">
          {{ auth.loading ? "…" : (mode === "login" ? "Sign in" : "Create account") }}
        </button>
        <button type="button" class="ghost" @click="emit('close')">Cancel</button>
      </form>
      <p class="hint">Stored on your PocketBase instance. No tracking.</p>
    </div>
  </div>
</template>

<style scoped>
.auth-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, .35);
  display: flex; align-items: center; justify-content: center;
  z-index: 200;
  backdrop-filter: blur(2px);
}
.auth-card {
  width: min(380px, 92vw);
  background: var(--bg);
  border: 1px solid var(--text);
  border-radius: 14px;
  padding: var(--s-5);
  box-shadow: 0 20px 60px rgba(0, 0, 0, .25);
}
.auth-tabs {
  display: flex;
  border: 1px solid var(--hairline);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: var(--s-4);
}
.auth-tabs button {
  flex: 1;
  padding: 9px 0;
  background: var(--bg);
  border: none;
  color: var(--text-2);
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .1em;
  cursor: pointer;
}
.auth-tabs button.active { background: var(--text); color: var(--bg); }
form { display: flex; flex-direction: column; gap: var(--s-3); }
label { display: flex; flex-direction: column; gap: 4px; }
label span {
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--text-3);
}
input {
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text);
  padding: 9px 11px;
  border-radius: 8px;
  font-family: var(--sans);
  font-size: 13px;
}
input:focus { outline: none; border-color: var(--text); }
.err {
  margin: 0;
  font-family: var(--mono);
  font-size: 10px;
  color: #c00;
  letter-spacing: .04em;
}
button.primary {
  margin-top: var(--s-2);
  padding: 10px 14px;
  border: 1px solid var(--text);
  background: var(--text);
  color: var(--bg);
  border-radius: 8px;
  font-family: var(--sans);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
button.primary:disabled { opacity: .5; cursor: not-allowed; }
button.ghost {
  padding: 8px 14px;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text-2);
  border-radius: 8px;
  font-family: var(--sans);
  font-size: 11px;
  cursor: pointer;
}
.hint {
  margin: var(--s-4) 0 0;
  font-family: var(--mono);
  font-size: 9px;
  color: var(--text-3);
  text-align: center;
  letter-spacing: .08em;
}
</style>
