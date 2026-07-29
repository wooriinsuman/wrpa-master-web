<!-- app/components/WDataTable.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { isStatusCell } from '~/utils/status'

export interface Column {
  key: string
  label: string
  kind?: 'text' | 'mono' | 'muted' | 'status' | 'chips' | 'wrap' | 'tags'
  // Relative width multiplier (flex-grow). Default 1; e.g. 2 = twice the share.
  weight?: number
  // 잘림 금지: 셀 폭보다 긴 값을 말줄임하지 않고 줄바꿈해 전부 보여준다.
  // kind가 정한 글꼴·정렬은 그대로 두고 줄바꿈 여부만 바꾸므로 어떤 kind와도 함께 쓸 수 있다.
  wrap?: boolean
  // Header click sorting is on by default; set false to opt a column out.
  sortable?: boolean
  // Optional custom sort ranking for categorical columns (e.g. 생/손/보증 order).
  // Values are compared by their index in this list instead of alphabetically.
  order?: string[]
}
type Dir = 'asc' | 'desc'
interface Sort { key: string; dir: Dir }

const props = defineProps<{
  columns: Column[]
  rows: Record<string, any>[]
  actionsWidth?: number
  // Prepend a 1-based № column reflecting the current (sorted) display order.
  indexColumn?: boolean
  // Opt-in checkbox column for multi-select (bulk actions). Off by default.
  selectable?: boolean
  // Opt-in affordance for @row-click (pointer cursor). The event is always
  // emitted; this only tells the user the row is clickable.
  rowClickable?: boolean
}>()

// Whole-row click, for pages whose "detail" is a read-only drawer rather than a
// per-row button. The actions cell stops propagation so its controls (inline
// inputs, 취소 …) never double as a row click.
const emit = defineEmits<{ rowClick: [row: Record<string, any>] }>()

// Multi-column sort state, highest priority first. Empty = show source order.
const sorts = ref<Sort[]>([])

// Selection is keyed by row.id (not display index `i`) so it stays stable
// across sorting. `rows` is typed loosely here, but CrudRow guarantees `id`.
const selected = defineModel<string[]>('selected', { default: () => [] })

function sortableOf(c: Column) { return c.sortable !== false }

// cellValue → the comparable primitive for a cell (StatusCell sorts by label).
function comparable(row: Record<string, any>, key: string) {
  const v = row[key]
  if (isStatusCell(v)) return v.label
  return v
}

function compareBy(a: Record<string, any>, b: Record<string, any>, s: Sort): number {
  const col = props.columns.find(c => c.key === s.key)
  let av = comparable(a, s.key)
  let bv = comparable(b, s.key)
  let r: number
  if (col?.order) {
    const ai = col.order.indexOf(String(av)); const bi = col.order.indexOf(String(bv))
    r = (ai === -1 ? Number.MAX_SAFE_INTEGER : ai) - (bi === -1 ? Number.MAX_SAFE_INTEGER : bi)
  } else if (typeof av === 'number' && typeof bv === 'number') {
    r = av - bv
  } else {
    r = String(av ?? '').localeCompare(String(bv ?? ''), 'ko')
  }
  return s.dir === 'asc' ? r : -r
}

const displayRows = computed(() => {
  if (sorts.value.length === 0) return props.rows
  // Stable multi-key sort: decorate with original index as final tiebreaker.
  return props.rows
    .map((row, i) => ({ row, i }))
    .sort((x, y) => {
      for (const s of sorts.value) {
        const r = compareBy(x.row, y.row, s)
        if (r !== 0) return r
      }
      return x.i - y.i
    })
    .map(d => d.row)
})

// Header click: plain click sorts by that column alone (asc→desc→off);
// shift-click adds/cycles the column within the multi-sort stack.
function onSort(c: Column, ev: MouseEvent) {
  if (!sortableOf(c)) return
  const key = c.key
  const existing = sorts.value.find(s => s.key === key)
  if (ev.shiftKey) {
    if (!existing) sorts.value = [...sorts.value, { key, dir: 'asc' }]
    else if (existing.dir === 'asc') sorts.value = sorts.value.map(s => s.key === key ? { ...s, dir: 'desc' } : s)
    else sorts.value = sorts.value.filter(s => s.key !== key)
  } else {
    if (existing && sorts.value.length === 1) {
      sorts.value = existing.dir === 'asc' ? [{ key, dir: 'desc' }] : []
    } else {
      sorts.value = [{ key, dir: 'asc' }]
    }
  }
}

function sortState(key: string): { dir: Dir; rank: number } | null {
  const idx = sorts.value.findIndex(s => s.key === key)
  return idx === -1 ? null : { dir: sorts.value[idx]!.dir, rank: idx + 1 }
}

const allSelected = computed(() => displayRows.value.length > 0 && displayRows.value.every(r => selected.value.includes(r.id)))
function toggleOne(id: string) {
  selected.value = selected.value.includes(id) ? selected.value.filter(x => x !== id) : [...selected.value, id]
}
function toggleAll() {
  const ids = displayRows.value.map(r => r.id)
  selected.value = allSelected.value ? selected.value.filter(x => !ids.includes(x)) : [...new Set([...selected.value, ...ids])]
}
</script>
<template>
  <div class="dt-wrap" :style="{ '--dt-actions-w': `${props.actionsWidth ?? 128}px` }">
    <div class="dt-min">
      <div class="dt-head">
        <div v-if="selectable" class="dt-th dt-sel-h">
          <input type="checkbox" :checked="allSelected" @change="toggleAll" />
        </div>
        <div v-if="indexColumn" class="dt-th dt-idx-h">№</div>
        <div
          v-for="c in columns"
          :key="c.key"
          class="dt-th"
          :class="{ 'dt-th--sortable': sortableOf(c), 'dt-th--active': !!sortState(c.key) }"
          :style="c.weight ? { flexGrow: c.weight } : undefined"
          @click="onSort(c, $event)"
        >
          {{ c.label }}
          <span v-if="sortState(c.key)" class="dt-sort">
            {{ sortState(c.key)!.dir === 'asc' ? '▲' : '▼' }}<span v-if="sorts.length > 1" class="dt-sort-rank">{{ sortState(c.key)!.rank }}</span>
          </span>
        </div>
        <div class="dt-th dt-actions-h">액션</div>
      </div>
      <div v-if="displayRows.length === 0" class="dt-empty">
        <slot name="empty">데이터가 없습니다.</slot>
      </div>
      <div v-for="(row, i) in displayRows" :key="i" class="dt-row" :class="{ 'dt-row--clickable': rowClickable }" @click="emit('rowClick', row)">
        <div v-if="selectable" class="dt-td dt-td--sel">
          <input type="checkbox" :checked="selected.includes(row.id)" @change="toggleOne(row.id)" />
        </div>
        <div v-if="indexColumn" class="dt-td dt-td--idx">{{ i + 1 }}</div>
        <div v-for="c in columns" :key="c.key" class="dt-td" :class="[`dt-td--${c.kind ?? 'text'}`, { 'dt-td--wrapped': c.wrap }]" :style="c.weight ? { flexGrow: c.weight } : undefined">
          <slot :name="`cell-${c.key}`" :row="row" :value="row[c.key]">
            <template v-if="c.kind === 'status'">
              <WStatusBadge v-if="isStatusCell(row[c.key])" :label="row[c.key].label" :kind="row[c.key].kind" />
              <WStatusBadge v-else :label="String(row[c.key])" />
            </template>
            <!-- chips: array → equal-width pills on an aligned grid; a name too long
                 for its column is ellipsis-truncated (full name on hover / dialog).
                 string → muted text (e.g. a "배정 안됨" placeholder). -->
            <template v-else-if="c.kind === 'chips'">
              <template v-if="Array.isArray(row[c.key]) && row[c.key].length">
                <span v-for="(chip, ci) in row[c.key]" :key="ci" class="dt-chip"><span class="dt-chip-t" :title="chip">{{ chip }}</span></span>
              </template>
              <span v-else class="dt-chip-empty">{{ Array.isArray(row[c.key]) ? '—' : row[c.key] }}</span>
            </template>
            <!-- tags: array → left-aligned wrapping tags, full text (no truncation).
                 Better readability than comma-joined text for multi-value cells. -->
            <template v-else-if="c.kind === 'tags'">
              <template v-if="Array.isArray(row[c.key]) && row[c.key].length">
                <span v-for="(t, ti) in row[c.key]" :key="ti" class="dt-tag" :title="t">{{ t }}</span>
              </template>
              <span v-else class="dt-tag-empty">{{ Array.isArray(row[c.key]) ? '—' : row[c.key] }}</span>
            </template>
            <span v-else>{{ row[c.key] }}</span>
          </slot>
        </div>
        <div class="dt-td dt-actions" @click.stop><slot name="actions" :row="row" /></div>
      </div>
    </div>
  </div>
</template>
<style scoped>
/* When the wrap is a flex child of a height-bounded .panel (list pages) it
   fills the remaining space and scrolls internally; elsewhere (e.g. dashboard)
   it has no bounded height, so it simply grows to content. */
.dt-wrap { flex: 1; min-height: 0; overflow: auto; }
.dt-min { min-width: 680px; }
.dt-head { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; background: var(--th); border-bottom: 1px solid var(--line); }
.dt-th { flex: 1; min-width: 0; padding: 11px 16px; font-size: 12.5px; letter-spacing: .04em; text-transform: uppercase; color: var(--ink-2); font-weight: 600; white-space: nowrap; text-align: center; user-select: none; }
.dt-th--sortable { cursor: pointer; }
.dt-th--sortable:hover { color: var(--ink); }
.dt-th--active { color: var(--ink); }
.dt-sort { margin-left: 4px; font-size: 10px; }
.dt-sort-rank { font-size: 9px; vertical-align: super; margin-left: 1px; opacity: .7; }
.dt-sel-h { flex: none; width: 40px; display: flex; align-items: center; justify-content: center; }
.dt-idx-h { flex: none; width: 52px; }
.dt-actions-h { flex: none; width: var(--dt-actions-w, 128px); text-align: center; }
.dt-row { display: flex; align-items: center; border-top: 1px solid var(--line); transition: background .15s ease; }
.dt-row:first-child { border-top: none; }
.dt-row:hover { background: var(--th); }
.dt-row--clickable { cursor: pointer; }
.dt-td { flex: 1; min-width: 0; padding: 11px 16px; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--ink); text-align: center; }
.dt-td--mono { font-family: var(--font-mono); }
.dt-td--muted { font-family: var(--font-mono); font-size: 12px; color: var(--ink-2); }
/* wrap: 내용을 자르지 않고 줄바꿈해 전체를 보여준다(예: 작업 파일 목록). */
.dt-td--wrap { white-space: normal; overflow: visible; text-overflow: clip; text-align: left; line-height: 1.5; word-break: break-word; }
/* wrap 옵션(kind 무관): 말줄임 대신 줄바꿈. 정렬·글꼴은 kind가 정한 값을 유지한다.
   단어 하나가 셀보다 길면(긴 호스트명 등) 단어 중간에서라도 끊어 잘리지 않게 한다. */
.dt-td--wrapped { white-space: normal; overflow: visible; text-overflow: clip; line-height: 1.45; overflow-wrap: anywhere; }
/* tags: 다중 값을 개별 태그로. 왼쪽 정렬·줄바꿈·전체 표시(가독성). */
.dt-td--tags { display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-start; align-items: flex-start; white-space: normal; overflow: visible; text-overflow: clip; text-align: left; }
.dt-tag { display: inline-flex; padding: 3px 8px; border-radius: 7px; background: var(--th); border: 1px solid var(--line); font-size: 11.5px; color: var(--ink); white-space: normal; word-break: break-word; line-height: 1.35; }
.dt-tag-empty { color: var(--ink-2); font-size: 12px; }
/* chips cell: equal-width pills on an aligned grid — rows & columns line up,
   the group is centered (auto-fit collapses empty tracks so justify-content
   can center), and pills never wrap. A pill's track grows to fit its text
   (max-content) but is capped by the cell width; when the name is longer than
   the available track it is ellipsis-truncated inside the pill (full name is
   shown in the assignment dialog). */
.dt-td--chips { display: grid; grid-template-columns: repeat(auto-fit, minmax(74px, max-content)); justify-content: center; align-items: center; gap: 4px; white-space: normal; overflow: visible; text-overflow: clip; }
/* pill is stretched to its (equal-width) column and centers its label; the inner
   label owns the ellipsis so truncation is start-anchored and reliable across
   browsers, keeping the pill's padding intact instead of letting text bleed to
   the border. */
.dt-chip { display: flex; align-items: center; justify-content: center; min-width: 0; padding: 2px 8px; border-radius: 999px; background: var(--th); border: 1px solid var(--line); font-size: 11.5px; color: var(--ink); }
.dt-chip-t { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dt-chip-empty { font-size: 12px; color: var(--ink-2); }
/* Must follow `.dt-td` so `flex: none` wins over the base `flex: 1` and the
   № column keeps its fixed width (matching the `.dt-idx-h` header). */
.dt-td--idx { flex: none; width: 52px; font-family: var(--font-mono); font-size: 12px; color: var(--ink-2); }
.dt-td--sel { flex: none; width: 40px; display: flex; align-items: center; justify-content: center; }
.dt-actions { flex: none; width: var(--dt-actions-w, 128px); display: flex; gap: 6px; justify-content: center; }
.dt-empty { padding: 32px 16px; text-align: center; font-size: 13px; color: var(--ink-2); }
</style>
