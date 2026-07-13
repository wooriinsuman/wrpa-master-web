import { ref } from 'vue'
export type ToastKind = 'success' | 'info' | 'error'
interface Toast { id: number; msg: string; kind: ToastKind }
const toasts = ref<Toast[]>([])
let seq = 0
export function useToast() {
  // kind: 성공(초록)·info(검정, 기본)·에러(빨강). 미지정 시 info.
  function push(msg: string, kind: ToastKind = 'info') {
    const id = ++seq
    toasts.value.push({ id, msg, kind })
    setTimeout(() => {
      const i = toasts.value.findIndex(t => t.id === id)
      if (i !== -1) toasts.value.splice(i, 1)
    }, 2200)
  }
  return { toasts, push }
}
