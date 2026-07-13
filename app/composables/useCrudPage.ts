import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { filterRows, type CrudResource, type CrudRow } from '~/utils/crud'
import { extractApiError } from '~/utils/apiError'

export interface CrudMessages {
  created: string
  updated: string
  removed: string
  saveFailed: string
  removeFailed: string
}

const DEFAULT_MESSAGES: CrudMessages = {
  created: '등록되었습니다.',
  updated: '수정되었습니다.',
  removed: '삭제되었습니다.',
  saveFailed: '저장에 실패했습니다.',
  removeFailed: '삭제에 실패했습니다.',
}

export interface CrudPageConfig<Entity extends { id: string }, Form, Row extends CrudRow> {
  key: string
  resource: CrudResource<Entity, Form>
  blank: () => Form
  toRow: (e: Entity) => Row
  searchKeys: (keyof Row)[]
  toForm?: (e: Entity) => Form
  messages?: Partial<CrudMessages>
}

export interface CrudPageController<Form, Row extends CrudRow> {
  rows: ComputedRef<Row[]>
  search: Ref<string>
  pending: Ref<boolean>
  drawerOpen: Ref<boolean>
  editingId: Ref<string | null>
  form: Ref<Form>
  openCreate: () => void
  openEdit: (row: Row) => void
  save: () => Promise<void>
  remove: (row: Row) => Promise<void>
  refresh: () => Promise<void>
}

export async function useCrudPage<Entity extends { id: string }, Form, Row extends CrudRow>(
  config: CrudPageConfig<Entity, Form, Row>,
): Promise<CrudPageController<Form, Row>> {
  const { push } = useToast()
  const msg = { ...DEFAULT_MESSAGES, ...config.messages }
  const { data, refresh, pending } = await useAsyncData(config.key, () => config.resource.list())

  const search = ref('')
  const drawerOpen = ref(false)
  const editingId = ref<string | null>(null)
  const form = ref(config.blank()) as Ref<Form>

  const rows = computed(() => filterRows((data.value ?? []).map(config.toRow), search.value, config.searchKeys))

  function openCreate() {
    editingId.value = null
    form.value = config.blank()
    drawerOpen.value = true
  }

  function openEdit(row: Row) {
    if (!config.toForm) return
    const entity = (data.value ?? []).find(e => e.id === row.id)
    if (!entity) return
    editingId.value = row.id
    form.value = config.toForm(entity)
    drawerOpen.value = true
  }

  async function save() {
    try {
      const editing = editingId.value
      if (editing && config.resource.update) await config.resource.update(editing, form.value)
      else await config.resource.create(form.value)
      drawerOpen.value = false
      editingId.value = null
      await refresh()
      push(editing ? msg.updated : msg.created, 'success')
    } catch (e: any) {
      push(extractApiError(e, msg.saveFailed), 'error')
    }
  }

  async function remove(row: Row) {
    try {
      await config.resource.remove(row.id)
      await refresh()
      push(msg.removed, 'success')
    } catch (e: any) {
      push(extractApiError(e, msg.removeFailed), 'error')
    }
  }

  return {
    rows,
    search,
    pending: pending as Ref<boolean>,
    drawerOpen,
    editingId,
    form,
    openCreate,
    openEdit,
    save,
    remove,
    refresh,
  }
}
