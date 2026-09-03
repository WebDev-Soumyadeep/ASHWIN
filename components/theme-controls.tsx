"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, MoonStar, Palette, Settings2, SunMedium } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "light" | "dark";
type ThemeName = "lagoon" | "meadow" | "sunrise";

const THEME_LABELS: Record<ThemeName, string> = {
  lagoon: "Lagoon",
  meadow: "Meadow",
  sunrise: "Sunrise"
};

function applyTheme(mode: Mode, theme: ThemeName) {
  document.documentElement.dataset.mode = mode;
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem("ashwin-mode", mode);
  window.localStorage.setItem("ashwin-theme", theme);
}

export function ThemeControls() {
  const [mode, setMode] = useState<Mode>("light");
  const [theme, setTheme] = useState<ThemeName>("lagoon");
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nextMode = (window.localStorage.getItem("ashwin-mode") as Mode | null) ?? "light";
    const nextTheme =
      (window.localStorage.getItem("ashwin-theme") as ThemeName | null) ?? "lagoon";
    setMode(nextMode);
    setTheme(nextTheme);
    applyTheme(nextMode, nextTheme);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode);
    applyTheme(nextMode, theme);
  };

  const handleThemeChange = (nextTheme: ThemeName) => {
    setTheme(nextTheme);
    applyTheme(mode, nextTheme);
  };

  return (
    <div ref={menuRef} className="fixed right-4 top-4 z-50">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open display settings"
        aria-expanded={open}
        className="focus-ring inline-flex size-11 items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/95 text-[rgb(var(--text-muted))] shadow-panel backdrop-blur transition hover:text-[rgb(var(--text))]"
      >
        <Settings2 size={18} aria-hidden="true" />
      </button>

      <div
        className={cn(
          "absolute right-0 top-14 w-[280px] rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/95 p-3 shadow-panel backdrop-blur transition duration-150",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        )}
      >
        <div className="mb-3 flex items-center justify-between px-1">
          <div>
            <p className="text-sm font-semibold text-[rgb(var(--text))]">Display settings</p>
            <p className="text-xs text-[rgb(var(--text-muted))]">Adjust appearance without covering the page.</p>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-1 rounded-full bg-[rgb(var(--surface-muted))] p-1">
          <button
            type="button"
            onClick={() => handleModeChange("light")}
            className={cn(
              "focus-ring inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition",
              ready && mode === "light"
                ? "bg-clinic text-white"
                : "text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface))]"
            )}
          >
            <SunMedium size={16} aria-hidden="true" />
            Light
          </button>
          <button
          type="button"
          onClick={() => handleModeChange("dark")}
          className={cn(
            "focus-ring inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition",
            ready && mode === "dark"
              ? "bg-clinic text-white"
              : "text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface))]"
          )}
        >
          <MoonStar size={16} aria-hidden="true" />
          Dark
          </button>
        </div>

        <label className="flex items-center gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))] px-3 py-2 text-sm font-medium text-[rgb(var(--text-muted))]">
          <Palette size={15} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="sr-only">Theme</span>
            <select
              value={theme}
              onChange={(event) => handleThemeChange(event.target.value as ThemeName)}
              className="w-full bg-transparent text-[rgb(var(--text))] outline-none"
            >
              {Object.entries(THEME_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </span>
          <ChevronDown size={15} aria-hidden="true" />
        </label>
      </div>
    </div>
  );
}
