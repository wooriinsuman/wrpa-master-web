<script setup lang="ts">
import { ref, computed } from 'vue'
import type { components } from '#shared/types/api'
import type { Column } from '~/components/WDataTable.vue'
import type { StatusCell } from '~/utils/status'

type View = components['schemas']['HolidayView']
interface HolidayRow { day: string; name: string; source: StatusCell; state: StatusCell; _src: View }

const holidays = useHolidays()
const { push } = useToast()

const year = ref(new Date().getFullYear())
const years = computed(() => [year.value - 1, year.value, year.value + 1])

const { data, pending, refresh } = await useAsyncData(
  'holidays',
  () => holidays.list(year.value),
  { watch: [year] },
)
const list = computed<View[]>(() => data.value ?? [])

const columns: Column[] = [
  { key: 'day', label: '날짜', kind: 'mono' },
  { key: 'name', label: '이름', kind: 'text' },
  { key: 'source', label: '출처', kind: 'status' },
  { key: 'state', label: '적용', kind: 'status' },
]

// 토글 = "휴일이지만 그날 작업" 스위치. 손대면 source=manual — 재동기화가 안 덮음.
const rows = computed<HolidayRow[]>(() => list.value.map(h => ({
  day: h.day,
  name: h.name,
  source: { label: h.source, kind: h.source === 'api' ? 'idle' : 'done' } as StatusCell,
  state: h.active
    ? { label: '휴일(작업 안 함)', kind: 'idle' } as StatusCell
    : { label: '작업함', kind: 'done' } as StatusCell,
  _src: h,
})))

async function toggle(h: View) {
  try {
    await holidays.upsert(h.day, h.name, !h.active)
    await refresh()
  } catch (e: any) {
    push(e?.data?.message ?? '변경에 실패했습니다.')
  }
}

async function removeRow(h: View) {
  if (!confirm(`${h.day} ${h.name}을(를) 삭제할까요?`)) return
  try {
    await holidays.remove(h.day)
    await refresh()
    push('삭제되었습니다.')
  } catch (e: any) {
    push(e?.data?.message ?? '삭제에 실패했습니다.')
  }
}

// --- 수동 추가 ---
const addOpen = ref(false)
const newDay = ref('')
const newName = ref('')
function openAdd() {
  newDay.value = ''
  newName.value = ''
  addOpen.value = true
}
async function addManual() {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(newDay.value) || !newName.value.trim()) {
    push('날짜(YYYY-MM-DD)와 이름을 입력하세요.')
    return
  }
  try {
    await holidays.upsert(newDay.value, newName.value.trim(), true)
    addOpen.value = false
    await refresh()
    push('등록되었습니다.')
  } catch (e: any) {
    push(e?.data?.message ?? '등록에 실패했습니다.')
  }
}

// --- data.go.kr 동기화 ---
const syncing = ref(false)
async function syncNow() {
  syncing.value = true
  try {
    const res = await holidays.sync()
    push(`동기화 완료 — ${res.written}건 반영`)
    await refresh()
  } catch (e: any) {
    push(e?.data?.message ?? '동기화에 실패했습니다. (API 키 설정을 확인하세요)')
  } finally {
    syncing.value = false
  }
}
</script>

<template>
  <section class="panel">
    <div class="hd">
      <div>
        <div class="hd-title">휴일 관리</div>
        <div class="hd-desc">영업일 계산에 쓰이는 공휴일 — 작업함으로 바꾸면 그날 작업이 실행됩니다</div>
      </div>
      <div class="hd-actions">
        <select v-model.number="year" class="hd-year">
          <option v-for="y in years" :key="y" :value="y">{{ y }}년</option>
        </select>
        <button class="act act--ghost" :disabled="syncing" @click="syncNow">{{ syncing ? '동기화 중…' : '동기화' }}</button>
        <button class="act act--primary" @click="openAdd">+ 수동 추가</button>
      </div>
    </div>

    <WDataTable v-if="rows.length" :columns="columns" :rows="rows" :actions-width="180">
      <template #actions="{ row }">
        <button class="act act--ghost" @click="toggle(row._src)">{{ row._src.active ? '작업함으로' : '휴일로' }}</button>
        <button class="act act--danger" @click="removeRow(row._src)">삭제</button>
      </template>
    </WDataTable>
    <WEmptyState
      v-else
      title="휴일 데이터가 없습니다"
      :message="pending ? '불러오는 중…' : '동기화 버튼으로 data.go.kr에서 가져오거나 수동 추가하세요.'"
      cta-label="+ 수동 추가"
      @cta="openAdd"
    />

    <WDrawer v-model:open="addOpen" title="휴일 수동 추가" description="날짜와 이름을 입력해 휴일을 등록합니다.">
      <label class="fld"><span>날짜 <span class="req">*</span></span><input v-model="newDay" placeholder="2026-10-10" /></label>
      <label class="fld"><span>이름 <span class="req">*</span></span><input v-model="newName" placeholder="임시공휴일" /></label>
      <template #footer>
        <button class="act act--ghost" @click="addOpen = false">취소</button>
        <button class="act act--primary" @click="addManual">저장</button>
      </template>
    </WDrawer>
  </section>
</template>

<style scoped>
/* .fld / .act come from the global DS (assets/css/components.css). */
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; box-shadow: var(--rim), var(--elev); }
.hd { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 16px 18px; border-bottom: 1px solid var(--line); }
.hd-title { font-family: var(--font-display); font-size: 15px; font-weight: 700; color: var(--ink); }
.hd-desc { font-size: 12px; color: var(--ink-2); margin-top: 2px; }
.hd-actions { display: flex; gap: 10px; align-items: center; }
.hd-year { padding: 8px 12px; border: 1px solid var(--line); border-radius: 9px; font-family: var(--font-mono); font-size: 12.5px; background: var(--th); color: var(--ink); }
</style>
