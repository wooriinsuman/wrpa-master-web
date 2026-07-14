<!-- app/components/WFileTree.vue -->
<!-- 매니페스트 파일을 접이식 폴더 트리로 표시. 자기 자신을 재귀 호출해 하위 폴더를
     렌더한다. 폴더는 하위 파일수·총크기를 보여주고 기본 접힘 — 대량 파일에 대비. -->
<script setup lang="ts">
import { ref } from 'vue'
import type { TreeDir, TreeFile } from '~/utils/fileTree'
import { fmtSize } from '~/utils/format'

defineProps<{ dirs: TreeDir[]; files: TreeFile[] }>()

const open = ref<Set<string>>(new Set())
function toggle(path: string) {
  const s = new Set(open.value)
  if (s.has(path)) s.delete(path)
  else s.add(path)
  open.value = s
}
</script>

<template>
  <ul class="tree">
    <li v-for="d in dirs" :key="d.path" class="node">
      <button type="button" class="row row--dir" @click="toggle(d.path)">
        <span class="chev" :class="{ 'chev--open': open.has(d.path) }">›</span>
        <span class="nm">{{ d.name }}</span>
        <span class="meta">{{ d.fileCount }}개 · {{ fmtSize(d.totalSize) }}</span>
      </button>
      <WFileTree v-if="open.has(d.path)" class="child" :dirs="d.dirs" :files="d.files" />
    </li>
    <li v-for="f in files" :key="f.path" class="node">
      <span class="row row--file">
        <span class="chev chev--leaf" />
        <span class="nm nm--file" :title="f.path">{{ f.name }}</span>
        <span class="meta">{{ fmtSize(f.size) }}</span>
      </span>
    </li>
  </ul>
</template>

<style scoped>
.tree { list-style: none; margin: 0; padding: 0; }
.child { padding-left: 16px; border-left: 1px solid var(--line); margin-left: 7px; }
.node { display: flex; flex-direction: column; }
.row { display: flex; align-items: center; gap: 8px; width: 100%; padding: 5px 4px; font-size: 12.5px; text-align: left; background: none; border: none; }
.row--dir { cursor: pointer; border-radius: 6px; }
.row--dir:hover { background: var(--th); }
.chev { flex: none; width: 12px; font-size: 14px; color: var(--ink-2); transition: transform .12s ease; }
.chev--open { transform: rotate(90deg); }
.chev--leaf { visibility: hidden; }
.nm { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--font-mono); color: var(--ink); font-weight: 600; }
.nm--file { color: var(--ink-2); font-weight: 400; }
.meta { flex: none; margin-left: auto; font-family: var(--font-mono); font-size: 11px; color: var(--ink-2); }
</style>
