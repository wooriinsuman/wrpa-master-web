// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref, defineComponent, h } from 'vue'
import { useCrudPage, type CrudPageController } from './useCrudPage'

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: pushMock }))

interface Ent { id: string; name: string }
interface Frm { name: string }
interface Row { id: string; name: string }

function makeResource(list: Ent[]) {
  return {
    list: vi.fn().mockResolvedValue(list),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    remove: vi.fn().mockResolvedValue({}),
  }
}

async function mountWith(resource: ReturnType<typeof makeResource>, key: string) {
  let ctl: CrudPageController<Frm, Row>
  const Host = defineComponent({
    async setup() {
      ctl = await useCrudPage<Ent, Frm, Row>({
        key,
        resource,
        blank: () => ({ name: '' }),
        toRow: (e: Ent) => ({ id: e.id, name: e.name }),
        toForm: (e: Ent) => ({ name: e.name }),
        searchKeys: ['name'],
      })
      return () => h('div')
    },
  })
  await mountSuspended(Host)
  return ctl!
}

describe('useCrudPage', () => {
  it('maps the list through toRow into rows', async () => {
    const ctl = await mountWith(makeResource([{ id: '1', name: 'A' }]), 't-rows')
    expect(ctl.rows.value).toEqual([{ id: '1', name: 'A' }])
  })

  it('openCreate opens the drawer with a blank form', async () => {
    const ctl = await mountWith(makeResource([]), 't-create-open')
    ctl.openCreate()
    expect(ctl.drawerOpen.value).toBe(true)
    expect(ctl.editingId.value).toBe(null)
    expect(ctl.form.value).toEqual({ name: '' })
  })

  it('save() in create mode calls create, closes, toasts created', async () => {
    const r = makeResource([])
    const ctl = await mountWith(r, 't-create-save')
    ctl.openCreate()
    ctl.form.value = { name: 'New' }
    await ctl.save()
    expect(r.create).toHaveBeenCalledWith({ name: 'New' })
    expect(ctl.drawerOpen.value).toBe(false)
    expect(pushMock).toHaveBeenCalledWith('등록되었습니다.', 'success')
  })

  it('openEdit maps the entity through toForm and save() updates', async () => {
    const r = makeResource([{ id: '7', name: 'Old' }])
    const ctl = await mountWith(r, 't-edit')
    ctl.openEdit({ id: '7', name: 'Old' })
    expect(ctl.editingId.value).toBe('7')
    expect(ctl.form.value).toEqual({ name: 'Old' })
    await ctl.save()
    expect(r.update).toHaveBeenCalledWith('7', { name: 'Old' })
    expect(pushMock).toHaveBeenCalledWith('수정되었습니다.', 'success')
  })

  it('remove() calls resource.remove and toasts removed', async () => {
    const r = makeResource([{ id: '1', name: 'A' }])
    const ctl = await mountWith(r, 't-remove')
    await ctl.remove({ id: '1', name: 'A' })
    expect(r.remove).toHaveBeenCalledWith('1')
    expect(pushMock).toHaveBeenCalledWith('삭제되었습니다.', 'success')
  })

  it('openEdit is a no-op when toForm is absent', async () => {
    const r = makeResource([{ id: '1', name: 'A' }])
    let ctl: CrudPageController<Frm, Row>
    const Host = defineComponent({
      async setup() {
        ctl = await useCrudPage<Ent, Frm, Row>({
          key: 't-noedit',
          resource: r,
          blank: () => ({ name: '' }),
          toRow: (e: Ent) => ({ id: e.id, name: e.name }),
          searchKeys: ['name'],
        })
        return () => h('div')
      },
    })
    await mountSuspended(Host)
    ctl!.openEdit({ id: '1', name: 'A' })
    expect(ctl!.drawerOpen.value).toBe(false)
    expect(ctl!.editingId.value).toBe(null)
  })

  it('save() resets editingId to null after a successful edit', async () => {
    const r = makeResource([{ id: '7', name: 'Old' }])
    const ctl = await mountWith(r, 't-edit-reset')
    ctl.openEdit({ id: '7', name: 'Old' })
    expect(ctl.editingId.value).toBe('7')
    await ctl.save()
    expect(r.update).toHaveBeenCalledWith('7', { name: 'Old' })
    expect(ctl.editingId.value).toBe(null)
    expect(pushMock).toHaveBeenCalledWith('수정되었습니다.', 'success')
  })

  it('save() toasts the fallback copy and keeps the drawer open when create rejects', async () => {
    const r = makeResource([])
    r.create.mockRejectedValue(new Error('서버 오류'))
    const ctl = await mountWith(r, 't-save-fail')
    ctl.openCreate()
    ctl.form.value = { name: 'X' }
    await ctl.save()
    expect(pushMock).toHaveBeenCalledWith('저장에 실패했습니다.', 'error')
    expect(ctl.drawerOpen.value).toBe(true)
  })

  it('remove() toasts the fallback copy when remove rejects with a plain Error', async () => {
    const r = makeResource([{ id: '1', name: 'A' }])
    r.remove.mockRejectedValue(new Error('nope'))
    const ctl = await mountWith(r, 't-remove-fail')
    await ctl.remove({ id: '1', name: 'A' })
    expect(pushMock).toHaveBeenCalledWith('삭제에 실패했습니다.', 'error')
  })

  it('remove() falls back to the caller copy for a generic code instead of surfacing the backend message', async () => {
    const r = makeResource([{ id: '1', name: 'A' }])
    r.remove.mockRejectedValue({ data: { error: { code: 'conflict', message: '작업파일이 참조 중이라 삭제할 수 없습니다' } } })
    const ctl = await mountWith(r, 't-remove-fail-envelope')
    await ctl.remove({ id: '1', name: 'A' })
    expect(pushMock).toHaveBeenCalledWith('삭제에 실패했습니다.', 'error')
  })
})
