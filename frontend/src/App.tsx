/**
 * @file 应用根组件
 * @description 应用路由配置和根组件，包含所有页面路由定义
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import AdminDashboard from './pages/AdminDashboard'
import Home from './pages/Home'
import Login from './pages/Login'
import PostDetail from './pages/PostDetail'
import PostEditor from './pages/PostEditor'
import Register from './pages/Register'
import TagManager from './pages/TagManager'
import TagPosts from './pages/TagPosts'
import UserProfile from './pages/UserProfile'
import { Routes as AppRoutes } from './routes'
import { ErrorBoundary } from './components/ErrorBoundary'

/**
 * 应用根组件
 *
 * 配置主题Provider、认证Provider和路由
 */
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <Navbar />
          <Routes>
            <Route path={AppRoutes.Home} element={<Home />} />
            <Route path={AppRoutes.Post(':slug')} element={<PostDetail />} />
            <Route path={AppRoutes.Tag(':id')} element={<TagPosts />} />
            <Route path={AppRoutes.Login} element={<Login />} />
            <Route path={AppRoutes.Register} element={<Register />} />
            <Route path={AppRoutes.Profile} element={<UserProfile />} />
            <Route path={AppRoutes.Admin} element={<AdminDashboard />} />
            <Route path={AppRoutes.AdminPostNew} element={<PostEditor />} />
            <Route path={AppRoutes.AdminPostEdit(':id')} element={<PostEditor />} />
            <Route path={AppRoutes.AdminTags} element={<TagManager />} />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App