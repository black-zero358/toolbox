/**
 * 应用根组件
 * 负责路由配置 (React Router) 和 主题切换 (next-themes)
 */
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { AppLayout } from './components/layout/AppLayout'
import Home from './pages/Home'

// 导入工具页面
import ImageProcessor from './pages/ImageProcessor'
import PassDiff from './pages/PassDiff'
import SamePwdCompare from './pages/SamePwdCompare'

/**
 * 路由配置
 * 定义了 URL 路径与具体组件之间的映射关系
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />, // 使用 AppLayout 作为所有页面的外层布局
    children: [
      {
        index: true, // 默认首页
        element: <Home />,
      },
      {
        path: 'image-processor', // 图片处理工具
        element: <ImageProcessor />,
      },
      {
        path: 'pass-diff', // 密码差异比对工具
        element: <PassDiff />,
      },
      {
        path: 'same-pwd-compare', // 相同密码比对工具
        element: <SamePwdCompare />,
      },
    ],
  },
])

function App() {
  return (
    /**
     * ThemeProvider 用于管理暗黑/明亮模式
     * attribute="class" 表示通过 HTML class 来切换主题
     * defaultTheme="system" 默认遵循系统设置
     */
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {/* 渲染路由 */}
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

export default App
