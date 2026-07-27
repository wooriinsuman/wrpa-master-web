<!-- app/components/WDrawer.vue -->
<script setup lang="ts">
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose } from 'reka-ui'
// width: opt-in panel width in px (default 440). 2열 폼처럼 넓은 다이얼로그만 지정.
const props = defineProps<{ open: boolean; title: string; description?: string; width?: number }>()
const emit = defineEmits<{ 'update:open': [v: boolean]; close: [] }>()
function onOpenChange(v: boolean) { emit('update:open', v); if (!v) emit('close') }
</script>
<template>
  <DialogRoot :open="open" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay class="dw-overlay" />
      <DialogContent class="dw-panel" :style="props.width ? { '--dw-w': `${props.width}px` } : undefined">
        <div class="dw-head">
          <DialogTitle class="dw-title">{{ title }}</DialogTitle>
          <DialogClose class="dw-close" aria-label="닫기">✕</DialogClose>
        </div>
        <DialogDescription class="sr-only">{{ description ?? '양식을 입력한 뒤 저장하세요.' }}</DialogDescription>
        <div class="dw-body" autocomplete="off"><slot /></div>
        <div class="dw-foot"><slot name="footer" /></div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
<style scoped>
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.dw-overlay { position: fixed; inset: 0; z-index: 90; background: rgba(15,21,33,.4); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
.dw-panel { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 91; width: var(--dw-w, 440px); max-width: calc(100vw - 32px); max-height: calc(100vh - 48px); background: var(--panel); border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 30px 80px rgba(16,24,40,.32), inset 0 1px 0 rgba(255,255,255,.4); padding: 22px; display: flex; flex-direction: column; gap: 18px; overflow-y: auto; }
.dw-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.dw-title { font-family: var(--font-display); font-size: 17px; font-weight: 700; color: var(--ink); }
.dw-close { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--line); background: var(--th); color: var(--ink-2); font-size: 15px; cursor: pointer; }
.dw-body { display: flex; flex-direction: column; gap: 14px; }
.dw-foot { margin-top: auto; display: flex; gap: 10px; justify-content: flex-end; }
@media (prefers-reduced-motion: no-preference) { .dw-panel { animation: dwPop .22s cubic-bezier(.2,.7,.2,1) both; } }
@keyframes dwPop { from { transform: translate(-50%, -50%) scale(.96); opacity: 0; } to { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
</style>
