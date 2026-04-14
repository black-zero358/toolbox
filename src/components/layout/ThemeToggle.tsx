import { useTheme } from 'next-themes'
import { Sun, Moon, Laptop } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-[104px] h-[36px]" />
  }

  return (
    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700/50 shadow-inner">
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
          theme === 'light' 
            ? 'bg-white text-indigo-500 shadow-sm' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        title="Light Mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
          theme === 'system' 
            ? 'bg-white dark:bg-slate-700 text-indigo-500 dark:text-indigo-400 shadow-sm' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        title="System Preference"
      >
        <Laptop className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
          theme === 'dark' 
            ? 'bg-slate-700 text-indigo-400 shadow-sm' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        title="Dark Mode"
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  )
}
