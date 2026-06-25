import { ref } from 'vue'
interface Toast { id: number; msg: string }
const toasts = ref<Toast[]>([])
let seq = 0
export function useToast() {
  function push(msg: string) {
    const id = ++seq
    toasts.value.push({ id, msg })
    setTimeout(() => {
      const i = toasts.value.findIndex(t => t.id === id)
      if (i !== -1) toasts.value.splice(i, 1)
    }, 2200)
  }
  return { toasts, push }
}
