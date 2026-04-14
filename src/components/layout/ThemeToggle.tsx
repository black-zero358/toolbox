/**
 * 主题切换小组件
 * 允许用户在 明亮、暗黑、系统默认 三种模式间切换
 */
import { useTheme } from 'next-themes'
import { Sun, Moon, Laptop } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false) // 用于追踪组件是否已挂载到浏览器
  const { theme, setTheme } = useTheme() // 从 next-themes 获取当前主题和设置函数

  /**
   * 知识点：水合错位 (Hydration Mismatch)
   * 由于服务端渲染(SSR)不知道浏览器的本地存储(localStorage)中存的是什么主题，
   * 所以必须等待组件在浏览器端“挂载” (mounted) 后，才渲染实际的 UI，
   * 否则会导致服务端和客户端渲染的 HTML 不一致。
   */
  useEffect(() => {
    setMounted(true)
  }, [])

  // 如果还没挂载，渲染一个占位空容器，保持布局稳定
  if (!mounted) {
    return <div className="w-[104px] h-[36px]" />
  }

  return (
    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700/50 shadow-inner">
      {/* 明亮模式按钮 */}
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
          theme === 'light' 
            ? 'bg-white text-indigo-500 shadow-sm' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        title="明亮模式"
      >
        <Sun className="w-4 h-4" />
      </button>

      {/* 跟随系统按钮 */}
      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
          theme === 'system' 
            ? 'bg-white dark:bg-slate-700 text-indigo-500 dark:text-indigo-400 shadow-sm' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        title="跟随系统"
      >
        <Laptop className="w-4 h-4" />
      </button>

      {/* 暗黑模式按钮 */}
      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
          theme === 'dark' 
            ? 'bg-slate-700 text-indigo-400 shadow-sm' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        title="暗黑模式"
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  )
}
