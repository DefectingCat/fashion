# 项目优化实施计划

## 概述
对 Fashion Blog 项目进行全面的性能、代码质量、用户体验和架构优化。

## 第一阶段：紧急修复（P0 - 立即执行）

### 1.1 Tailwind CDN 问题修复
**问题**: 生产环境使用 CDN 导致样式闪烁
**文件**: `src/ssr/renderer.tsx`
**操作**:
- [ ] 移除 `<script src="https://cdn.tailwindcss.com"></script>`
- [ ] 构建时生成内联关键 CSS
- [ ] 添加 `darkMode: 'class'` 配置到 tailwind.config.js

### 1.2 主题切换防闪烁
**文件**: `src/ssr/renderer.tsx`
**操作**:
- [ ] 在 HTML `<head>` 中添加主题检测脚本
```html
<script>
  const theme = localStorage.getItem('theme');
  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
</script>
```

### 1.3 JWT Secret 环境变量化
**文件**: `src/routes/auth.ts`, `src/routes/upload.ts`
**操作**:
- [ ] 将硬编码的 JWT_SECRET 改为从环境变量读取
- [ ] 添加开发环境默认值的警告日志

---

## 第二阶段：性能优化（P1 - 高优先级）

### 2.1 数据库 N+1 查询优化
**文件**: `src/routes/posts.ts`, `src/ssr/renderer.tsx`
**操作**:
- [ ] 使用 JOIN 查询替代循环查询标签
- [ ] 在 `src/db/schema.ts` 中添加缺失的索引
```sql
CREATE INDEX idx_posts_published ON posts(published);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag_id ON post_tags(tag_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
```

### 2.2 SSR 渲染优化
**文件**: `src/ssr/renderer.tsx`
**操作**:
- [ ] 添加简单的内存缓存层（LRU Cache，TTL 60秒）
- [ ] 使用 Promise.all 并行化数据获取

### 2.3 Vite Bundle 代码分割
**文件**: `frontend/vite.config.ts`
**操作**:
- [ ] 配置 `manualChunks` 将重型依赖分离
- [ ] 编辑器组件使用动态导入

---

## 第三阶段：代码质量优化（P2）

### 3.1 提取公共工具函数
**新建文件**: `frontend/src/utils/colors.ts`
**操作**:
- [ ] 将 `getContrastColor` 从 Home.tsx 和 PostDetail.tsx 提取
- [ ] 在两个组件中导入使用

### 3.2 统一加载状态组件
**新建文件**: `frontend/src/components/LoadingSpinner.tsx`
**操作**:
- [ ] 创建统一的 LoadingSpinner 组件
- [ ] 替换所有页面中的不统一加载动画

### 3.3 路由配置中心化
**新建文件**: `frontend/src/routes.ts`
**操作**:
- [ ] 创建路由路径常量
- [ ] 替换所有硬编码路由字符串

### 3.4 修复已废弃 API
**文件**: `frontend/src/components/PasteImageUpload.tsx`
**操作**:
- [ ] 将 `document.execCommand` 替换为 Clipboard API

---

## 第四阶段：架构完善（P3）

### 4.1 添加单元测试
**操作**:
- [ ] 配置 Vitest 测试框架
- [ ] 为工具函数编写单元测试
- [ ] 为 AuthContext 编写测试

### 4.2 完善错误处理
**操作**:
- [ ] 创建统一的错误边界组件
- [ ] 添加全局错误处理 Hook
- [ ] 实现请求重试机制

### 4.3 依赖审计
**操作**:
- [ ] 运行 `npm audit` 检查安全漏洞
- [ ] 统一 React 版本声明
- [ ] 清理未使用依赖

---

## 实施顺序
1. 第一阶段（紧急修复）→ 预计 30 分钟
2. 第二阶段（性能优化）→ 预计 2 小时
3. 第三阶段（代码质量）→ 预计 1.5 小时
4. 第四阶段（架构完善）→ 预计 2 小时

## 预期效果
- 首屏加载时间提升 40-60%
- SEO 评分提升至 90+
- 代码重复率降低 30%
- 用户体验一致性大幅提升
- 安全评级从 C 提升至 A