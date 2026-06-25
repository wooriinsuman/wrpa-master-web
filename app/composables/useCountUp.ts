import { ref, unref, watch, type Ref } from 'vue'

function prefersReducedMotion(): boolean {
  return typeof globalThis.matchMedia === 'function'
    && globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useCountUp(target: Ref<number> | number, durationMs = 950): Ref<number> {
  const out = ref(0)
  function run() {
    const end = unref(target)
    if (typeof globalThis.requestAnimationFrame !== 'function' || prefersReducedMotion()) {
      out.value = end
      return
    }
    const t0 = globalThis.performance?.now?.() ?? 0
    const tick = (now: number) => {
      let p = Math.min(1, (now - t0) / durationMs)
      p = 1 - Math.pow(1 - p, 3)
      out.value = Math.round(end * p)
      if (p < 1) globalThis.requestAnimationFrame(tick)
    }
    globalThis.requestAnimationFrame(tick)
  }
  run()
  if (typeof target !== 'number') watch(target, run)
  return out
}
