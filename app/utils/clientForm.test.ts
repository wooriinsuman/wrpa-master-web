import { describe, it, expect } from 'vitest'
import { toCreateClientRequest, type ClientForm } from './clientForm'
const base: ClientForm = { name: '로앤손해사정', code: 'LA-01', phone: '02-1', leaderName: '김도현', businessRegistrationNumber: '114-86-22910' }
describe('clientForm', () => {
  it('maps required + optional fields', () => {
    expect(toCreateClientRequest(base)).toEqual({ name: '로앤손해사정', code: 'LA-01', phone: '02-1', leaderName: '김도현', businessRegistrationNumber: '114-86-22910' })
  })
  it('throws when name or code empty', () => {
    expect(() => toCreateClientRequest({ ...base, name: ' ' })).toThrow()
    expect(() => toCreateClientRequest({ ...base, code: '' })).toThrow()
  })
})
