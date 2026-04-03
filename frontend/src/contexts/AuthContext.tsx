/**
 * @file 用户认证上下文
 * @description 提供用户登录状态、JWT token 管理和认证相关功能
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../../../src/types'

/**
 * 认证上下文类型
 */
interface AuthContextType {
  /** 当前登录用户信息，未登录时为 null */
  user: User | null
  /** JWT 认证 token，未登录时为 null */
  token: string | null
  /**
   * 用户登录函数
   *
   * @param email - 用户邮箱
   * @param password - 用户密码
   * @throws Error - 登录失败时抛出异常
   */
  login: (email: string, password: string) => Promise<void>
  /**
   * 用户注册函数
   *
   * @param username - 用户名
   * @param email - 用户邮箱
   * @param password - 用户密码
   * @throws Error - 注册失败时抛出异常
   */
  register: (username: string, email: string, password: string) => Promise<void>
  /** 用户登出函数，清除本地存储和状态 */
  logout: () => void
  /** 是否正在加载用户信息 */
  loading: boolean
}

/**
 * 认证上下文
 *
 * 使用 createContext 创建，需配合 AuthProvider 使用
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * 认证上下文 Provider 组件
 *
 * 包裹应用根组件，提供认证相关功能
 *
 * @param children - 子组件
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  /** 当前登录用户状态 */
  const [user, setUser] = useState<User | null>(null)
  /** JWT token 状态 */
  const [token, setToken] = useState<string | null>(null)
  /** 加载状态 */
  const [loading, setLoading] = useState(true)

  // 初始化时从 localStorage 读取 token
  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (savedToken) {
      setToken(savedToken)
    } else {
      setLoading(false)
    }
  }, [])

  // token 变化时获取当前用户信息
  useEffect(() => {
    if (token) {
      fetchCurrentUser()
    }
  }, [token])

  /**
   * 获取当前登录用户信息
   *
   * 使用 token 调用后端接口获取用户详情
   */
  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        // token 无效时登出
        logout()
      }
    } catch (err) {
      console.error('Failed to fetch user:', err)
      logout()
    } finally {
      setLoading(false)
    }
  }

  /**
   * 用户登录
   *
   * @param email - 用户邮箱
   * @param password - 用户密码
   * @throws Error - 登录失败时抛出异常
   */
  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.message || '登录失败')
    }

    const data = await res.json()
    setToken(data.token)
    localStorage.setItem('auth_token', data.token)
    setUser(data.user)
  }

  /**
   * 用户注册
   *
   * @param username - 用户名
   * @param email - 用户邮箱
   * @param password - 用户密码
   * @throws Error - 注册失败时抛出异常
   */
  const register = async (username: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.message || '注册失败')
    }
  }

  /**
   * 用户登出
   *
   * 清除用户状态、token 和本地存储
   */
  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * 使用认证上下文的 Hook
 *
 * 必须在 AuthProvider 内部使用
 *
 * @returns 认证上下文对象
 * @throws Error - 未在 AuthProvider 内部使用时抛出异常
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
