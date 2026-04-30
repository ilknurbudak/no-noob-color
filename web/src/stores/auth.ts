import { defineStore } from "pinia";
import { computed, ref } from "vue";
import * as api from "@/services/api";

export interface AuthUser {
  id: string;
  email: string;
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref<AuthUser | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthed = computed(() => !!user.value && !!api.getToken());

  async function refresh() {
    if (!api.getToken()) { user.value = null; return; }
    try {
      const data = await api.me();
      const u = data.user;
      user.value = u ? { id: u.id, email: u.email } : null;
    } catch {
      api.logout();
      user.value = null;
    }
  }

  async function login(email: string, password: string) {
    loading.value = true; error.value = null;
    try {
      const res = await api.login(email, password);
      user.value = { id: res.user.id, email: res.user.email };
    } catch (e: any) {
      error.value = e.message || "login failed";
      throw e;
    } finally { loading.value = false; }
  }

  async function signup(email: string, password: string) {
    loading.value = true; error.value = null;
    try {
      const res = await api.signup(email, password);
      user.value = { id: res.user.id, email: res.user.email };
    } catch (e: any) {
      error.value = e.message || "signup failed";
      throw e;
    } finally { loading.value = false; }
  }

  function logout() {
    api.logout();
    user.value = null;
  }

  return { user, loading, error, isAuthed, refresh, login, signup, logout };
});
