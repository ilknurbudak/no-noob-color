<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import { requestPasswordReset, requestVerification } from "@/services/api";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const auth = useAuthStore();
const toast = useToastStore();

const mode = ref<"login" | "signup" | "forgot">("login");
const email = ref("");
const password = ref("");
const emailInput = ref<HTMLInputElement | null>(null);
const busy = ref(false);

watch(() => props.open, async (o) => {
  if (o) {
    email.value = ""; password.value = ""; auth.error = null;
    await nextTick();
    emailInput.value?.focus();
  }
});

function onEsc(e: KeyboardEvent) {
  if (e.key === "Escape" && props.open) emit("close");
}
onMounted(() => window.addEventListener("keydown", onEsc));
onUnmounted(() => window.removeEventListener("keydown", onEsc));

async function submit() {
  if (mode.value === "forgot") {
    busy.value = true;
    try {
      await requestPasswordReset(email.value);
      toast.show("Reset link sent — check inbox");
      mode.value = "login";
    } catch (e: any) {
      auth.error = e.message || "reset failed";
    } finally {
      busy.value = false;
    }
    return;
  }
  try {
    if (mode.value === "login") await auth.login(email.value, password.value);
    else await auth.signup(email.value, password.value);
    toast.show(mode.value === "login" ? "Welcome back" : "Account created");
    if (mode.value === "signup") {
      try { await requestVerification(email.value); } catch {}
    }
    emit("close");
  } catch { /* error already in auth.error */ }
}
</script>

<template>
  <div v-if="open" class="auth-overlay" @click.self="emit('close')">
    <div class="auth-card">
      <div class="auth-tabs" v-if="mode !== 'forgot'">
        <button :class="{ active: mode === 'login' }" @click="mode = 'login'">Sign in</button>
        <button :class="{ active: mode === 'signup' }" @click="mode = 'signup'">Create account</button>
      </div>
      <div class="auth-tabs forgot-head" v-else>
        <span>Reset password</span>
      </div>
      <form @submit.prevent="submit">
        <label>
          <span>Email</span>
          <input ref="emailInput" v-model="email" type="email" autocomplete="email" required />
        </label>
        <label v-if="mode !== 'forgot'">
          <span>Password</span>
          <input v-model="password" type="password" autocomplete="current-password" minlength="8" required />
        </label>
        <p v-if="auth.error" class="err">{{ auth.error }}</p>
        <button type="submit" class="primary" :disabled="auth.loading || busy">
          <template v-if="auth.loading || busy">…</template>
          <template v-else-if="mode === 'login'">Sign in</template>
          <template v-else-if="mode === 'signup'">Create account</template>
          <template v-else>Send reset link</template>
        </button>
        <div class="auth-links">
          <button v-if="mode === 'login'" type="button" class="link" @click="mode = 'forgot'; auth.error = null">forgot password?</button>
          <button v-if="mode === 'forgot'" type="button" class="link" @click="mode = 'login'; auth.error = null">back to sign in</button>
          <button type="button" class="ghost" @click="emit('close')">Cancel</button>
        </div>
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
.auth-tabs.forgot-head {
  padding: 9px 12px;
  background: var(--surface-2);
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--text);
  text-align: center;
  display: block;
}
.auth-links {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  flex-wrap: wrap;
}
.auth-links .link {
  background: none;
  border: none;
  color: var(--text-2);
  font-family: var(--mono);
  font-size: 10px;
  cursor: pointer;
  text-decoration: underline;
  letter-spacing: .04em;
  padding: 4px 0;
}
.auth-links .link:hover { color: var(--text); }
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
