import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useImageTool } from '@/hooks/useImageTool'
import { UploadCloud, Image as ImageIcon, FileText, Settings2, Download, Trash2, Zap, PlayCircle, Plus, Sparkles, Loader2, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ImageProcessor() {
  const { items, options, setOptions, isProcessing, predictedSize, addFiles, removeItem, clearAllItems, processAll, downloadAll } = useImageTool()

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }, [addFiles])

  const hasItems = items.length > 0
  const isAllDone = items.length > 0 && items.every(i => i.status === 'done')
  const hasPdf = items.some(i => i.type === 'pdf')

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-full max-w-[90rem] mx-auto items-start">
      
      {/* 左侧控制栏 */}
      <motion.div 
        initial={{ x: -20 }}
        animate={{ x: 0 }}
        className="w-full xl:w-[320px] shrink-0 sticky top-24"
      >
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white flex items-center justify-center shadow-lg">
              <Settings2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">输出调控</h2>
          </div>

          <div className="space-y-6">
             {/* 格式选择 */}
             <div className="space-y-3">
               <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">目标格式</label>
               <div className="grid grid-cols-3 gap-2">
                 {(['webp', 'png', 'jpeg'] as const).map(fmt => (
                   <button
                     key={fmt}
                     onClick={() => setOptions({ ...options, format: fmt })}
                     className={cn(
                       "py-2.5 rounded-xl text-sm font-medium transition-all",
                       options.format === fmt 
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md transform scale-[1.02]" 
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50"
                     )}
                   >
                     {fmt.toUpperCase()}
                   </button>
                 ))}
               </div>
             </div>

             {/* 压缩比率 */}
             <div className={cn("space-y-3 transition-opacity duration-300", options.format === 'png' ? 'opacity-40 pointer-events-none' : 'opacity-100')}>
               <div className="flex justify-between items-center">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">质量压缩率</label>
                 <span className="text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                   {Math.round(options.quality * 100)}%
                 </span>
               </div>
               <input 
                  type="range" min="0.1" max="1" step="0.05" 
                  value={options.quality} 
                  onChange={e => setOptions({...options, quality: parseFloat(e.target.value)})}
                  className="w-full accent-blue-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
               />
               <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                 <span>极致压缩</span>
                 <span>无损优先</span>
               </div>
             </div>

            {/* 高清缩放倍率 - 针对 PDF */}
             <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
               <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                 PDF 解析 DPI 缩放
                 <span title="数值越大，渲染越精细，但速度下降"><Zap className="w-3.5 h-3.5 text-amber-500" /></span>
               </label>
               <select 
                 value={options.scale}
                 onChange={e => setOptions({...options, scale: parseFloat(e.target.value)})}
                 className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow appearance-none cursor-pointer"
               >
                  <option value={1}>1.0x (快速, 文档及草稿)</option>
                  <option value={2}>2.0x (高清, Retina 屏幕推荐)</option>
                  <option value={3}>3.0x (超清, 支持文档打印)</option>
                  <option value={4}>4.0x (极高画质)</option>
               </select>
             </div>

             <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">宽度上限拦截 (可选)</label>
                <div className="relative">
                  <input 
                    type="number"
                    placeholder="输入最大像素, eg: 1920"
                    value={options.maxWidth || ''}
                    onChange={e => setOptions({...options, maxWidth: e.target.value ? parseInt(e.target.value) : undefined})}
                    className="w-full h-11 pl-4 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">PX</span>
                </div>
             </div>

             {hasPdf && (
               <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                   多页 PDF 拼接模式
                 </label>
                 <label className="flex items-center gap-3 cursor-pointer group">
                   <div className="relative">
                     <input type="checkbox" className="sr-only" checked={options.stitchLongImage || false} onChange={e => setOptions({...options, stitchLongImage: e.target.checked})} />
                     <div className={cn("block w-10 h-6 rounded-full transition-colors", options.stitchLongImage ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700")}></div>
                     <div className={cn("absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform", options.stitchLongImage ? "transform translate-x-4" : "")}></div>
                   </div>
                   <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-500 transition-colors">自动拼接为垂直长图</span>
                 </label>
                 <p className="text-[11px] text-slate-400 leading-relaxed">开启后将合并出长图。超过浏览器极限高度时将自动分段截断。</p>
               </div>
             )}
          </div>
        </div>
      </motion.div>
      {/* 右侧工作区 */}
      <motion.div 
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 w-full space-y-6"
      >
         {/* Dropzone */}
         <div 
           onDragOver={handleDrop}
           onDrop={handleDrop}
           onDragLeave={(e) => e.preventDefault()}
           className="relative overflow-hidden group w-full h-[200px] bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl flex items-center justify-center transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
         >
            <input 
               type="file" multiple accept="image/*,application/pdf"
               className="opacity-0 absolute inset-0 cursor-pointer z-10"
               onChange={e => e.target.files && addFiles(e.target.files)}
            />
            <div className="text-center pointer-events-none group-hover:scale-105 transition-transform duration-500">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400 group-hover:text-blue-500 transition-colors">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">单击选择文件，或拖拽置入</p>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-500 mt-2">支持 PDF, JPG, PNG, WEBP, AVIF 等常见类型</p>
            </div>
         </div>

         {/* 结果栏 */}
         {hasItems && (
           <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
             <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                队列区
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 text-xs px-2.5 py-0.5 rounded-full">{items.length}</span>
             </h3>
             <button
               onClick={clearAllItems}
               className="text-sm font-medium text-slate-500 hover:text-red-500 flex items-center gap-1.5 transition-colors"
             >
               <Trash2 className="w-4 h-4" /> 清屏
             </button>
           </div>
         )}

         {/* Items Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
            <AnimatePresence>
              {items.map(item => (
                <motion.div 
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-4 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                     <div className="flex items-center gap-3 w-[85%]">
                       <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", item.type === 'pdf' ? "bg-rose-50 text-rose-500 dark:bg-rose-500/10" : "bg-purple-50 text-purple-500 dark:bg-purple-500/10")}>
                         {item.type === 'pdf' ? <FileText className="w-5 h-5"/> : <ImageIcon className="w-5 h-5"/>}
                       </div>
                       <div className="w-full overflow-hidden">
                         <p className="font-bold text-sm text-slate-700 dark:text-slate-300 truncate" title={item.file.name}>{item.file.name}</p>
                         <div className="flex items-center gap-2 mt-0.5">
                           <p className="text-xs text-slate-400 font-mono">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                           {item.status === 'done' && (
                              <>
                                <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                                <p className="text-xs text-green-500 font-mono font-bold">
                                  {(item.results.reduce((s, r)=>s+r.blob.size, 0) / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </>
                           )}
                         </div>
                       </div>
                     </div>
                     <button onClick={() => removeItem(item.id)} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group">
                       <X className="w-4 h-4 group-hover:text-red-500" />
                     </button>
                  </div>

                  {item.status === 'processing' && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${item.progress}%` }} />
                      </div>
                      <span className="text-xs font-mono text-blue-500">{item.progress}%</span>
                    </div>
                  )}

                  {item.status === 'error' && (
                    <div className="bg-red-50 dark:bg-red-900/10 text-red-500 text-xs px-3 py-2 rounded-lg font-medium">
                      解析失败: {item.error}
                    </div>
                  )}

                  {item.status === 'done' && (
                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {item.results.slice(0, 4).map((res, i) => (
                        <div key={i} className="aspect-square bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden relative group">
                          <img src={res.url} alt="p" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                           {item.type === 'pdf' && (
                             <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded-sm backdrop-blur-sm shadow-sm">{res.pageNumber}</span>
                           )}
                        </div>
                      ))}
                      {item.results.length > 4 && (
                        <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1">
                          <Plus className="w-3 h-3" /> {item.results.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
         </div>
      </motion.div>

      {/* 右侧操作栏 */}
      <motion.div
        initial={{ x: 20 }}
        animate={{ x: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full xl:w-[320px] shrink-0 sticky top-24"
      >
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 shadow-xl shadow-blue-500/20 text-white">
           <div className="mb-4 text-sm font-medium text-blue-100 bg-blue-950/20 w-fit px-3 py-1 rounded-full border border-blue-400/20 flex items-center gap-2">
             <Sparkles className="w-3.5 h-3.5" />
             纯本地处理，拒绝隐私上传
           </div>
           
           <div className="space-y-3 mt-6">
             {predictedSize !== null && !isProcessing && hasItems && !isAllDone && (
               <div className="animate-pulse flex items-center justify-center gap-2 text-xs font-medium bg-blue-900/30 text-blue-200 py-2 rounded-lg border border-blue-400/20 shadow-inner">
                 <Zap className="w-3.5 h-3.5 text-yellow-400" />
                 <span>预测产出总体积: <strong className="text-white">{(predictedSize / 1024 / 1024).toFixed(2)} MB</strong></span>
               </div>
             )}

             <button 
               onClick={processAll} 
               disabled={!hasItems || isProcessing}
               className={cn(
                 "w-full h-12 flex items-center justify-center gap-2 font-bold rounded-xl transition-all",
                 isProcessing ? "bg-white/20 text-white/50 cursor-not-allowed" : "bg-white text-blue-600 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/10"
               )}
             >
               {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> 处理中...</> : <><PlayCircle className="w-5 h-5" /> 一键转换全部</>}
             </button>

             <AnimatePresence>
               {isAllDone && (
                 <motion.button 
                   initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: '3rem' }} exit={{ opacity: 0, height: 0 }}
                   onClick={downloadAll}
                   className="w-full bg-blue-950/40 hover:bg-blue-950/60 text-white font-medium flex items-center justify-center gap-2 rounded-xl transition-colors border border-blue-400/30 backdrop-blur-md"
                 >
                   <Download className="w-4 h-4" /> 批量下载转换结果
                 </motion.button>
               )}
             </AnimatePresence>
           </div>
        </div>
      </motion.div>
    </div>
  )
}
