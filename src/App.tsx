import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { AppLayout } from './components/layout/AppLayout'
import Home from './pages/Home'

import ImageProcessor from './pages/ImageProcessor'
import PassDiff from './pages/PassDiff'
import SamePwdCompare from './pages/SamePwdCompare'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'image-processor',
        element: <ImageProcessor />,
      },
      {
        path: 'pass-diff',
        element: <PassDiff />,
      },
      {
        path: 'same-pwd-compare',
        element: <SamePwdCompare />,
      },
    ],
  },
])

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

export default App
