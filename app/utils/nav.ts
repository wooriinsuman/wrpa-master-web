import { RANK_USER, RANK_ADMIN, RANK_SYSTEM } from '~/utils/roles'

// done: 이번 개편에서 정비 완료한 메뉴 — 사이드바에서 배경색으로 구분 표시.
// minRank: 이 랭크 미만인 사용자에게는 메뉴/라우트를 숨긴다(백엔드가 최종
// 검증하며, 이건 UX용 프런트 게이팅). 생략 시 RANK_USER(모든 로그인 사용자)로 취급.
export interface NavItem { id: string; code: string; label: string; route: string; done?: boolean; minRank?: number }
export interface NavGroup { label: string; items: NavItem[] }

// Top-level sidebar grouping. Order here drives both the grouped sidebar and the
// derived flat NAV below.
export const NAV_GROUPS: NavGroup[] = [
  {
    label: '관제',
    items: [
      // 대시보드는 리다이렉트 안전지대 — 역할이 없는(rank 0) 사용자도 반드시 접근 가능해야
      // 라우트 가드가 self-redirect 루프에 빠지지 않는다. 따라서 minRank 0(전원).
      { id: 'dashboard', code: 'DB', label: '대시보드', route: '/', minRank: 0 },
      // 진행 작업 = /works 모니터링, 백엔드에서 /works는 SYSTEM 전용 → 메뉴도 SYSTEM.
      { id: 'jobs', code: 'JB', label: '진행 작업', route: '/jobs', minRank: RANK_SYSTEM },
      { id: 'schedulequeue', code: 'SQ', label: '작업 큐', route: '/schedule-queue', minRank: RANK_USER },
    ],
  },
  {
    label: '기준정보',
    items: [
      { id: 'insurers', code: 'IN', label: '보험사', route: '/insurers', done: true, minRank: RANK_SYSTEM },
      { id: 'clients', code: 'CL', label: '회사', route: '/clients', done: true, minRank: RANK_SYSTEM },
      { id: 'accounts', code: 'AC', label: '계정', route: '/accounts', done: true, minRank: RANK_USER },
      { id: 'datatypes', code: 'DT', label: '데이터 유형', route: '/data-types', done: true, minRank: RANK_SYSTEM },
      { id: 'workfiles', code: 'WF', label: '작업 파일', route: '/workfiles', done: true, minRank: RANK_SYSTEM },
    ],
  },
  {
    label: '스케줄링',
    items: [
      { id: 'holidays', code: 'HD', label: '휴일', route: '/holidays', done: true, minRank: RANK_SYSTEM },
      { id: 'orderpolicies', code: 'OP', label: '우선순위 정책', route: '/order-policies', done: true, minRank: RANK_USER },
      { id: 'schedules', code: 'SC', label: '작업 일정', route: '/schedules', done: true, minRank: RANK_ADMIN },
    ],
  },
  {
    label: '시스템',
    items: [
      { id: 'workers', code: 'WK', label: '워커', route: '/workers', done: true, minRank: RANK_SYSTEM },
      { id: 'packages', code: 'PK', label: '패키지', route: '/packages', done: true, minRank: RANK_SYSTEM },
      { id: 'users', code: 'US', label: '사용자', route: '/users', minRank: RANK_SYSTEM },
    ],
  },
]

// Flat list (group order preserved) — used by tests and any flat consumers.
export const NAV: NavItem[] = NAV_GROUPS.flatMap(g => g.items)
