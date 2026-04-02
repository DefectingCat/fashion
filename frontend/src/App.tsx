import React from "react";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">我的博客</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">欢迎来到我的博客！</h2>
            <p className="text-gray-600">这是一个使用 Bun、Elysia 和 React SSR 构建的现代化博客系统。</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
