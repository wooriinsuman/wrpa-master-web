<!-- app/components/WToast.vue -->
<script setup lang="ts">
const { toasts } = useToast()
</script>
<template>
  <div class="toast-region" role="status" aria-live="polite">
    <div v-for="t in toasts" :key="t.id" class="toast" :class="`toast--${t.kind}`">{{ t.msg }}</div>
  </div>
</template>
<style scoped>
.toast-region { position: fixed; left: 0; right: 0; top: 28px; z-index: 95; display: flex; flex-direction: column; gap: 8px; align-items: center; }
.toast { color: var(--on-accent); padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; font-family: var(--font-sans); box-shadow: 0 12px 32px rgba(16,24,40,.32), inset 0 1px 0 rgba(255,255,255,.12); }
/* 성공=초록 · info=검정(기본) · 에러=빨강 */
.toast--success { background: var(--done); }
.toast--info { background: var(--ink); }
.toast--error { background: var(--fail); }
@media (prefers-reduced-motion: no-preference) { .toast { animation: toastDrop .25s ease both; } }
@keyframes toastDrop { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
</style>
