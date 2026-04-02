import db from "./index";

export function seedDatabase() {
  console.log("🌱 开始播种数据库...");

  try {
    const userStmt = db.prepare(`
      INSERT OR IGNORE INTO users (username, email, password, avatar, bio)
      VALUES (?, ?, ?, ?, ?)
    `);

    userStmt.run(
      "admin",
      "admin@example.com",
      "admin123",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
      "博客管理员，热爱写作与分享"
    );

    userStmt.run(
      "zhangsan",
      "zhangsan@example.com",
      "zhangsan123",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan",
      "前端开发工程师，专注于 React 和 TypeScript"
    );

    const postStmt = db.prepare(`
      INSERT OR IGNORE INTO posts (title, slug, content, excerpt, cover_image, published, author_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    postStmt.run(
      "欢迎来到我的博客",
      "welcome-to-my-blog",
      "# 欢迎\n\n这是我的第一篇博客文章！很高兴你能来到这里。\n\n## 关于这个博客\n\n这个博客使用 Bun、Elysia 和 React SSR 构建。\n\n### 技术栈\n\n- Bun - 极速 JavaScript 运行时\n- Elysia - TypeScript 优先的 Web 框架\n- React - 用于构建用户界面的库\n- Tailwind CSS - 实用优先的 CSS 框架\n\n希望你在这里能找到有用的内容！",
      "这是我的第一篇博客文章，介绍了这个博客的技术栈和愿景。",
      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=400&fit=crop",
      1,
      1
    );

    postStmt.run(
      "React 19 新特性详解",
      "react-19-new-features",
      "# React 19 新特性\n\nReact 19 带来了许多令人兴奋的新特性，让我们一起来看看！\n\n## 主要更新\n\n### 1. Actions\n\n新的 Actions API 让处理表单提交变得更加简单：\n\n```jsx\nfunction UpdateName() {\n  const [name, setName] = useState('');\n  const [error, setError] = useState(null);\n  const [isPending, startTransition] = useTransition();\n\n  async function handleSubmit() {\n    startTransition(async () => {\n      const error = await updateName(name);\n      if (error) {\n        setError(error);\n        return;\n      }\n      redirect('/path');\n    });\n  }\n\n  return (\n    <div>\n      <input value={name} onChange={(e) => setName(e.target.value)} />\n      <button onClick={handleSubmit} disabled={isPending}>\n        更新\n      </button>\n      {error && <p>{error}</p>}\n    </div>\n  );\n}\n```\n\n### 2. useOptimistic\n\n乐观更新 Hook 让你可以在请求完成前就更新 UI：\n\n```jsx\nfunction Thread() {\n  const [messages, setMessages] = useState([]);\n  const [optimisticMessages, addOptimistic] = useOptimistic(\n    messages,\n    (state, newMessage) => [...state, newMessage]\n  );\n\n  async function sendMessage(formData) {\n    const newMessage = { text: formData.get('text') };\n    addOptimistic(newMessage);\n    await addMessageToServer(newMessage);\n  }\n\n  return (\n    <div>\n      {optimisticMessages.map((m) => (\n        <Message key={m.id} message={m} />\n      ))}\n      <Form action={sendMessage}>\n        <input type=\"text\" name=\"text\" />\n      </Form>\n    </div>\n  );\n}\n```\n\n这些新特性将大大提升开发体验！",
      "React 19 带来了 Actions、useOptimistic 等强大的新特性，本文详细介绍了这些更新。",
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop",
      1,
      2
    );

    postStmt.run(
      "TypeScript 5.0 新特性",
      "typescript-5-new-features",
      "# TypeScript 5.0 新特性\n\nTypeScript 5.0 带来了许多性能改进和新特性！\n\n## 性能提升\n\n- 构建速度提升约 30-50%\n- 内存使用减少约 40%\n- 更好的增量编译\n\n## 新特性\n\n### const 类型参数\n\n```typescript\ntype HasNames = { names: readonly string[] };\nfunction getNamesExactly<const T extends HasNames>(arg: T): T[\"names\"] {\n  return arg.names;\n}\n\nconst names = getNamesExactly({ names: [\"Alice\", \"Bob\", \"Eve\"] });\n//    ^? readonly [\"Alice\", \"Bob\", \"Eve\"]\n```\n\n### 装饰器\n\nTypeScript 5.0 正式支持 ECMAScript 装饰器：\n\n```typescript\nfunction logged(target: any, context: ClassMethodDecoratorContext) {\n  return function (...args: any[]) {\n    console.log(`Calling ${String(context.name)}`);\n    return target.apply(this, args);\n  };\n}\n\nclass Calculator {\n  @logged\n  add(a: number, b: number) {\n    return a + b;\n  }\n}\n```\n\n### 更完善的联合类型缩小\n\n```typescript\nfunction func(value: string | number | boolean) {\n  if (typeof value === \"string\" || typeof value === \"number\") {\n    value;\n    // ^? string | number\n  }\n}\n```\n\nTypeScript 5.0 是一个巨大的进步！",
      "TypeScript 5.0 带来了显著的性能提升和 const 类型参数、装饰器等新特性。",
      "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=400&fit=crop",
      1,
      2
    );

    const tagStmt = db.prepare(`
      INSERT OR IGNORE INTO tags (name)
      VALUES (?)
    `);

    tagStmt.run("React");
    tagStmt.run("TypeScript");
    tagStmt.run("Bun");
    tagStmt.run("Elysia");
    tagStmt.run("前端");
    tagStmt.run("教程");

    const postTagStmt = db.prepare(`
      INSERT OR IGNORE INTO post_tags (post_id, tag_id)
      VALUES (?, ?)
    `);

    postTagStmt.run(1, 3);
    postTagStmt.run(1, 4);
    postTagStmt.run(1, 5);
    postTagStmt.run(2, 1);
    postTagStmt.run(2, 5);
    postTagStmt.run(2, 6);
    postTagStmt.run(3, 2);
    postTagStmt.run(3, 5);
    postTagStmt.run(3, 6);

    const commentStmt = db.prepare(`
      INSERT OR IGNORE INTO comments (content, post_id, author_id)
      VALUES (?, ?, ?)
    `);

    commentStmt.run("写得很棒！期待更多内容。", 1, 2);
    commentStmt.run("React 19 确实很强大！", 2, 1);
    commentStmt.run("TypeScript 5.0 的性能提升太明显了。", 3, 1);

    console.log("✅ 数据库播种完成！");
  } catch (error) {
    console.error("❌ 数据库播种失败:", error);
    throw error;
  }
}
