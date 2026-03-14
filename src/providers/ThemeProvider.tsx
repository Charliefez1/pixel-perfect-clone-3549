import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AccentColor = "sky" | "steel" | "mint" | "amber" | "purple";
export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  accent: AccentColor;
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  setAccent: (accent: AccentColor) => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveMode(mode: ThemeMode): "light" | "dark" {
  return mode === "system" ? getSystemTheme() : mode;
}

function applyThemeToDOM(accent: AccentColor, resolved: "light" | "dark") {
  const html = document.documentElement;
  // Brief transition class for smooth theme switching
  html.setAttribute("data-transitioning", "");
  html.setAttribute("data-accent", accent);

  if (resolved === "dark") {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }

  // Remove transitioning flag after animation completes
  setTimeout(() => html.removeAttribute("data-transitioning"), 250);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();

  const [accent, setAccentState] = useState<AccentColor>(() => {
    const stored = localStorage.getItem("ndg-accent");
    return (stored as AccentColor) || "steel";
  });

  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem("ndg-mode");
    return (stored as ThemeMode) || "system";
  });

  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">(() =>
    resolveMode(mode)
  );

  // Sync from profile on load
  useEffect(() => {
    if (!profile) return;
    const profileAccent = (profile as any).theme_accent as AccentColor | undefined;
    const profileMode = (profile as any).theme_mode as ThemeMode | undefined;

    if (profileAccent && profileAccent !== accent) {
      setAccentState(profileAccent);
      localStorage.setItem("ndg-accent", profileAccent);
    }
    if (profileMode && profileMode !== mode) {
      setModeState(profileMode);
      localStorage.setItem("ndg-mode", profileMode);
    }
    // Only run when profile changes, not on accent/mode changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Listen for system theme changes when mode is "system"
  useEffect(() => {
    if (mode !== "system") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const resolved = getSystemTheme();
      setResolvedMode(resolved);
      applyThemeToDOM(accent, resolved);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [mode, accent]);

  // Apply theme to DOM whenever accent or mode changes
  useEffect(() => {
    const resolved = resolveMode(mode);
    setResolvedMode(resolved);
    applyThemeToDOM(accent, resolved);
  }, [accent, mode]);

  const persistToSupabase = useCallback(
    async (field: string, value: string) => {
      if (!profile?.id) return;
      await supabase
        .from("profiles")
        .update({ [field]: value } as any)
        .eq("id", profile.id);
    },
    [profile?.id]
  );

  const setAccent = useCallback(
    (newAccent: AccentColor) => {
      setAccentState(newAccent);
      localStorage.setItem("ndg-accent", newAccent);
      persistToSupabase("theme_accent", newAccent);
    },
    [persistToSupabase]
  );

  const setMode = useCallback(
    (newMode: ThemeMode) => {
      setModeState(newMode);
      localStorage.setItem("ndg-mode", newMode);
      persistToSupabase("theme_mode", newMode);
    },
    [persistToSupabase]
  );

  return (
    <ThemeContext.Provider value={{ accent, mode, resolvedMode, setAccent, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
