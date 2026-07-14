// done: 이번 개편에서 정비 완료한 메뉴 — 사이드바에서 배경색으로 구분 표시.
export interface NavItem { id: string; code: string; label: string; route: string; done?: boolean }
export interface NavGroup { label: string; items: NavItem[] }

// Top-level sidebar grouping. Order here drives both the grouped sidebar and the
// derived flat NAV below.
export const NAV_GROUPS: NavGroup[] = [
  {
    label: '관제',
    items: [
      { id: 'dashboard', code: 'DB', label: '대시보드', route: '/' },
      { id: 'jobs', code: 'JB', label: '진행 작업', route: '/jobs' },
      { id: 'schedulequeue', code: 'SQ', label: '작업 큐', route: '/schedule-queue' },
    ],
  },
  {
    label: '기준정보',
    items: [
      { id: 'insurers', code: 'IN', label: '보험사', route: '/insurers', done: true },
      { id: 'clients', code: 'CL', label: '회사', route: '/clients', done: true },
      { id: 'accounts', code: 'AC', label: '계정', route: '/accounts', done: true },
      { id: 'datatypes', code: 'DT', label: '데이터 유형', route: '/data-types', done: true },
      { id: 'workfiles', code: 'WF', label: '작업 파일', route: '/workfiles', done: true },
    ],
  },
  {
    label: '스케줄링',
    items: [
      { id: 'holidays', code: 'HD', label: '휴일', route: '/holidays', done: true },
      { id: 'orderpolicies', code: 'OP', label: '우선순위 정책', route: '/order-policies' },
      { id: 'schedules', code: 'SC', label: '작업 일정', route: '/schedules', done: true },
    ],
  },
  {
    label: '시스템',
    items: [
      { id: 'workers', code: 'WK', label: '워커', route: '/workers', done: true },
      { id: 'packages', code: 'PK', label: '패키지', route: '/packages', done: true },
      { id: 'users', code: 'US', label: '사용자', route: '/users' },
    ],
  },
]

// Flat list (group order preserved) — used by tests and any flat consumers.
export const NAV: NavItem[] = NAV_GROUPS.flatMap(g => g.items)
