"use client";

import { useEffect, useState } from "react";

type Mode = "light" | "dark";

// Simple light/dark toggle persisted to localStorage. Initial class is applied
// by the inline script in layout.tsx, so there is no flash on load.
export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("light");

  useEffect(() => {
    setMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Mode = mode === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
    setMode(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="font-display text-xs font-medium uppercase tracking-wider text-muted transition-colors hover:text-accent"
    >
      {mode === "dark" ? "Light" : "Dark"}
    </button>
  );
}
