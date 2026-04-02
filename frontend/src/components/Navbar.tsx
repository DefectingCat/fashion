import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, logout, loading } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (loading) {
    return (
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="animate-pulse h-6 bg-gray-200 rounded w-24"></div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
            我的博客
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  to="/admin"
                  className="text-gray-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  管理后台
                </Link>
                <Link
                  to="/profile"
                  className="text-gray-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  {user.username}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="text-gray-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  登录
                </Link>
                <Link
                  to="/auth/register"
                  className="bg-blue-600 text-white hover:bg-blue-700 transition-colors px-4 py-2 rounded-lg font-medium"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
