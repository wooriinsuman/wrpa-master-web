<!-- app/components/WConfirm.vue -->
<!-- Reusable confirm dialog. Built on the same reka-ui Dialog primitives as
     WDrawer so it inherits proven overlay/focus behaviour. Used by WCrudPage to
     gate destructive deletes across every CRUD page. -->
<script setup lang="ts">
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose } from 'reka-ui'

withDefaults(defineProps<{
  open: boolean
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}>(), {
  title: '삭제하시겠습니까?',
  message: '이 작업은 되돌릴 수 없습니다.',
  confirmLabel: '삭제',
  cancelLabel: '취소',
  danger: true,
})

const emit = defineEmits<{ 'update:open': [v: boolean]; confirm: [] }>()

function close() { emit('update:open', false) }
function onConfirm() { emit('confirm'); close() }
</script>

<template>
  <DialogRoot :open="open" @update:open="v => emit('update:open', v)">
    <DialogPortal>
      <DialogOverlay class="cf-overlay" />
      <DialogContent class="cf-panel">
        <div class="cf-head">
          <DialogTitle class="cf-title">{{ title }}</DialogTitle>
          <DialogClose class="cf-close" aria-label="닫기">✕</DialogClose>
        </div>
        <DialogDescription class="cf-msg">{{ message }}</DialogDescription>
        <div class="cf-foot">
          <button class="act act--ghost" @click="close">{{ cancelLabel }}</button>
          <button class="act" :class="danger ? 'act--danger' : 'act--primary'" @click="onConfirm">{{ confirmLabel }}</button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.cf-overlay { position: fixed; inset: 0; z-index: 92; background: rgba(15,21,33,.4); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
.cf-panel { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 93; width: 380px; max-width: calc(100vw - 32px); background: var(--panel); border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 30px 80px rgba(16,24,40,.32), inset 0 1px 0 rgba(255,255,255,.4); padding: 22px; display: flex; flex-direction: column; gap: 14px; }
.cf-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.cf-title { font-family: var(--font-display); font-size: 16px; font-weight: 700; color: var(--ink); }
.cf-close { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--line); background: var(--th); color: var(--ink-2); font-size: 15px; cursor: pointer; }
.cf-msg { font-size: 13px; color: var(--ink-2); line-height: 1.5; }
.cf-foot { margin-top: 4px; display: flex; gap: 10px; justify-content: flex-end; }
@media (prefers-reduced-motion: no-preference) { .cf-panel { animation: cfPop .2s cubic-bezier(.2,.7,.2,1) both; } }
@keyframes cfPop { from { transform: translate(-50%, -50%) scale(.96); opacity: 0; } to { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
</style>
