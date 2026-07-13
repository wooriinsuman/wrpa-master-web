import { computed, onMounted, onUnmounted } from 'vue'
import type { components } from '#shared/types/api'
import { workerStateKind, workStateKind } from '~/utils/dashboardState'

type WorkersList = components['schemas']['WorkersList']
type WorkerView = components['schemas']['WorkerView']
type WorkView = components['schemas']['WorkView']

// Live operational pulse for the control-room topbar. Polls /workers + /works
// on a fixed cadence; connection state derives from whether the poll succeeded.
// State is shared via useState so every caller reads one source (the topbar
// mounts once, but this keeps it single-source under HMR / future callers).
// Worker/work state changes on the order of seconds-to-minutes, so a 15s cadence
// keeps the bar fresh without hammering /works (fetched in full each poll).
const POLL_MS = 15000

function nowSec() {
  return Math.floor((globalThis.Date?.now?.() ?? 0) / 1000)
}

export function useTelemetry() {
  const api = useApi()
  const workers = useState<WorkerView[]>('telemetry:workers', () => [])
  const works = useState<WorkView[]>('telemetry:works', () => [])
  const online = useState<boolean>('telemetry:online', () => false)
  const ready = useState<boolean>('telemetry:ready', () => false) // first poll settled
  const lastSync = useState<number>('telemetry:lastSync', () => 0) // keys the heartbeat beat

  async function poll() {
    try {
      const [w, k] = await Promise.all([
        api<WorkersList>('/workers', { query: { size: 500 } }),
        api<WorkView[]>('/works'),
      ])
      workers.value = w.values ?? []
      works.value = k ?? []
      online.value = true
      lastSync.value = nowSec()
    } catch {
      online.value = false // keep last data as stale, flag the drop
    } finally {
      ready.value = true
    }
  }

  onMounted(() => {
    poll()
    const pollId = setInterval(poll, POLL_MS)
    onUnmounted(() => clearInterval(pollId))
  })

  const stats = computed(() => {
    const ws = workers.value
    const total = ws.length
    const onlineList = ws.filter(w => workerStateKind(w.state) !== 'idle')
    return {
      total,
      online: onlineList.length,
      offline: total - onlineList.length,
      running: works.value.filter(w => workStateKind(w.state) === 'run').length,
      failed: works.value.filter(w => workStateKind(w.state) === 'fail').length,
      // HID health is a last-reported value stored per worker. Only online
      // workers are counted — an offline worker's device state is stale, so
      // summing it would claim "healthy" for robots that aren't even connected.
      hidHealth: onlineList.reduce((s, w) => s + (w.hidHealthCount ?? 0), 0),
      hidTotal: onlineList.reduce((s, w) => s + (w.hidTotalCount ?? 0), 0),
    }
  })

  return { online, ready, lastSync, stats }
}
