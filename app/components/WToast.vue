<!-- app/components/WToast.vue -->
<script setup lang="ts">
const { toasts } = useToast()
</script>
<template>
  <div class="toast-region" role="status" aria-live="polite">
    <div v-for="t in toasts" :key="t.id" class="toast">{{ t.msg }}</div>
  </div>
</template>
<style scoped>
.toast-region { position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%); z-index: 95; display: flex; flex-direction: column; gap: 8px; align-items: center; }
.toast { background: var(--ink); color: var(--on-accent); padding: 10px 18px; border-radius: 10px; font-size: 13px; font-family: var(--font-sans); box-shadow: 0 12px 32px rgba(16,24,40,.32), inset 0 1px 0 rgba(255,255,255,.12); }
@media (prefers-reduced-motion: no-preference) { .toast { animation: toastRise .25s ease both; } }
@keyframes toastRise { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
</style>
