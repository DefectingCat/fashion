import { useCallback, useState } from "react";

export interface FormError {
  message: string;
  field?: string;
}

export function useFormError() {
  const [error, setError] = useState<FormError | null>(null);

  const handleError = useCallback((err: unknown, fallbackMessage = "操作失败") => {
    if (err instanceof Error) {
      setError({ message: err.message });
    } else if (typeof err === "string") {
      setError({ message: err });
    } else {
      setError({ message: fallbackMessage });
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const withErrorHandling = useCallback(
    async <T>(
      fn: () => Promise<T>,
      fallbackMessage = "操作失败",
    ): Promise<T | null> => {
      try {
        const result = await fn();
        return result;
      } catch (err) {
        handleError(err, fallbackMessage);
        return null;
      }
    },
    [handleError],
  );

  return {
    error,
    handleError,
    clearError,
    withErrorHandling,
  };
}
