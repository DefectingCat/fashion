/**
 * @file 主题切换组件
 * @description 提供亮色/暗色模式切换按钮，带有平滑动画
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import React from 'react'
import { useTheme } from '../contexts/ThemeContext'

/**
 * 主题切换按钮组件
 *
 * 显示太阳图标（亮色模式）或月亮图标（暗色模式）
 * 点击可切换主题，带有旋转动画效果
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`
        relative p-2 rounded-lg transition-all duration-300
        hover:bg-gray-200 dark:hover:bg-gray-700
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        dark:focus:ring-offset-gray-900
      `}
      aria-label={theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'}
    >
      {/* 图标容器 - 带有旋转动画 */}
      <div className="relative w-6 h-6">
        {/* 太阳图标 - 亮色模式 */}
        <svg
          className={`
            absolute inset-0 w-6 h-6 text-gray-700 dark:text-gray-200
            transition-all duration-300
            ${theme === 'light' ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}
          `}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>

        {/* 月亮图标 - 暗色模式 */}
        <svg
          className={`
            absolute inset-0 w-6 h-6 text-gray-700 dark:text-gray-200
            transition-all duration-300
            ${theme === 'dark' ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}
          `}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </div>
    </button>
  )
}
