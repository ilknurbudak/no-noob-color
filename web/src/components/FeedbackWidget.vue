<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from "vue";
import { useToastStore } from "@/stores/toast";

const open = ref(false);
const message = ref("");
const sentiment = ref<"love" | "bug" | "idea" | "other">("idea");
const email = ref("");
const busy = ref(false);
const textarea = ref<HTMLTextAreaElement | null>(null);
const toast = useToastStore();

const SENTIMENTS: { id: typeof sentiment.value; label: string; emoji: string }[] = [
  { id: "love", label: "love", emoji: "♥" },
  { id: "bug", label: "bug", emoji: "✕" },
  { id: "idea", label: "idea", emoji: "✦" },
  { id: "other", label: "other", emoji: "·" },
];

watch(open, async (o) => {
  if (o) {
    await nextTick();
    textarea.value?.focus();
  }
});

function onEsc(e: KeyboardEvent) {
  if (e.key === "Escape" && open.value) open.value = false;
}
onMounted(() => window.addEventListener("keydown", onEsc));
onUnmounted(() => window.removeEventListener("keydown", onEsc));

async function send() {
  if (!message.value.trim()) return;
  busy.value = true;
  try {
    // No backend collection yet — log locally + open mailto fallback.
    // When PocketBase 'feedback' collection exists, replace this with
    // a POST to /palettes-style endpoint.
    const log = JSON.parse(localStorage.getItem("nnc_feedback_log") || "[]");
    log.unshift({
      ts: Date.now(),
      sentiment: sentiment.value,
      message: message.value.trim(),
      email: email.value.trim() || null,
      url: window.location.href,
      ua: navigator.userAgent.slice(0, 120),
    });
    localStorage.setItem("nnc_feedback_log", JSON.stringify(log.slice(0, 100)));

    // Mailto fallback so the user can also send if they want
    const subject = `[no noob color · ${sentiment.value}] feedback`;
    const body = `${message.value.trim()}\n\n— sent from ${window.location.href}`;
    const mailto = `mailto:hello@nonoob.color?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    toast.show("Thanks — saved locally");
    message.value = "";
    email.value = "";
    open.value = false;

    // Optional: open mail client in new tab
    setTimeout(() => { window.open(mailto, "_blank"); }, 100);
  } catch (e: any) {
    toast.show(e.message || "Failed");
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <button
    class="fb-trigger"
    :class="{ open }"
    @click="open = !open"
    :aria-label="open ? 'Close feedback' : 'Open feedback'"
    title="Share feedback"
  >
    <span v-if="!open">feedback</span>
    <span v-else>×</span>
  </button>

  <div v-if="open" class="fb-card">
    <div class="fb-head">
      <span class="fb-eyebrow">Send feedback</span>
      <p>What's on your mind?</p>
    </div>

    <div class="sentiments">
      <button
        v-for="s in SENTIMENTS" :key="s.id"
        class="s-chip"
        :class="{ active: sentiment === s.id }"
        @click="sentiment = s.id"
      >
        <span class="emoji">{{ s.emoji }}</span> {{ s.label }}
      </button>
    </div>

    <textarea
      ref="textarea"
      v-model="message"
      placeholder="describe what you saw / wanted / wished for"
      rows="4"
      maxlength="800"
    ></textarea>

    <input
      v-model="email"
      type="email"
      placeholder="email (optional · only if you want a reply)"
    />

    <div class="actions">
      <span class="char-count">{{ message.length }} / 800</span>
      <button class="cancel" @click="open = false">cancel</button>
      <button class="send" :disabled="busy || !message.trim()" @click="send">
        {{ busy ? "…" : "send" }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.fb-trigger {
  position: fixed;
  bottom: 80px;
  right: 16px;
  z-index: 150;
  padding: 9px 14px;
  border: 1px solid var(--text);
  background: var(--text);
  color: var(--bg);
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .1em;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(0, 0, 0, .12);
  transition: transform .15s, padding .15s;
}
.fb-trigger:hover { transform: translateY(-2px); }
.fb-trigger.open {
  width: 38px; height: 38px; padding: 0;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fb-card {
  position: fixed;
  bottom: 130px;
  right: 16px;
  z-index: 151;
  width: 320px;
  max-width: calc(100vw - 32px);
  background: var(--bg);
  border: 1px solid var(--text);
  border-radius: 14px;
  padding: var(--s-4);
  box-shadow: 0 14px 50px rgba(0, 0, 0, .2);
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
}
.fb-head { display: flex; flex-direction: column; gap: 4px; }
.fb-eyebrow {
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: var(--text-3);
}
.fb-head p {
  font-family: var(--sans);
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  margin: 0;
}

.sentiments { display: flex; gap: 4px; flex-wrap: wrap; }
.s-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text-2);
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 10px;
  text-transform: lowercase;
  cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
}
.s-chip:hover { color: var(--text); border-color: var(--text); }
.s-chip.active { background: var(--text); color: var(--bg); border-color: var(--text); }
.s-chip .emoji { font-size: 11px; }

textarea, input {
  width: 100%;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text);
  padding: 8px 10px;
  border-radius: 8px;
  font-family: var(--sans);
  font-size: 12px;
  resize: vertical;
}
textarea { min-height: 80px; line-height: 1.5; }
textarea:focus, input:focus { outline: none; border-color: var(--text); }

.actions {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 4px;
}
.char-count {
  flex: 1;
  font-family: var(--mono);
  font-size: 9px;
  color: var(--text-3);
  letter-spacing: .04em;
}
.cancel, .send {
  padding: 7px 13px;
  border: 1px solid var(--hairline);
  border-radius: 8px;
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .06em;
  cursor: pointer;
}
.cancel { background: var(--bg); color: var(--text-2); }
.cancel:hover { color: var(--text); border-color: var(--text); }
.send {
  background: var(--text);
  color: var(--bg);
  border-color: var(--text);
}
.send:disabled { opacity: .5; cursor: not-allowed; }

@media (max-width: 480px) {
  .fb-trigger { bottom: 90px; }
  .fb-card { bottom: 140px; right: 8px; }
}
</style>
