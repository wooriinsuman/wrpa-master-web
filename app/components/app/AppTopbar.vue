<script setup lang="ts">
import { computed } from 'vue'

defineProps<{
  title: string
  desc?: string
}>()

const { dark, toggle } = useTheme()
const themeLabel = computed(() => dark.value ? '☀ 라이트' : '☾ 다크')
</script>

<template>
  <header class="topbar">
    <div class="topbar-heading">
      <div class="topbar-title">{{ title }}</div>
      <div v-if="desc" class="topbar-desc">{{ desc }}</div>
    </div>

    <div class="topbar-actions">
      <!-- Vitals slot — wired in Plan 03 with real data -->
      <slot name="vitals" />

      <button class="theme-btn" @click="toggle">{{ themeLabel }}</button>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 35;
  background: var(--panel);
  border-bottom: 1px solid var(--line);
  padding: 13px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  box-shadow: 0 6px 20px rgba(16, 24, 40, 0.05);
}

.topbar-heading {
  min-width: 0;
}

.topbar-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 18px;
  color: var(--ink);
}

.topbar-desc {
  font-size: 12px;
  color: var(--ink-2);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-left: auto;
}

.theme-btn {
  padding: 7px 12px;
  border-radius: 9px;
  border: 1px solid var(--line);
  background: var(--th);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 12px;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.theme-btn:hover {
  transform: translateY(-1px);
}
</style>
