<!-- app/components/WButton.vue -->
<script setup lang="ts">
// Thin wrapper over the global .act button system (assets/css/components.css).
// Variant/colour render straight to .act--*, so WButton matches every other
// button in the app with zero CSS duplication; only sizes (sm/lg) are new.
// Icons go in the #leading / #trailing slots (any inline SVG). Native attrs —
// @click, disabled, title, aria-label, form — fall through to the <button>.
withDefaults(defineProps<{
  variant?: 'ghost' | 'primary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit'
}>(), { variant: 'ghost', size: 'md', type: 'button' })
</script>

<template>
  <button :type="type" class="act wbtn" :class="[`act--${variant}`, size !== 'md' && `act--${size}`]">
    <span v-if="$slots.leading" class="wbtn__icon"><slot name="leading" /></span>
    <slot />
    <span v-if="$slots.trailing" class="wbtn__icon"><slot name="trailing" /></span>
  </button>
</template>

<style scoped>
.wbtn { display: inline-flex; align-items: center; gap: 6px; }
.wbtn__icon { flex: none; display: inline-flex; align-items: center; }
</style>
