<!-- app/components/WOrderBands.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { bandAxisMax, bandSegments, bandIssues, type BandRow } from '~/utils/orderBands'
import { categoryLabel } from '~/utils/category'

const props = withDefaults(defineProps<{
  rows: BandRow[]
  dataTypeNames: Record<string, string>
  compact?: boolean
}>(), { compact: false })

const axisMax = computed(() => bandAxisMax(props.rows))
const segments = computed(() => bandSegments(props.rows, axisMax.value))
const issues = computed(() => bandIssues(props.rows))
const overlaps = computed(() => issues.value.overlaps)
const gaps = computed(() => issues.value.gaps)
const ok = computed(() => overlaps.value.length === 0 && gaps.value.length === 0)
const hasOpen = computed(() => segments.value.some(s => s.open))

function rangeText(from: number, to: number | null): string {
  return to === null ? `${from}~` : `${from}–${to}`
}
const overlapRanges = computed(() => overlaps.value.map(o => rangeText(o.from, o.to)))
const gapRanges = computed(() => gaps.value.map(g => rangeText(g.from, g.to)))

// 크로우드 방지: 축 눈금은 1/5/10/15/20 + 실제 최댓값만 표시(중복/초과 제거).
const ticks = computed(() => [...new Set([1, 5, 10, 15, 20, axisMax.value].filter(t => t >= 1 && t <= axisMax.value))].sort((a, b) => a - b))
function tickPct(t: number): number {
  return ((t - 1) / axisMax.value) * 100
}
function isOverlapping(index: number): boolean {
  return overlaps.value.some(o => o.a === index || o.b === index)
}
function chips(order: string[]): { shown: string[]; extra: number } {
  const labels = order.map(k => categoryLabel(k, props.dataTypeNames))
  return { shown: labels.slice(0, 3), extra: Math.max(0, labels.length - 3) }
}
const stripTitle = computed(() => ok.value
  ? '겹침·공백 없음'
  : [...overlapRanges.value.map(r => `겹침 ${r}`), ...gapRanges.value.map(r => `공백 ${r}`)].join(', '))
</script>

<template>
  <div class="obands" :class="{ 'obands--compact': compact }">
    <template v-if="segments.length === 0">
      <div v-if="!compact" class="obands-empty">구간 없음</div>
    </template>

    <div v-else-if="compact" class="obands-strip" :title="stripTitle">
      <span
        v-for="seg in segments"
        :key="seg.index"
        class="obands-block"
        :class="{ 'obands-block--danger': isOverlapping(seg.index) }"
        :style="{ left: seg.leftPct + '%', width: seg.widthPct + '%' }"
      />
    </div>

    <template v-else>
      <div class="obands-status">
        <span v-if="ok" class="badge badge--done">✓ 겹침·공백 없음</span>
        <template v-else>
          <span v-for="(r, i) in overlapRanges" :key="`ov${i}`" class="badge badge--fail">⚠ 겹침 {{ r }}</span>
          <span v-for="(r, i) in gapRanges" :key="`gap${i}`" class="badge badge--warn">⚠ 공백 {{ r }}</span>
        </template>
      </div>

      <div class="obands-axis">
        <span v-for="t in ticks" :key="t" class="obands-tick" :style="{ left: tickPct(t) + '%' }">{{ t }}</span>
        <span v-if="hasOpen" class="obands-open-hint">▸ 이후</span>
      </div>

      <div v-for="seg in segments" :key="seg.index" class="obands-row">
        <div class="obands-track">
          <span
            class="obands-bar"
            :class="{ 'obands-bar--danger': isOverlapping(seg.index), 'obands-bar--open': seg.open }"
            :style="{ left: seg.leftPct + '%', width: seg.widthPct + '%' }"
          />
        </div>
        <div class="obands-meta">
          <span class="obands-range">{{ rangeText(seg.from, seg.to) }}</span>
          <span class="obands-chips">
            <template v-for="(c, ci) in chips(seg.order).shown" :key="ci">
              <span v-if="ci > 0" class="obands-sep">›</span>
              <span class="obands-chip">{{ c }}</span>
            </template>
            <span v-if="chips(seg.order).extra > 0" class="obands-chip obands-chip--more">+{{ chips(seg.order).extra }}</span>
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.obands { display: flex; flex-direction: column; gap: 10px; font-size: 12px; }
.obands-empty { color: var(--ink-2); font-size: 12px; padding: 4px 0; }

.obands-status { display: flex; flex-wrap: wrap; gap: 6px; }
.badge { display: inline-flex; align-items: center; gap: 3px; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.badge--done { background: rgba(47,163,107,.15); color: var(--done); }
.badge--fail { background: rgba(224,83,61,.14); color: var(--fail); }
.badge--warn { background: rgba(232,145,42,.15); color: var(--warn); }

.obands-axis { position: relative; height: 14px; margin: 2px 0 0; border-top: 1px solid var(--line); }
.obands-tick { position: absolute; top: 2px; transform: translateX(-50%); font-size: 10px; color: var(--ink-2); font-family: var(--font-mono); }
.obands-open-hint { position: absolute; right: 0; top: 2px; font-size: 10px; color: var(--ink-2); }

.obands-row { display: flex; flex-direction: column; gap: 4px; }
.obands-track { position: relative; height: 16px; background: var(--th); border-radius: 5px; border: 1px solid var(--line); overflow: hidden; }
.obands-bar { position: absolute; top: 0; bottom: 0; background: var(--run); opacity: .75; border-radius: 3px; }
.obands-bar--danger { background: var(--fail); opacity: .85; }
.obands-bar--open { border-right: 2px dashed var(--panel); }
.obands-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.obands-range { font-family: var(--font-mono); font-size: 11px; color: var(--ink-2); min-width: 3.4rem; }
.obands-chips { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.obands-sep { color: var(--ink-2); font-size: 10px; }
.obands-chip { padding: 2px 7px; border-radius: 999px; border: 1px solid var(--line); background: var(--panel); color: var(--ink); font-size: 10.5px; }
.obands-chip--more { color: var(--ink-2); background: var(--th); border-style: dashed; }

.obands-strip { position: relative; height: 12px; width: 100%; min-width: 60px; border-radius: 4px; background: var(--th); border: 1px solid var(--line); overflow: hidden; }
.obands-block { position: absolute; top: 0; bottom: 0; background: var(--run); opacity: .7; }
.obands-block--danger { background: var(--fail); opacity: .85; }
</style>
