import { useEffect, useState } from "react";

export function useDebouncedValue(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}

export function useErrorToast() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(""), 8000);
    return () => clearTimeout(id);
  }, [message]);

  const report = (err) => {
    if (err?.name === "AbortError") return;
    console.error(err);
    setMessage(err?.message || String(err));
  };

  return { message, report, clear: () => setMessage("") };
}
