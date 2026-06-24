import type { components } from './api'
type Worker = components['schemas']['WorkerView']
const _check: Worker['state'] extends string ? true : false = true
export {}
