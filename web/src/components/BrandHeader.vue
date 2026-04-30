<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useThemeStore } from "@/stores/theme";
import { useAuthStore } from "@/stores/auth";
import AuthDialog from "@/components/AuthDialog.vue";

const router = useRouter();
const theme = useThemeStore();
const auth = useAuthStore();
const showAuth = ref(false);

function goHome() {
  router.push("/");
}

function toggleTheme() {
  theme.toggle();
}
</script>

<template>
  <header class="brand-header">
    <img
      class="brand-lockup"
      src="/logo-lockup.png"
      alt="no noob color · capture · curate · export"
      @click="goHome"
    />
    <div class="header-controls">
      <button v-if="auth.isAuthed" class="user-pill" @click="auth.logout" :title="`Sign out · ${auth.user?.email}`">
        <span class="dot"></span>
        {{ auth.user?.email.split("@")[0] }}
      </button>
      <button v-else class="user-pill ghost" @click="showAuth = true">Sign in</button>
      <button class="theme-toggle" :class="{ dark: theme.mode === 'dark' }" @click="toggleTheme" aria-label="Toggle theme">
        <span class="thumb"></span>
      </button>
    </div>
    <AuthDialog :open="showAuth" @close="showAuth = false" />
  </header>
</template>

<style scoped>
.brand-header {
  text-align: center;
  padding: var(--s-5) 0 var(--s-4);
  margin-bottom: var(--s-6);
  border-bottom: 1px solid var(--hairline);
  position: relative;
}
.brand-lockup {
  display: block;
  height: 200px;
  width: auto;
  max-width: 100%;
  margin: 0 auto;
  object-fit: contain;
  user-select: none;
  cursor: pointer;
  transition: opacity .15s;
}
.brand-lockup:hover { opacity: .72; }
:global([data-theme="dark"]) .brand-lockup { filter: invert(1); }
.header-controls {
  position: absolute;
  bottom: var(--s-4);
  right: 0;
  display: flex;
  align-items: center;
  gap: var(--s-3);
  z-index: 10;
}
.theme-toggle {
  width: 52px;
  height: 28px;
  border: 1px solid var(--text);
  border-radius: 999px;
  background: var(--bg);
  position: relative;
  cursor: pointer;
  padding: 0;
}
.thumb {
  position: absolute;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--text);
  top: 2px;
  left: 2px;
  transition: transform .25s cubic-bezier(.45, 0, .25, 1);
}
.theme-toggle.dark .thumb { transform: translateX(22px); }

.user-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--text);
  background: var(--text);
  color: var(--bg);
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 500;
  text-transform: lowercase;
  letter-spacing: .04em;
  cursor: pointer;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-pill .dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--bg);
  display: inline-block;
}
.user-pill.ghost {
  background: var(--bg);
  color: var(--text);
}

@media (max-width: 720px) {
  .brand-lockup { height: 160px; }
  .brand-header { padding: var(--s-4) 0 var(--s-3); margin-bottom: var(--s-5); }
}
@media (max-width: 480px) {
  .brand-lockup { height: 130px; }
  .brand-header { padding: var(--s-3) 0 var(--s-2); margin-bottom: var(--s-4); }
  .header-controls { position: static; justify-content: center; margin-top: var(--s-3); }
}
</style>
