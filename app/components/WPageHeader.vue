<!-- app/components/WPageHeader.vue -->
<script setup lang="ts">
defineProps<{ title: string; desc?: string; search?: string; addLabel: string }>()
defineEmits<{ add: []; 'update:search': [v: string] }>()
</script>
<template>
  <div class="ph">
    <div>
      <div class="ph-title">{{ title }}</div>
      <div v-if="desc" class="ph-desc">{{ desc }}</div>
    </div>
    <div class="ph-actions">
      <input class="ph-search" :value="search" placeholder="검색…"
        @input="$emit('update:search', ($event.target as HTMLInputElement).value)" />
      <button class="add" @click="$emit('add')">{{ addLabel }}</button>
    </div>
  </div>
</template>
<style scoped>
.ph { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 16px 18px; border-bottom: 1px solid var(--line); }
.ph-title { font-family: var(--font-display); font-size: 15px; font-weight: 700; color: var(--ink); }
.ph-desc { font-size: 12px; color: var(--ink-2); margin-top: 2px; }
.ph-actions { display: flex; gap: 10px; align-items: center; }
.ph-search { padding: 8px 12px; border: 1px solid var(--line); border-radius: 9px; font-family: var(--font-mono); font-size: 12.5px; width: 170px; max-width: 42vw; background: var(--th); color: var(--ink); }
.add { padding: 8px 14px; border-radius: 9px; border: none; background: var(--run); color: #fff; font-family: var(--font-sans); font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; box-shadow: 0 2px 8px rgba(45,125,210,.3), inset 0 1px 0 rgba(255,255,255,.2); transition: transform .15s ease; }
.add:hover { transform: translateY(-1px); }
</style>
