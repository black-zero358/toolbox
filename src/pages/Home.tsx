import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Layers, ShieldCheck, FileKey, Image as ImageIcon, ChevronRight } from 'lucide-react'

const tools = [
  {
    id: 'image-processor',
    name: '超级图像工坊',
    description: '万能图片格式转换、质量压缩与 PDF 高清渲染切片。纯本地极速计算。',
    path: '/image-processor',
    icon: ImageIcon,
    color: 'from-blue-500 to-cyan-400',
    tags: ['PDF to Image', 'Format Convert', 'WebP Compress']
  },
  {
    id: 'pass-diff',
    name: '密码账本比对器',
    description: '快速找出两个巨大的 CSV 密码导出文件之间的细微不同，并提供智能的覆盖/合并策略导出。',
    path: '/pass-diff',
    icon: Layers,
    color: 'from-indigo-500 to-purple-500',
    tags: ['CSV Diff', 'Merge']
  },
  {
    id: 'same-pwd-compare',
    name: '高频密码检测雷达',
    description: '深入扫描单份密码库，挖掘那些被危险复用的相同密码，防患于未然。',
    path: '/same-pwd-compare',
    icon: ShieldCheck,
    color: 'from-rose-500 to-orange-400',
    tags: ['Security Analysis', 'Duplicate Check']
  }
]

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-4 pt-10 pb-6">
        <motion.h1 
          className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          全能高雅的 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">本地工具箱</span>
        </motion.h1>
        <motion.p 
          className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          无需网络上传，所有的强悍算力都在您的浏览器内瞬间释放。极致呵护隐私，拒绝云端隐患。
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool, index) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 * index }}
          >
            <Link 
              to={tool.path}
              className="block h-full group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-1 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5 transition-all duration-300 pointer-events-auto"
            >
              <div className="p-6 md:p-8 rounded-2xl h-full flex flex-col items-start gap-4 transition-colors">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.color} text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
                  <tool.icon className="w-7 h-7" />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2 flex items-center gap-2">
                  {tool.name}
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </h3>
                
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed flex-1">
                  {tool.description}
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                  {tool.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      
      {/* 未来保留项预留 */}
      <motion.div 
        className="w-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <FileKey className="w-8 h-8 mb-3 opacity-50" />
        <p className="font-medium text-sm">更多工具模块正在开发中...</p>
      </motion.div>
    </div>
  )
}
