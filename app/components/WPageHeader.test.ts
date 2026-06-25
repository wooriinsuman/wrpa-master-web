// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import WPageHeader from './WPageHeader.vue'

describe('WPageHeader', () => {
  it('renders title and emits add on button click', async () => {
    const el = await mountSuspended(WPageHeader, { props: { title: '보험사', addLabel: '+ 보험사 등록' } })
    expect(el.text()).toContain('보험사')
    await el.find('button.add').trigger('click')
    expect(el.emitted('add')).toBeTruthy()
  })
  it('emits update:search on input', async () => {
    const el = await mountSuspended(WPageHeader, { props: { title: 'x', addLabel: 'y', search: '' } })
    await el.find('input').setValue('삼성')
    expect(el.emitted('update:search')?.[0]).toEqual(['삼성'])
  })
})
