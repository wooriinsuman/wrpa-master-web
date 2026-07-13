<script setup lang="ts">
import { computed } from 'vue'

// Control-room telemetry strip. Persistent across pages: the operational pulse
// (connection heartbeat + fleet/work/HID vitals) an operator watches at a glance.
// The page name lives in the panel header, not here — this bar reports state.
const { online, ready, lastSync, stats } = useTelemetry()
const { dark, toggle } = useTheme()
const themeLabel = computed(() => (dark.value ? '☀ 라이트' : '☾ 다크'))

// LED + label carry connection state; the heartbeat ring (keyed to lastSync)
// shows "just synced" visually, so no textual "N초 전" is needed.
const conn = computed(() => {
  if (!ready.value) return { led: 'led--wait', label: '연결 중' }
  if (!online.value) return { led: 'led--off', label: 'OFFLINE' }
  return { led: 'led--on', label: 'SYSTEM ONLINE' }
})

// '—' until the first poll settles, so numbers never flash a false 0.
const n = (v: number) => (ready.value ? String(v) : '—')
</script>

<template>
  <header class="tbar">
    <!-- Heartbeat: the LED re-mounts on each sync (keyed by lastSync), replaying
         the expanding ring — a real beat per successful poll. -->
    <div class="conn">
      <span class="led" :class="conn.led" :key="ready ? lastSync : 'wait'" aria-hidden="true" />
      <span class="conn-label">{{ conn.label }}</span>
    </div>

    <div class="cells" :class="{ 'is-stale': ready && !online }">
      <NuxtLink to="/workers" class="cell">
        <span class="cell-l">워커</span>
        <span class="cell-v">
          <span class="mono">{{ n(stats.online) }}</span><span class="slash">/</span><span class="mono dim">{{ n(stats.total) }}</span>
          <span v-if="ready && stats.offline > 0" class="flag">{{ stats.offline }} 정지</span>
        </span>
      </NuxtLink>

      <span class="div" aria-hidden="true" />

      <NuxtLink to="/jobs" class="cell">
        <span class="cell-l">실행중</span>
        <span class="cell-v mono run">{{ n(stats.running) }}</span>
      </NuxtLink>

      <span class="div" aria-hidden="true" />

      <NuxtLink to="/jobs" class="cell" :class="{ 'cell--alert': ready && stats.failed > 0 }">
        <span class="cell-l">실패</span>
        <span class="cell-v mono">{{ n(stats.failed) }}</span>
      </NuxtLink>

      <span class="div" aria-hidden="true" />

      <NuxtLink to="/workers" class="cell" :class="{ 'cell--alert': ready && stats.hidTotal > 0 && stats.hidHealth < stats.hidTotal }">
        <span class="cell-l">HID</span>
        <span class="cell-v">
          <template v-if="ready && stats.hidTotal > 0">
            <span class="mono">{{ stats.hidHealth }}</span><span class="slash">/</span><span class="mono dim">{{ stats.hidTotal }}</span>
          </template>
          <span v-else class="mono dim">—</span>
        </span>
      </NuxtLink>
    </div>

    <div class="tbar-right">
      <button class="theme-btn" @click="toggle">{{ themeLabel }}</button>
    </div>
  </header>
</template>

<style scoped>
.tbar {
  position: sticky; top: 0; z-index: 35;
  background: var(--panel); border-bottom: 1px solid var(--line);
  padding: 10px 24px;
  display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
  box-shadow: 0 6px 20px rgba(16, 24, 40, 0.05);
}

/* --- Connection heartbeat --- */
.conn { display: flex; align-items: center; gap: 10px; min-width: 0; }
.led { position: relative; width: 8px; height: 8px; border-radius: 50%; flex: none; }
.led--on { background: var(--done); box-shadow: 0 0 7px var(--done); }
.led--off { background: var(--fail); box-shadow: 0 0 7px var(--fail); }
.led--wait { background: var(--idle); }
.led--on::after {
  content: ''; position: absolute; inset: 0; border-radius: 50%; background: var(--done);
}
.conn-label { font-family: var(--font-mono); font-size: 11.5px; font-weight: 600; letter-spacing: .08em; color: var(--ink); }

/* --- Telemetry cells --- */
.cells { display: flex; align-items: center; gap: 4px; transition: opacity .25s ease; }
.cells.is-stale { opacity: .45; } /* offline → last values shown as stale */
.cell {
  display: flex; flex-direction: column; gap: 1px; padding: 4px 12px; border-radius: 8px;
  text-decoration: none; transition: background .15s ease;
}
.cell:hover { background: var(--th); }
.cell-l { font-size: 9px; letter-spacing: .07em; text-transform: uppercase; color: var(--ink-2); }
.cell-v { font-size: 15px; font-weight: 600; color: var(--ink); font-variant-numeric: tabular-nums; display: flex; align-items: baseline; gap: 0; }
.mono { font-family: var(--font-mono); }
.dim { color: var(--ink-2); }
.slash { color: var(--ink-2); margin: 0 1px; font-family: var(--font-mono); }
.run { color: var(--run); }
.cell--alert .cell-v, .cell--alert .cell-l { color: var(--fail); }
.flag {
  margin-left: 6px; padding: 1px 6px; border-radius: 999px; font-size: 9.5px; font-weight: 700;
  color: var(--fail); background: color-mix(in srgb, var(--fail) 14%, transparent); align-self: center;
}
.div { width: 1px; height: 22px; background: var(--line); flex: none; }

.tbar-right { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.theme-btn {
  padding: 7px 12px; border-radius: 9px; border: 1px solid var(--line);
  background: var(--th); color: var(--ink); font-family: var(--font-mono); font-size: 12px;
  cursor: pointer; transition: transform 0.15s ease;
}
.theme-btn:hover { transform: translateY(-1px); }

@media (prefers-reduced-motion: no-preference) {
  .led--on::after { animation: beat .7s ease-out both; }
}
@keyframes beat {
  0% { transform: scale(1); opacity: .5; }
  100% { transform: scale(3); opacity: 0; }
}

@media (max-width: 720px) {
  .tbar { gap: 12px; padding: 9px 16px; }
  .cell { padding: 3px 8px; }
}
</style>
