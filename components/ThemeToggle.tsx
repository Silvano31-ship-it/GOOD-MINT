// components/ThemeToggle.tsx — alterna claro/escuro, salva em localStorage.
"use client";

import { useEffect, useState } from "react";

export function ThemeToggle({
  className = "",
  onToggled,
}: {
  className?: string;
  onToggled?: () => void;
}) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("gm-theme", next ? "dark" : "light");
    onToggled?.();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
      className={`flex min-h-9 items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gm-700 hover:bg-gm-50 ${className}`}
    >
      <span>{dark ? "☀️" : "🌙"}</span>
      <span>{dark ? "Modo claro" : "Modo escuro"}</span>
    </button>
  );
}
