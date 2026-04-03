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

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/post/:slug" element={<PostDetail />} />
          <Route path="/tag/:id" element={<TagPosts />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/posts/new" element={<PostEditor />} />
          <Route path="/admin/posts/:id/edit" element={<PostEditor />} />
          <Route path="/admin/tags" element={<TagManager />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
