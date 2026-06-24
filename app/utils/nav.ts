export interface NavItem { id: string; code: string; label: string; route: string }
export const NAV: NavItem[] = [
  { id: 'dashboard', code: 'DB', label: '대시보드', route: '/' },
  { id: 'insurers',  code: 'IN', label: '보험사',   route: '/insurers' },
  { id: 'clients',   code: 'CL', label: '거래처',   route: '/clients' },
  { id: 'accounts',  code: 'AC', label: '계정',     route: '/accounts' },
  { id: 'workfiles', code: 'WF', label: '작업 파일', route: '/workfiles' },
  { id: 'schedules', code: 'SC', label: '작업 일정', route: '/schedules' },
  { id: 'jobs',      code: 'JB', label: '진행 작업', route: '/jobs' },
  { id: 'workers',   code: 'WK', label: '워커',      route: '/workers' },
  { id: 'packages',  code: 'PK', label: '패키지',    route: '/packages' },
  { id: 'users',     code: 'US', label: '사용자',    route: '/users' },
]
