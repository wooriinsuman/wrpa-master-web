import { describe, it, expect } from 'vitest'
import { buildFileTree } from './fileTree'

describe('buildFileTree', () => {
  it('nests paths into folders with aggregate counts/sizes', () => {
    const t = buildFileTree({
      '삼성화재/defaults/로그인/_sign.png': { size: 10 },
      '삼성화재/defaults/로그인/click.js': { size: 5 },
      '삼성화재/popups/a.png': { size: 3 },
      'root.txt': { size: 1 },
    })
    expect(t.fileCount).toBe(4)
    expect(t.totalSize).toBe(19)
    // root: one dir (삼성화재) + one loose file (root.txt); dirs before files
    expect(t.dirs.map(d => d.name)).toEqual(['삼성화재'])
    expect(t.files.map(f => f.name)).toEqual(['root.txt'])

    const samsung = t.dirs[0]!
    expect(samsung.fileCount).toBe(3)
    expect(samsung.totalSize).toBe(18)
    expect(samsung.dirs.map(d => d.name)).toEqual(['defaults', 'popups'])

    const login = samsung.dirs.find(d => d.name === 'defaults')!.dirs[0]!
    expect(login.name).toBe('로그인')
    expect(login.files.map(f => f.name)).toEqual(['_sign.png', 'click.js'])
    expect(login.files[0]!.path).toBe('삼성화재/defaults/로그인/_sign.png')
  })

  it('handles an empty manifest', () => {
    const t = buildFileTree({})
    expect(t.fileCount).toBe(0)
    expect(t.dirs).toEqual([])
    expect(t.files).toEqual([])
  })
})
