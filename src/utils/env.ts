export function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. Please set it in your .env file or environment.`,
    );
  }
  return value;
}

export function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "JWT_SECRET environment variable is not set. This is required for secure authentication in production.",
      );
    }
    console.warn(
      "[WARN] JWT_SECRET is not set. Using a default secret for development only. Set JWT_SECRET in production!",
    );
    return "development-only-secret-do-not-use-in-production";
  }
  return secret;
}
