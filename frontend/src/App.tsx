import React, { useEffect, useState } from "react";
import Home from "./pages/Home";
import PostDetail from "./pages/PostDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  const [path, setPath] = useState("/");

  useEffect(() => {
    setPath(window.location.pathname);
  }, []);

  if (path === "/" || path === "") {
    return <Home />;
  }

  if (path.startsWith("/post/")) {
    return <PostDetail />;
  }

  if (path === "/auth/login") {
    return <Login />;
  }

  if (path === "/auth/register") {
    return <Register />;
  }

  return <Home />;
}

export default App;
