<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  accept?: string;
  imageSrc?: string | null;
}>();

const emit = defineEmits<{ (e: "file", file: File): void }>();

const dragover = ref(false);
const dropped = ref(false);
const inputEl = ref<HTMLInputElement | null>(null);

function onDrop(e: DragEvent) {
  e.preventDefault();
  dragover.value = false;
  const f = e.dataTransfer?.files?.[0];
  if (f) emitFile(f);
}
function onChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (f) emitFile(f);
}
function emitFile(file: File) {
  dropped.value = false;
  // re-trigger animation
  requestAnimationFrame(() => { dropped.value = true; });
  setTimeout(() => { dropped.value = false; }, 720);
  emit("file", file);
}
</script>

<template>
  <label
    class="source-strip"
    :class="{ 'has-image': !!imageSrc, dragover, dropped }"
    @dragenter.prevent="dragover = true"
    @dragover.prevent="dragover = true"
    @dragleave.prevent="dragover = false"
    @drop="onDrop"
  >
    <img v-if="imageSrc" :src="imageSrc" alt="" />
    <div v-else class="source-prompt">
      <img class="drop-icon" src="/drop-arrow.png" alt="" aria-hidden="true" />
      drop a photo
      <div class="small">or click anywhere</div>
    </div>
    <input ref="inputEl" type="file" :accept="accept ?? 'image/*'" @change="onChange" />
  </label>
</template>

<style scoped>
.source-strip {
  width: 100%;
  height: 340px;
  border: 1.5px dashed var(--hairline);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  background: var(--bg);
  transition: border-color .2s, background .2s, transform .2s, box-shadow .25s;
}
.source-strip:hover:not(.has-image):not(.dragover) {
  background: var(--surface-hover);
}
.source-strip.has-image {
  border-style: solid;
  border-width: 1px;
  border-color: var(--hairline);
  cursor: default;
  height: 220px;
}
.source-strip.dragover {
  border-color: var(--text);
  border-width: 2px;
  background: var(--surface-hover);
  transform: scale(1.012);
  box-shadow: 0 14px 44px rgba(0, 0, 0, .14);
}
.source-strip.dropped {
  animation: dropReceived .7s cubic-bezier(.2, .8, .2, 1);
}
@keyframes dropReceived {
  0%   { transform: scale(1); }
  20%  { transform: scale(.985); }
  55%  { transform: scale(1.018); }
  100% { transform: scale(1); }
}
.source-strip img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
  animation: imgFadeIn .55s ease;
}
@keyframes imgFadeIn {
  from { opacity: 0; transform: scale(1.025); }
  to   { opacity: 1; transform: scale(1); }
}
.source-strip input[type=file] {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
.source-prompt {
  text-align: center;
  color: var(--text);
  font-family: var(--sans);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -.02em;
  line-height: 1.1;
  pointer-events: none;
  transition: opacity .15s, transform .15s;
}
.source-strip.dragover .source-prompt {
  opacity: .6;
  transform: scale(.96);
}
.source-prompt .small {
  display: block;
  font-size: 10px;
  margin-top: 18px;
  color: var(--text-3);
  font-family: var(--mono);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: .12em;
}
.drop-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 22px;
  display: block;
  object-fit: contain;
  animation: dropBounce 2.4s ease-in-out infinite;
  user-select: none;
  -webkit-user-drag: none;
}
:global([data-theme="dark"]) .drop-icon { filter: invert(1); }
.source-strip.dragover .drop-icon { animation-duration: .7s; }
@keyframes dropBounce {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}
</style>
