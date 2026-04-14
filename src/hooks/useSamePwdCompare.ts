import { useState, useCallback } from 'react'
import { parseCsvFile, type PasswordEntry } from '../core/password-engine/csvParser'

export interface DuplicateGroup {
  password: string
  entries: PasswordEntry[]
  strength?: 'high' | 'medium' | 'weak'
}

export function useSamePwdCompare() {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [stats, setStats] = useState({ totalEntries: 0, duplicatesFound: 0 })

  const _checkStrength = (pwd: string) => {
    if (pwd.length < 8) return 'weak'
    if (/^[0-9]+$/.test(pwd) || /^[a-z]+$/.test(pwd)) return 'weak'
    if (pwd.length > 12 && /[A-Z]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) return 'high'
    return 'medium'
  }

  const processFile = useCallback(async (file: File) => {
    setLoading(true)
    setError('')
    try {
      const entries = await parseCsvFile(file)
      
      const pwdMap = new Map<string, PasswordEntry[]>()
      entries.forEach(entry => {
        if (!pwdMap.has(entry.password)) pwdMap.set(entry.password, [])
        pwdMap.get(entry.password)!.push(entry)
      })

      const duplicateGroups: DuplicateGroup[] = []
      pwdMap.forEach((entryList, pwd) => {
        if (entryList.length > 1) {
          duplicateGroups.push({ password: pwd, entries: entryList, strength: _checkStrength(pwd) })
        }
      })
      
      duplicateGroups.sort((a, b) => b.entries.length - a.entries.length)
      setDuplicates(duplicateGroups)
      setStats({
        totalEntries: entries.length,
        duplicatesFound: duplicateGroups.length
      })

    } catch (err: any) {
      setError(err.message || '未知错误')
      setDuplicates([])
      setStats({totalEntries: 0, duplicatesFound: 0})
    }
    setLoading(false)
  }, [])

  return { duplicates, loading, error, processFile, stats }
}
