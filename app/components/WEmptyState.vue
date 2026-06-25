<!-- app/components/WEmptyState.vue -->
<script setup lang="ts">
defineProps<{ title: string; message: string; ctaLabel?: string }>()
defineEmits<{ cta: [] }>()
</script>
<template>
  <div class="empty">
    <div class="empty-mark">0</div>
    <div class="empty-title">{{ title }}</div>
    <div class="empty-msg">{{ message }}</div>
    <button v-if="ctaLabel" class="empty-cta" @click="$emit('cta')">{{ ctaLabel }}</button>
  </div>
</template>
<style scoped>
.empty { padding: 60px 24px; text-align: center; }
.empty-mark { width: 48px; height: 48px; border-radius: 12px; background: var(--th); border: 1px solid var(--line); display: inline-flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: 18px; color: var(--ink-2); margin-bottom: 14px; box-shadow: inset 0 1px 0 rgba(255,255,255,.6); }
.empty-title { font-family: var(--font-display); font-size: 16px; font-weight: 700; color: var(--ink); margin-bottom: 6px; }
.empty-msg { font-size: 13px; color: var(--ink-2); margin-bottom: 16px; }
.empty-cta { padding: 9px 16px; border-radius: 9px; border: none; background: var(--run); color: var(--on-accent); font-family: var(--font-sans); font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px var(--run-shadow); }
</style>
