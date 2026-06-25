<!-- app/components/WDrawer.vue -->
<script setup lang="ts">
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogClose } from 'reka-ui'
defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ 'update:open': [v: boolean]; close: [] }>()
function onOpenChange(v: boolean) { emit('update:open', v); if (!v) emit('close') }
</script>
<template>
  <DialogRoot :open="open" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay class="dw-overlay" />
      <DialogContent class="dw-panel">
        <div class="dw-head">
          <DialogTitle class="dw-title">{{ title }}</DialogTitle>
          <DialogClose class="dw-close" aria-label="닫기">✕</DialogClose>
        </div>
        <div class="dw-body"><slot /></div>
        <div class="dw-foot"><slot name="footer" /></div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
<style scoped>
.dw-overlay { position: fixed; inset: 0; z-index: 90; background: rgba(15,21,33,.4); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
.dw-panel { position: fixed; top: 0; right: 0; z-index: 91; width: 392px; max-width: 100%; height: 100%; background: var(--panel); border-left: 1px solid var(--line); box-shadow: -22px 0 60px rgba(16,24,40,.28), inset 1px 0 0 rgba(255,255,255,.4); padding: 22px; display: flex; flex-direction: column; gap: 18px; overflow-y: auto; }
.dw-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.dw-title { font-family: var(--font-display); font-size: 17px; font-weight: 700; color: var(--ink); }
.dw-close { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--line); background: var(--th); color: var(--ink-2); font-size: 15px; cursor: pointer; }
.dw-body { display: flex; flex-direction: column; gap: 14px; }
.dw-foot { margin-top: auto; display: flex; gap: 10px; justify-content: flex-end; }
@media (prefers-reduced-motion: no-preference) { .dw-panel { animation: dwSlide .34s cubic-bezier(.2,.7,.2,1) both; } }
@keyframes dwSlide { from { transform: translateX(26px); opacity: .4; } to { transform: translateX(0); opacity: 1; } }
</style>
