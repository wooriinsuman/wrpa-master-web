<!-- app/components/WStatusBadge.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { labelToKind, type StatusKind } from '~/utils/status'
const props = defineProps<{ label: string; kind?: StatusKind }>()
const kind = computed<StatusKind>(() => props.kind ?? labelToKind(props.label))
</script>
<template>
  <span class="badge" :class="`badge--${kind}`">{{ label }}</span>
</template>
<style scoped>
.badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 999px; font-size: 11.5px; font-weight: 600; }
.badge--run  { background: rgba(45,125,210,.13);  color: var(--run); }
.badge--idle { background: rgba(136,150,166,.18); color: var(--idle); }
.badge--fail { background: rgba(224,83,61,.14);   color: var(--fail); }
.badge--done { background: rgba(47,163,107,.15);  color: var(--done); }
.badge--warn { background: rgba(232,145,42,.15);  color: var(--warn); }
</style>
