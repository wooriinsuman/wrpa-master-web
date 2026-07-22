<!-- app/components/WPageHeader.vue -->
<script setup lang="ts">
import { computed, useAttrs } from 'vue'
// addLabel omitted → no add button (e.g. workers self-register, no manual create).
defineProps<{ title: string; desc?: string; search?: string; addLabel?: string }>()
defineEmits<{ add: []; 'update:search': [v: string] }>()
// The refresh (조회) button appears only when the parent wires an @refresh
// handler — it re-queries the list from the server so users don't have to
// reload the whole page. Detected via $attrs so no extra prop is needed.
const attrs = useAttrs()
const canRefresh = computed(() => typeof attrs.onRefresh === 'function')
function onRefresh() { (attrs.onRefresh as (() => void))() }
</script>
<template>
  <div class="ph">
    <div>
      <div class="ph-title">{{ title }}</div>
      <div v-if="desc" class="ph-desc">{{ desc }}</div>
    </div>
    <div class="ph-actions">
      <slot name="header-actions" />
      <input class="ph-search" :value="search" placeholder="검색…"
        @input="$emit('update:search', ($event.target as HTMLInputElement).value)" />
      <WButton v-if="canRefresh" variant="ghost" title="목록 다시 조회" aria-label="다시 조회" @click="onRefresh">
        <template #leading>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.6-6.36" /><path d="M21 3v6h-6" /></svg>
        </template>
        조회
      </WButton>
      <button v-if="addLabel" class="add" @click="$emit('add')">{{ addLabel }}</button>
    </div>
  </div>
</template>
<style scoped>
.ph { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 16px 18px; border-bottom: 1px solid var(--line); }
.ph-title { font-family: var(--font-display); font-size: 15px; font-weight: 700; color: var(--ink); }
.ph-desc { font-size: 12px; color: var(--ink-2); margin-top: 2px; }
.ph-actions { display: flex; gap: 10px; align-items: center; }
.ph-search { padding: 8px 12px; border: 1px solid var(--line); border-radius: 9px; font-family: var(--font-mono); font-size: 12.5px; width: 170px; max-width: 42vw; background: var(--th); color: var(--ink); }
.add { padding: 8px 14px; border-radius: 9px; border: none; background: var(--run); color: var(--on-accent); font-family: var(--font-sans); font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; box-shadow: 0 2px 8px var(--run-shadow), inset 0 1px 0 rgba(255,255,255,.2); transition: transform .15s ease; }
.add:hover { transform: translateY(-1px); }
</style>
