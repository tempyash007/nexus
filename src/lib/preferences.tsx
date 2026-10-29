import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemePreference = "dark" | "light" | "system";

const THEME_KEY = "nexus.theme";
const SESSION_KEY = "nexus.signedOut";

/** Runs before hydration so light-theme users don't see a dark flash. */
export const themeBootScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}")||"dark";var l=t==="light"||(t==="system"&&matchMedia("(prefers-color-scheme: light)").matches);document.documentElement.classList.toggle("light",l)}catch(e){}})();`;

function resolveLight(pref: ThemePreference) {
  if (pref === "light") return true;
  if (pref === "system") return window.matchMedia("(prefers-color-scheme: light)").matches;
  return false;
}

interface PreferencesValue {
  theme: ThemePreference;
  setTheme: (t: ThemePreference) => void;
  signedIn: boolean;
  signOut: () => void;
  signIn: () => void;
}

const PreferencesContext = createContext<PreferencesValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("dark");
  const [signedIn, setSignedIn] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") setThemeState(stored);
    setSignedIn(window.localStorage.getItem(SESSION_KEY) !== "1");
  }, []);

  useEffect(() => {
    const apply = () => document.documentElement.classList.toggle("light", resolveLight(theme));
    apply();
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  const setTheme = useCallback((t: ThemePreference) => {
    setThemeState(t);
    window.localStorage.setItem(THEME_KEY, t);
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.setItem(SESSION_KEY, "1");
    setSignedIn(false);
  }, []);

  const signIn = useCallback(() => {
    window.localStorage.removeItem(SESSION_KEY);
    setSignedIn(true);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, signedIn, signOut, signIn }),
    [theme, setTheme, signedIn, signOut, signIn],
  );
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used inside PreferencesProvider");
  return ctx;
}
