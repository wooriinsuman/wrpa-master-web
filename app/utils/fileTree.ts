// 매니페스트의 평면 경로 맵(path → {size})을 폴더 트리로 변환한다.
// 대량 파일에도 O(전체 경로 세그먼트 수)로 동작하도록 빌드 시 Map을 쓰고,
// 마지막에 정렬된 배열 + 폴더별 집계(파일수·총크기)로 확정한다.

export interface TreeFile {
  name: string
  path: string
  size: number
}
export interface TreeDir {
  name: string
  path: string
  dirs: TreeDir[]
  files: TreeFile[]
  fileCount: number // 하위 전체 파일 수
  totalSize: number // 하위 전체 크기
}

interface BuildDir {
  name: string
  path: string
  dirs: Map<string, BuildDir>
  files: TreeFile[]
}

export function buildFileTree(files: Record<string, { size: number }>): TreeDir {
  const root: BuildDir = { name: '', path: '', dirs: new Map(), files: [] }
  for (const path in files) {
    const size = files[path]?.size ?? 0
    const parts = path.split('/')
    let node = root
    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i]!
      let child = node.dirs.get(seg)
      if (!child) {
        child = { name: seg, path: node.path ? `${node.path}/${seg}` : seg, dirs: new Map(), files: [] }
        node.dirs.set(seg, child)
      }
      node = child
    }
    node.files.push({ name: parts[parts.length - 1]!, path, size })
  }
  return finalize(root)
}

// 폴더 먼저(가나다), 그다음 파일(가나다). 집계는 후위 순회로 계산.
function finalize(b: BuildDir): TreeDir {
  const dirs = [...b.dirs.values()].map(finalize).sort((a, z) => a.name.localeCompare(z.name, 'ko'))
  const files = b.files.slice().sort((a, z) => a.name.localeCompare(z.name, 'ko'))
  let fileCount = files.length
  let totalSize = files.reduce((s, f) => s + f.size, 0)
  for (const d of dirs) {
    fileCount += d.fileCount
    totalSize += d.totalSize
  }
  return { name: b.name, path: b.path, dirs, files, fileCount, totalSize }
}
