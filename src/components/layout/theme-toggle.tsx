"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("hris-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("hris-theme");
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const nextTheme = stored === "dark" || stored === "light" ? stored : preferred;
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        const nextTheme = theme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
        applyTheme(nextTheme);
      }}
      className="grid h-10 w-10 place-items-center rounded-full border border-input bg-background/50 text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
      aria-label="Ganti mode terang gelap"
      title={theme === "dark" ? "Mode terang" : "Mode gelap"}
    >
      {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
