/**
 * 项目入口文件
 * 这里的代码负责将整个 React 应用挂载到 HTML 页面上
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // 全局 CSS 样式
import App from './App.tsx' // 根组件

// 创建 React 根实例并渲染应用
// getElementById('root') 对应 index.html 中的 <div id="root"></div>
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* StrictMode 会在开发环境下进行额外的检查，帮助发现潜在问题 */}
    <App />
  </StrictMode>,
)
