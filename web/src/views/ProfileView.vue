<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useLibraryStore } from "@/stores/library";
import { useTasteStore } from "@/stores/taste";
import { usePersonaStore } from "@/stores/persona";
import { useToastStore } from "@/stores/toast";
import { requestVerification } from "@/services/api";

const router = useRouter();
const auth = useAuthStore();
const lib = useLibraryStore();
const taste = useTasteStore();
const persona = usePersonaStore();
const toast = useToastStore();

const verifyBusy = ref(false);

const created = computed(() => {
  const c = (auth.user as any)?.created;
  if (!c) return null;
  return new Date(c).toISOString().slice(0, 10);
});

const verified = computed(() => Boolean((auth.user as any)?.verified));

async function resendVerification() {
  if (!auth.user) return;
  verifyBusy.value = true;
  try {
    await requestVerification(auth.user.email);
    toast.show("Verification link sent");
  } catch (e: any) {
    toast.show(e.message || "Failed");
  } finally {
    verifyBusy.value = false;
  }
}

function logout() {
  auth.logout();
  router.push("/");
}
</script>

<template>
  <section class="profile" v-if="auth.isAuthed">
    <header class="head">
      <span class="eyebrow">Profile</span>
      <h1>{{ auth.user?.email.split("@")[0] }}</h1>
      <p class="email">{{ auth.user?.email }}</p>
    </header>

    <div class="grid">
      <div class="card">
        <span class="card-label">Account</span>
        <dl>
          <dt>email</dt><dd>{{ auth.user?.email }}</dd>
          <dt>verified</dt>
          <dd>
            <span class="badge" :class="{ ok: verified, warn: !verified }">
              {{ verified ? "yes" : "no" }}
            </span>
            <button v-if="!verified" class="link-btn" @click="resendVerification" :disabled="verifyBusy">
              {{ verifyBusy ? "sending…" : "resend" }}
            </button>
          </dd>
          <dt v-if="created">created</dt>
          <dd v-if="created">{{ created }}</dd>
        </dl>
      </div>

      <div class="card">
        <span class="card-label">Stats</span>
        <dl>
          <dt>palettes</dt><dd>{{ lib.items.length }}</dd>
          <dt>starred</dt><dd>{{ lib.stars.size }}</dd>
          <dt>folders</dt><dd>{{ lib.folders.length }}</dd>
          <dt>tags</dt><dd>{{ lib.allTags.length }}</dd>
          <dt>liked colors</dt><dd>{{ taste.liked.length }}</dd>
          <dt>taste sessions</dt><dd>{{ taste.state.count }}</dd>
        </dl>
      </div>

      <div class="card">
        <span class="card-label">Preferences</span>
        <dl>
          <dt>active persona</dt>
          <dd>
            <span v-if="persona.active">{{ persona.active.name }}</span>
            <span v-else class="muted">none</span>
          </dd>
          <dt>training today</dt>
          <dd>
            <span class="badge" :class="{ ok: taste.trainedToday }">
              {{ taste.trainedToday ? "yes" : "not yet" }}
            </span>
          </dd>
        </dl>
      </div>

      <div class="card danger">
        <span class="card-label">Sign out</span>
        <p>This will keep your library on this device but disconnect from cloud sync.</p>
        <button class="logout-btn" @click="logout">Sign out</button>
      </div>
    </div>
  </section>

  <section v-else class="profile empty">
    <p>Sign in to see your profile.</p>
    <button class="logout-btn" @click="router.push('/')">Home</button>
  </section>
</template>

<style scoped>
.profile { max-width: 720px; margin: 0 auto; padding-bottom: var(--s-7); }
.head { margin-bottom: var(--s-6); }
.eyebrow {
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: var(--text-3);
}
.head h1 {
  font-family: var(--sans);
  font-style: italic;
  font-weight: 800;
  font-size: 38px;
  letter-spacing: -.02em;
  margin: var(--s-3) 0 4px;
}
.email {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-3);
  margin: 0;
  letter-spacing: .04em;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--s-3);
}
.card {
  border: 1px solid var(--hairline);
  border-radius: 12px;
  padding: var(--s-4);
}
.card.danger { border-color: rgba(192,0,0,.25); background: rgba(192,0,0,.02); }
.card-label {
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: var(--text-3);
  display: block;
  margin-bottom: var(--s-3);
}
.card dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 8px var(--s-3);
  margin: 0;
  font-family: var(--mono);
  font-size: 11px;
}
.card dt {
  color: var(--text-3);
  text-transform: uppercase;
  font-size: 9px;
  letter-spacing: .08em;
  align-self: center;
}
.card dd {
  color: var(--text);
  margin: 0;
  display: flex;
  gap: 8px;
  align-items: center;
}
.card dd .muted { color: var(--text-3); }
.card.danger p {
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-2);
  margin: 0 0 var(--s-3);
}
.badge {
  font-family: var(--mono);
  font-size: 9px;
  padding: 2px 7px;
  border-radius: 999px;
  letter-spacing: .04em;
  text-transform: uppercase;
}
.badge.ok { background: rgba(42,138,42,.12); color: #2a8a2a; }
.badge.warn { background: rgba(220,150,0,.12); color: #b97500; }
.link-btn {
  background: none;
  border: none;
  color: var(--text-2);
  font-family: var(--mono);
  font-size: 9px;
  text-decoration: underline;
  cursor: pointer;
  letter-spacing: .04em;
}
.link-btn:hover { color: var(--text); }
.link-btn:disabled { opacity: .5; cursor: not-allowed; }
.logout-btn {
  padding: 8px 14px;
  border: 1px solid #c00;
  background: var(--bg);
  color: #c00;
  border-radius: 8px;
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .08em;
  cursor: pointer;
}
.logout-btn:hover { background: #c00; color: white; }
.empty { text-align: center; padding: 100px 20px; }
.empty p {
  font-size: 14px;
  color: var(--text-2);
  margin-bottom: var(--s-4);
}
</style>
