import { Outlet, Link, useLocation } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import { Blocks, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function AppLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300 ease-in-out">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto max-w-6xl flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4 cursor-pointer">
            <Link to="/" className="flex items-center gap-2 group outline-none">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Blocks className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
                Web Toolbox
              </span>
            </Link>
            
            <AnimatePresence>
              {!isHome && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="hidden sm:block"
                >
                  <Link 
                    to="/" 
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors ml-4 pl-4 border-l border-border"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    返回主页
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 路由内容区 */}
      <main className="flex-1 w-full bg-slate-50/50 dark:bg-slate-950">
        {/* 用 AnimatePresence 包装路由使切页过渡柔和 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="h-full min-h-[calc(100vh-4rem)] p-4 sm:p-6 md:p-8 container mx-auto max-w-6xl"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 底部版权 */}
      <footer className="py-6 border-t border-border bg-background text-center text-sm text-slate-500 dark:text-slate-400">
        <p>纯本地处理 • 保护您的数据隐私</p>
      </footer>
    </div>
  )
}
