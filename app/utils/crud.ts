export interface CrudRow {
  id: string
}

export interface CrudResource<Entity, Form> {
  list: () => Promise<Entity[]>
  create: (f: Form) => Promise<unknown>
  update?: (id: string, f: Form) => Promise<unknown>
  remove: (id: string) => Promise<unknown>
}

export function filterRows<Row extends CrudRow>(rows: Row[], query: string, keys: (keyof Row)[]): Row[] {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter(r => keys.some(k => String(r[k] ?? '').toLowerCase().includes(q)))
}
