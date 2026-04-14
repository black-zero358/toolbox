import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSamePwdCompare } from '@/hooks/useSamePwdCompare'
import { ShieldAlert, AlertTriangle, Upload, Eye, EyeOff, Key, Copy, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SamePwdCompare() {
  const { duplicates, loading, error, processFile, stats } = useSamePwdCompare()
  const [showPwd, setShowPwd] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-950/50 flex flex-shrink-0 items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">高频密码雷达</h2>
          <p className="text-slate-500 text-sm mt-1">本地解析密码本导出文件，揪出您所有在复用的高危密码组合。</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 flex flex-col items-center text-center transition-colors hover:border-orange-500 dark:hover:border-orange-500/50">
         <input 
           type="file" 
           accept=".csv"
           className="hidden" 
           id="pwd-upload"
           onChange={e => {
             if (e.target.files?.[0]) processFile(e.target.files[0])
             e.target.value = ''
           }}
         />
         <label htmlFor="pwd-upload" className="cursor-pointer group flex flex-col items-center">
           <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl group-hover:bg-orange-100 text-slate-400 group-hover:text-orange-500 flex items-center justify-center transition-colors shadow-sm mb-4">
             <Upload className="w-6 h-6" />
           </div>
           <span className="font-bold text-slate-700 dark:text-slate-300">
             {loading ? '正在光速分析...' : '上传密码本 (仅限浏览器本地处理)'}
           </span>
         </label>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium border border-red-200 dark:border-red-900/50 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {stats.totalEntries > 0 && !loading && (
        <motion.div initial={{ y: 10 }} animate={{ y: 0 }} className="flex divide-x divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-2">
           <div className="px-6 py-3 items-center justify-center flex flex-col">
             <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">扫描总数</span>
             <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">{stats.totalEntries}</span>
           </div>
           <div className="px-6 py-3 items-center flex flex-col flex-1 pl-10 items-start!">
             <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 text-center w-full">发现的复用密码数 (组)</span>
             <span className={cn("text-2xl font-bold font-mono text-center w-full", stats.duplicatesFound > 0 ? "text-orange-500" : "text-green-500")}>
               {stats.duplicatesFound === 0 ? '全网无重叠，太牛了！' : stats.duplicatesFound}
             </span>
           </div>
        </motion.div>
      )}

      <div className="space-y-4">
        <AnimatePresence>
          {duplicates.map((group, idx) => (
            <motion.div 
              key={group.password}
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider",
                    group.strength === 'weak' ? "bg-red-100 text-red-600" : group.strength === 'medium' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                  )}>
                    {group.strength === 'weak' ? '极度危险' : group.strength === 'medium' ? '中等' : '强健'}
                  </span>
                  
                  <div className="flex items-center gap-2 group/pwd relative">
                    <Key className="w-4 h-4 text-slate-400" />
                    <span className="font-mono text-slate-900 dark:text-slate-100 font-bold tracking-widest text-lg">
                      {showPwd[group.password] ? group.password : '••••••••••••'.substring(0, Math.max(6, group.password.length))}
                    </span>
                    <button 
                      onClick={() => setShowPwd(p => ({...p, [group.password]: !p[group.password]}))}
                      className="text-slate-400 hover:text-slate-600 outline-none p-1"
                    >
                      {showPwd[group.password] ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                    </button>
                    <button 
                      onClick={() => handleCopy(group.password)}
                      className="text-slate-400 hover:text-blue-500 outline-none p-1"
                    >
                      {copied === group.password ? <CheckCircle2 className="w-4 h-4 text-green-500"/> : <Copy className="w-4 h-4"/>}
                    </button>
                  </div>
                </div>
                
                <div className="bg-orange-100 text-orange-600 dark:bg-orange-500/20 px-3 py-1 rounded-full text-xs font-bold">
                  复用了 {group.entries.length} 次
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.entries.map((entry, i) => (
                    <div key={i} className="flex flex-col p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate" title={entry.name}>{entry.name}</span>
                      <span className="text-xs text-slate-500 mt-1 truncate" title={entry.username}>{entry.username || '未设定账号'}</span>
                      <a href={entry.url.startsWith('http') ? entry.url : `https://${entry.url}`} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline mt-2 truncate max-w-full">
                        {entry.url || '无地址'}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  )
}
