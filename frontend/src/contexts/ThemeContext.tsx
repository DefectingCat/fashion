/**
 * @file 主题上下文
 * @description 提供暗色/亮色模式切换功能，支持系统偏好检测和本地存储持久化
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

/**
 * 主题类型
 */
type Theme = "light" | "dark";

/**
 * 主题上下文类型
 */
interface ThemeContextType {
  /** 当前主题 */
  theme: Theme;
  /** 切换主题函数 */
  toggleTheme: () => void;
  /** 是否正在加载主题（防止闪烁） */
  loading: boolean;
}

/**
 * 创建主题上下文
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * 主题 Provider 组件
 *
 * @param children - 子组件
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [loading, setLoading] = useState(true);

  // 初始化主题：优先读取本地存储，否则检测系统偏好
  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;

    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }

    setLoading(false);
  }, []);

  // 应用主题到 document 和 body
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (theme === "dark") {
      root.classList.add("dark");
      body.classList.add("dark");
    } else {
      root.classList.remove("dark");
      body.classList.remove("dark");
    }

    // 保存到本地存储
    localStorage.setItem("theme", theme);
  }, [theme]);

  /**
   * 切换主题
   */
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * 使用主题上下文的 Hook
 *
 * @returns 主题上下文对象
 * @throws Error - 未在 ThemeProvider 内部使用时抛出
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
