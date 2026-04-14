/**
 * 应用布局组件
 * 定义了所有页面通用的外层结构，包括导航栏(Header)、内容区(Main)和页脚(Footer)
 */
import { Outlet, Link, useLocation } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import { Blocks, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function AppLayout() {
  const location = useLocation() // 获取当前路由信息
  const isHome = location.pathname === '/' // 判断当前是否在首页

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300 ease-in-out">
      {/* 
        顶部导航栏 
        sticky top-0 使其在滚动时固定在顶部
        backdrop-blur-xl 实现高斯模糊的毛玻璃效果
      */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto max-w-6xl flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4 cursor-pointer">
            {/* 项目 Logo 和名称 */}
            <Link to="/" className="flex items-center gap-2 group outline-none">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Blocks className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
                Web Toolbox
              </span>
            </Link>
            
            {/* 如果不在首页，则显示“返回主页”按钮 */}
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
            {/* 主题切换按钮（明亮/暗黑） */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 
        路由内容区 
        Outlet 是路由占位符，不同的页面内容会在这里渲染
      */}
      <main className="flex-1 w-full bg-slate-50/50 dark:bg-slate-950">
        <AnimatePresence mode="wait">
          {/* 
            页面切换动画 
            当路由路径 (pathname) 改变时，旧页面淡出，新页面淡入
          */}
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

      {/* 底部版权和说明 */}
      <footer className="py-6 border-t border-border bg-background text-center text-sm text-slate-500 dark:text-slate-400">
        <p>纯本地处理 • 保护您的数据隐私</p>
      </footer>
    </div>
  )
}
