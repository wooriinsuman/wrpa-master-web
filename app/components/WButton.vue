<!-- app/components/WButton.vue -->
<script setup lang="ts">
import { computed, useAttrs } from 'vue'
// Thin wrapper over the global .act button system (assets/css/components.css).
// Variant/colour render straight to .act--*, so WButton matches every other
// button in the app with zero CSS duplication; only sizes (sm/lg) are new.
// Icons go in the #leading / #trailing slots (any inline SVG). Native attrs —
// @click, disabled, title, aria-label, form — fall through to the <button>.
// `loading`: keeps the icon/label in place, sweeps a left→right skeleton
// shimmer over the button, and disables it (async actions).
const props = withDefaults(defineProps<{
  variant?: 'ghost' | 'primary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit'
  loading?: boolean
}>(), { variant: 'ghost', size: 'md', type: 'button', loading: false })

const attrs = useAttrs()
// Combine loading with a caller-supplied disabled (the explicit :disabled below
// would otherwise clobber a fallthrough `disabled`).
const isDisabled = computed(() =>
  props.loading || attrs.disabled === '' || attrs.disabled === true || attrs.disabled === 'true',
)
</script>

<template>
  <button
    :type="type"
    class="act wbtn"
    :class="[`act--${variant}`, size !== 'md' && `act--${size}`, { 'wbtn--loading': loading }]"
    :disabled="isDisabled || undefined"
    :aria-busy="loading || undefined"
  >
    <span v-if="$slots.leading" class="wbtn__icon"><slot name="leading" /></span>
    <slot />
    <span v-if="$slots.trailing" class="wbtn__icon"><slot name="trailing" /></span>
  </button>
</template>

<style scoped>
.wbtn { display: inline-flex; align-items: center; gap: 6px; position: relative; overflow: hidden; }
.wbtn__icon { flex: none; display: inline-flex; align-items: center; }

/* Loading: a left→right skeleton shimmer sweeps across the button; the icon and
   label stay put underneath. pointer-events:none keeps the sweep non-interactive. */
.wbtn--loading::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, .45) 50%, transparent 100%);
  transform: translateX(-100%);
  animation: wbtn-shimmer 1.1s ease-in-out infinite;
  pointer-events: none;
}
@keyframes wbtn-shimmer { to { transform: translateX(100%); } }
/* Reduced-motion users get a static dim instead of a moving sweep. */
@media (prefers-reduced-motion: reduce) {
  .wbtn--loading::after { animation: none; transform: none; background: rgba(125, 125, 125, .18); }
}
</style>
