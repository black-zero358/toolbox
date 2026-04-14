import Papa from 'papaparse'

export interface PasswordEntry {
  name: string
  url: string // login_uri
  username: string // login_username
  password: string // login_password
  folder?: string
}

export function parseCsvFile(file: File): Promise<PasswordEntry[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      error: (error: Error) => {
        reject(error)
      },
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          return reject(new Error('CSV 似乎为空或无法识别'))
        }
        
        // Check if required headers exist. Papaparse makes headers properties
        const firstRow = results.data[0] as Record<string, string>
        const hasRequired = ('login_password' in firstRow || 'password' in firstRow)

        if (!hasRequired) {
          return reject(new Error('未找到密码列此不支持的数据格式 (需类似 Bitwarden 导出)'))
        }

        const entries: PasswordEntry[] = (results.data as any[]).map(row => ({
          name: row.name || '未命名',
          url: row.login_uri || row.url || '',
          username: row.login_username || row.username || '',
          password: row.login_password || row.password || '',
          folder: row.folder || ''
        })).filter(val => val.password.trim() !== '')

        resolve(entries)
      }
    })
  })
}
