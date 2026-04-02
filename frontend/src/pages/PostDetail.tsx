import React, { useEffect, useState } from "react";
import type { Post } from "../../../src/types";

export default function PostDetail() {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pathParts = window.location.pathname.split("/");
    const slug = pathParts[pathParts.length - 1];

    if (!slug) {
      setError("文章不存在");
      setLoading(false);
      return;
    }

    fetch("/api/posts")
      .then((res) => res.json())
      .then((posts: Post[]) => {
        const found = posts.find((p) => p.slug === slug);
        if (found) {
          setPost(found);
        } else {
          setError("文章不存在");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch post:", err);
        setError("加载文章失败");
        setLoading(false);
      });
  }, []);

  const renderMarkdown = (content: string) => {
    if (typeof window !== "undefined" && (window as any).marked) {
      return { __html: (window as any).marked.parse(content) };
    }
    return { __html: content.replace(/\n/g, "<br>") };
  };

  const goHome = () => {
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <button
              onClick={goHome}
              className="text-blue-600 hover:text-blue-800"
            >
              ← 返回首页
            </button>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900">404</h1>
            <p className="mt-2 text-gray-600">{error || "文章不存在"}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <button
            onClick={goHome}
            className="text-blue-600 hover:text-blue-800"
          >
            ← 返回首页
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <article className="bg-white rounded-xl shadow-md overflow-hidden">
          {post.cover_image && (
            <div className="h-64 bg-gray-200">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <time dateTime={post.created_at}>
                {new Date(post.created_at).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </div>
            {post.excerpt && (
              <p className="mt-6 text-lg text-gray-600 italic">{post.excerpt}</p>
            )}
            <div className="mt-8 prose prose-lg max-w-none">
              <div
                dangerouslySetInnerHTML={renderMarkdown(post.content)}
                className="text-gray-700 leading-relaxed"
              />
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
