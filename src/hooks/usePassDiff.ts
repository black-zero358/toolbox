import { useState, useCallback } from 'react'
import { parseCsvFile, type PasswordEntry } from '../core/password-engine/csvParser'

export type DiffType = 'added' | 'removed' | 'modified' | 'unchanged'

export interface PassDiffResult {
  id: string
  entry: PasswordEntry
  oldEntry?: PasswordEntry
  type: DiffType
}

export function usePassDiff() {
  const [results, setResults] = useState<PassDiffResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [stats, setStats] = useState({ oldTotal: 0, newTotal: 0, added: 0, removed: 0, modified: 0 })
  
  const compare = useCallback(async (oldFile: File, newFile: File) => {
    setLoading(true)
    setError('')
    try {
      const oldEntries = await parseCsvFile(oldFile)
      const newEntries = await parseCsvFile(newFile)
      
      // Standardizing comparison key across standard password managers
      const genKey = (e: PasswordEntry) => `${e.name?.trim().toLowerCase()}|||${e.username?.trim().toLowerCase()}`
      
      const oldMap = new Map<string, PasswordEntry>()
      oldEntries.forEach(e => oldMap.set(genKey(e), e))
      
      const res: PassDiffResult[] = []
      let added = 0, removed = 0, modified = 0
      let idx = 0
      
      newEntries.forEach(newE => {
        const key = genKey(newE)
        if (oldMap.has(key)) {
          const oldE = oldMap.get(key)!
          if (oldE.password !== newE.password || oldE.url !== newE.url) {
            res.push({ id: `d_${idx++}`, entry: newE, oldEntry: oldE, type: 'modified' })
            modified++
          } else {
            res.push({ id: `d_${idx++}`, entry: newE, type: 'unchanged' })
          }
          oldMap.delete(key)
        } else {
          res.push({ id: `d_${idx++}`, entry: newE, type: 'added' })
          added++
        }
      })
      
      oldMap.forEach(oldE => {
        res.push({ id: `d_${idx++}`, entry: oldE, type: 'removed' })
        removed++
      })
      
      // Sort by status: Added/Removed/Modified first, then unchanged
      const statusWeight = { modified: 1, added: 2, removed: 3, unchanged: 4 }
      res.sort((a, b) => statusWeight[a.type] - statusWeight[b.type] || a.entry.name.localeCompare(b.entry.name))
      
      setResults(res)
      setStats({
        oldTotal: oldEntries.length,
        newTotal: newEntries.length,
        added, removed, modified
      })
    } catch (e: any) {
      setError(e.message || '未知错误，无法比对文件格式')
    }
    setLoading(false)
  }, [])
  
  return { results, loading, error, compare, stats }
}
