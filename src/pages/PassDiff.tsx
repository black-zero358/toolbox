import { useState } from 'react'
import { motion } from 'framer-motion'
import { usePassDiff } from '@/hooks/usePassDiff'
import { Files, Upload, AlertTriangle, ArrowRight, Check, Plus, Minus, FileWarning } from 'lucide-react'
import { cn } from '@/lib/utils'
import { List } from 'react-window'

export default function PassDiff() {
  const { results, loading, error, compare, stats } = usePassDiff()
  const [oldFile, setOldFile] = useState<File | null>(null)
  const [newFile, setNewFile] = useState<File | null>(null)

  const handleCompare = () => {
    if (oldFile && newFile) {
      compare(oldFile, newFile)
    }
  }

  const renderRow = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const item = results[index]
    if (!item) return null

    const typeConfig = {
      added: { icon: Plus, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50', text: '新增条目' },
      removed: { icon: Minus, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50', text: '已删除' },
      modified: { icon: FileWarning, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50', text: '内容已变更' },
      unchanged: { icon: Check, color: 'text-slate-400', bg: 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800', text: '未变更' }
    }

    const conf = typeConfig[item.type]
    const Icon = conf.icon

    return (
      <div style={{ ...style, height: (style.height as number) - 8 }} className={cn("rounded-xl border flex flex-col justify-center px-6 overflow-hidden", conf.bg)}>
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3 w-1/3">
             <div className={cn("p-1.5 rounded-full bg-white dark:bg-slate-950 shadow-sm", conf.color)}>
               <Icon className="w-4 h-4" />
             </div>
             <div>
               <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{item.entry.name}</p>
               <p className="text-xs text-slate-500 truncate">{item.entry.username}</p>
             </div>
           </div>

           <div className="flex-1 px-4 flex items-center justify-center">
              {item.type === 'modified' ? (
                 <div className="flex items-center gap-4 text-xs font-mono w-full justify-center">
                   <div className="flex-1 p-2 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-lg max-w-[200px] truncate line-through opacity-70 border border-red-200 dark:border-red-900/30 text-center">
                     {item.oldEntry?.password}
                   </div>
                   <ArrowRight className="w-4 h-4 text-slate-300" />
                   <div className="flex-1 p-2 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-lg max-w-[200px] truncate border border-green-200 dark:border-green-900/30 text-center">
                     {item.entry.password}
                   </div>
                 </div>
              ) : item.type === 'unchanged' ? (
                <span className="text-xs text-slate-400">••••••••</span>
              ) : (
                <div className={cn("text-xs font-mono px-3 py-1.5 rounded-md", item.type === 'added' ? 'bg-emerald-100/50 text-emerald-600' : 'bg-red-100/50 text-red-600')}>
                  {item.entry.password}
                </div>
              )}
           </div>

           <div className="w-24 text-right">
             <span className={cn("text-[10px] font-bold uppercase tracking-widest", conf.color)}>
               {conf.text}
             </span>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 h-full flex flex-col pb-6">
      <div className="flex items-center gap-4 border-b border-border pb-6 flex-shrink-0">
        <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 flex items-center flex-shrink-0 justify-center">
          <Files className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">密码账本比对器</h2>
          <p className="text-slate-500 text-sm mt-1">对比两份导出的密码 CSV (例如旧手机和新手机)，找出修改、新增和被莫名删除的密码数据。</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-shrink-0">
        {[
          { label: '旧密码本 (A)', file: oldFile, setter: setOldFile },
          { label: '新密码本 (B)', file: newFile, setter: setNewFile }
        ].map((block, i) => (
           <label key={i} className="cursor-pointer">
             <input 
               type="file" accept=".csv" className="hidden" 
               onChange={e => block.setter(e.target.files?.[0] || null)}
             />
             <div className={cn(
               "h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all",
               block.file ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-400"
             )}>
                {!block.file ? (
                   <>
                     <Upload className="w-5 h-5 text-slate-400 mb-2" />
                     <span className="text-sm font-bold text-slate-500">点击上传 {block.label}</span>
                   </>
                ) : (
                   <>
                     <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center mb-1 shadow-sm"><Check className="w-4 h-4"/></div>
                     <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 truncate max-w-[80%]">{block.file.name}</span>
                   </>
                )}
             </div>
           </label>
        ))}
      </div>

      {oldFile && newFile && results.length === 0 && !loading && (
        <motion.button 
          initial={{ y: -10 }} animate={{ y: 0 }}
          onClick={handleCompare}
          className="w-full h-12 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl shadow-lg border-b-4 border-indigo-700 flex items-center justify-center gap-2 transform active:border-b-0 active:translate-y-1 transition-all"
        >
          开始硬核比对
        </motion.button>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-200">
          <AlertTriangle className="w-5 h-5 inline mr-2" /> {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
           <div className="flex bg-slate-50 dark:bg-slate-950 p-4 justify-around text-center border-b border-border text-sm">
             <div className="flex flex-col"><span className="text-slate-400 font-bold uppercase text-[10px]">旧版数据</span><span className="font-mono font-bold text-slate-700 dark:text-slate-200">{stats.oldTotal}</span></div>
             <div className="flex flex-col"><span className="text-slate-400 font-bold uppercase text-[10px]">新版数据</span><span className="font-mono font-bold text-slate-700 dark:text-slate-200">{stats.newTotal}</span></div>
             <div className="flex flex-col"><span className="text-emerald-500 font-bold uppercase text-[10px]">检测到新增</span><span className="font-mono font-bold text-emerald-600">+{stats.added}</span></div>
             <div className="flex flex-col"><span className="text-orange-500 font-bold uppercase text-[10px]">检测到修改</span><span className="font-mono font-bold text-orange-600">~{stats.modified}</span></div>
             <div className="flex flex-col"><span className="text-red-500 font-bold uppercase text-[10px]">无端丢失</span><span className="font-mono font-bold text-red-600">-{stats.removed}</span></div>
           </div>
           
           <div className="flex-1 w-full bg-slate-50/50 dark:bg-slate-900 p-4">
             {/* 虚拟列表实现百万人级别数据无卡顿渲染 */}
             {/* @ts-ignore */}
             <List
               style={{ height: 500, width: "100%" }}
               rowCount={results.length}
               rowHeight={80}
               className="custom-scrollbar"
               rowComponent={renderRow}
             />
           </div>
        </div>
      )}

    </div>
  )
}
