<!-- app/components/WPackageAccordion.vue -->
<!-- 버전을 접었다 펼치는 아코디언. 패키지와 에셋 매니페스트를 같은 UI로 다룬다.
     버전 chip 클릭 = 배포/활성 요청(회색→활성), 현재 배포 중(초록) chip 클릭 = 해제
     요청 — 실제 실행은 부모가 confirm 후 처리. 후행 액션은 kind별로 다르다
     (package: 다운로드/삭제, asset: 보기). -->
<script setup lang="ts">
import { ref } from 'vue'

export type AccordionKind = 'package' | 'asset'
export interface AccordionRow {
  version: string   // chip 라벨 겸 식별자
  cols: string[]    // 가운데 표시 열(미리 포맷된 문자열: 크기/날짜/파일수 등)
  src: any          // 원본 객체 — 이벤트로 그대로 되돌려줌
}
export interface AccordionGroup {
  kind: AccordionKind
  name: string
  deployedVersion: string // 현재 배포(활성) 버전. '' 이면 없음.
  items: AccordionRow[]    // newest-first
}

const props = defineProps<{
  groups: AccordionGroup[]
  downloadUrl?: (src: any) => string
}>()
const emit = defineEmits<{
  activate: [group: AccordionGroup, row: AccordionRow]
  deactivate: [group: AccordionGroup, row: AccordionRow]
  remove: [group: AccordionGroup, row: AccordionRow]
  view: [group: AccordionGroup, row: AccordionRow]
}>()

// 펼쳐진 그룹 집합. 기본 접힘. 키는 kind:name 복합 — 패키지명이 에셋 그룹명과
// 우연히 같아도 충돌하지 않도록.
const open = ref<Set<string>>(new Set())
function keyOf(g: AccordionGroup) { return `${g.kind}:${g.name}` }
function toggle(key: string) {
  const s = new Set(open.value)
  if (s.has(key)) s.delete(key)
  else s.add(key)
  open.value = s
}
function chipClick(g: AccordionGroup, row: AccordionRow) {
  if (row.version === g.deployedVersion) emit('deactivate', g, row)
  else emit('activate', g, row)
}
</script>

<template>
  <div class="acc">
    <div v-for="g in props.groups" :key="keyOf(g)" class="grp">
      <button type="button" class="grp-head" :class="{ 'grp-head--open': open.has(keyOf(g)) }" @click="toggle(keyOf(g))">
        <span class="chev" :class="{ 'chev--open': open.has(keyOf(g)) }">›</span>
        <span class="grp-name">{{ g.name }}</span>
        <span class="grp-count">버전 {{ g.items.length }}개</span>
        <span class="grp-live">
          <template v-if="g.deployedVersion">현재 배포 <b>{{ g.deployedVersion }}</b></template>
          <template v-else>배포 없음</template>
        </span>
      </button>

      <div v-if="open.has(keyOf(g))" class="grp-body">
        <div v-for="row in g.items" :key="row.version" class="ver">
          <button
            type="button"
            class="ver-chip"
            :class="row.version === g.deployedVersion ? 'ver-chip--live' : 'ver-chip--idle'"
            :title="row.version === g.deployedVersion ? '현재 배포 중 · 클릭하면 배포를 해제합니다' : '클릭하면 이 버전을 배포합니다'"
            @click="chipClick(g, row)"
          >{{ row.version }}</button>
          <span v-for="(c, ci) in row.cols" :key="ci" class="ver-col">{{ c }}</span>
          <span class="ver-actions">
            <template v-if="g.kind === 'package'">
              <a class="act act--ghost" :href="props.downloadUrl ? props.downloadUrl(row.src) : '#'" download>다운로드</a>
              <button class="act act--danger" @click="emit('remove', g, row)">삭제</button>
            </template>
            <template v-else>
              <button class="act act--ghost" @click="emit('view', g, row)">보기</button>
            </template>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* .act comes from the global DS (assets/css/components.css). */
a.act { text-decoration: none; display: inline-flex; align-items: center; }
.acc { display: flex; flex-direction: column; }

.grp { border-top: 1px solid var(--line); }
.grp:first-child { border-top: none; }
.grp-head { width: 100%; display: flex; align-items: center; gap: 12px; padding: 13px 16px; background: none; border: none; cursor: pointer; text-align: left; transition: background .15s ease; }
.grp-head:hover { background: var(--th); }
.grp-head--open { background: var(--th); }
.chev { flex: none; font-size: 16px; color: var(--ink-2); transition: transform .15s ease; }
.chev--open { transform: rotate(90deg); }
.grp-name { font-family: var(--font-mono); font-weight: 600; font-size: 13.5px; color: var(--ink); }
.grp-count { font-size: 12px; color: var(--ink-2); }
.grp-live { margin-left: auto; font-size: 12px; color: var(--ink-2); }
.grp-live b { font-family: var(--font-mono); color: var(--done); font-weight: 600; }

.grp-body { padding: 2px 16px 10px 40px; display: flex; flex-direction: column; gap: 2px; }
.ver { display: flex; align-items: center; gap: 14px; padding: 7px 0; border-top: 1px dashed var(--line); }
.ver:first-child { border-top: none; }

/* 버전 chip: 배포 중이면 초록, 아니면 회색. 초록 호버 시 빨강(해제 암시). */
.ver-chip { flex: none; min-width: 84px; padding: 4px 12px; border-radius: 999px; border: 1px solid var(--line); background: var(--panel); color: var(--ink-2); font-family: var(--font-mono); font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all .12s ease; }
.ver-chip--idle:hover { border-color: var(--done); color: var(--ink); }
.ver-chip--live { background: rgba(47,163,107,.15); border-color: var(--done); color: var(--done); }
.ver-chip--live:hover { background: rgba(224,83,61,.14); border-color: var(--fail); color: var(--fail); }

.ver-col { font-family: var(--font-mono); font-size: 12px; color: var(--ink-2); }
.ver-actions { margin-left: auto; display: flex; gap: 6px; }
</style>
