import type { components } from '#shared/types/api'

type CreateWorkerRequest = components['schemas']['CreateWorkerRequest']

export interface WorkerForm {
  name: string
  type: string
  tagsText: string
  shared: boolean
}

export function blankWorkerForm(): WorkerForm {
  return { name: '', type: '', tagsText: '', shared: false }
}

export function splitTags(text: string): string[] {
  return text.split(',').map(s => s.trim()).filter(Boolean)
}

export function toWorkerRequest(f: WorkerForm): CreateWorkerRequest {
  const name = f.name.trim()
  if (!name) throw new Error('이름을 입력하세요.')
  const type = f.type.trim()
  if (!type) throw new Error('유형을 입력하세요.')

  const req: CreateWorkerRequest = { name, type, shared: f.shared }
  const tags = splitTags(f.tagsText)
  if (tags.length) req.tags = tags
  return req
}
