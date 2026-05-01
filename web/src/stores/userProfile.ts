// User profile metadata that lives alongside auth — stored locally,
// synced to PocketBase users collection in v2. Used by AI prompts.
import { defineStore } from "pinia";
import { ref, watch } from "vue";

const KEY = "nnc_user_profile_v1";

interface ProfileData {
  niche: string;        // 'editorial illustration · indie books'
  bio: string;          // free-form
  aiNote: string;       // pinned context fed to AI prompts
  city: string;
  website: string;
}

function blank(): ProfileData {
  return { niche: "", bio: "", aiNote: "", city: "", website: "" };
}

function load(): ProfileData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...blank(), ...JSON.parse(raw) };
  } catch {}
  return blank();
}

function persist(p: ProfileData) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

export const useUserProfileStore = defineStore("userProfile", () => {
  const data = ref<ProfileData>(load());

  watch(data, (v) => persist(v), { deep: true });

  function update(patch: Partial<ProfileData>) {
    data.value = { ...data.value, ...patch };
  }

  function reset() {
    data.value = blank();
  }

  return { data, update, reset };
});
