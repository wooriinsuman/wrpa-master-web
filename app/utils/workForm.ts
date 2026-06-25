import type { components } from '#shared/types/api'

type EnqueueWorkRequest = components['schemas']['EnqueueWorkRequest']

export interface WorkForm {
  company: string
  tasksText: string
  parametersText: string
  lifetimeText: string
}

export function blankWorkForm(): WorkForm {
  return { company: '', tasksText: '', parametersText: '', lifetimeText: '' }
}

export function splitTasks(text: string): string[] {
  return text.split(',').map(s => s.trim()).filter(Boolean)
}

export function toEnqueueWorkRequest(f: WorkForm): EnqueueWorkRequest {
  const company = f.company.trim()
  if (!company) throw new Error('보험사 코드를 입력하세요.')
  const req: EnqueueWorkRequest = { company }

  const tasks = splitTasks(f.tasksText)
  if (tasks.length) req.tasks = tasks

  const p = f.parametersText.trim()
  if (p) {
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(p)
    } catch {
      throw new Error('파라미터가 올바른 JSON이 아닙니다.')
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('파라미터는 JSON 객체여야 합니다.')
    }
    req.parameters = parsed
  }

  const lt = f.lifetimeText.trim()
  if (lt) {
    const n = Number(lt)
    if (!Number.isFinite(n) || n <= 0) throw new Error('실행 시간(ms)은 양수여야 합니다.')
    req.lifetime = n
  }

  return req
}
