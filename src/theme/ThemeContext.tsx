import React, { createContext, useContext, useState, useEffect } from "react";
import { DARK_THEME, LIGHT_THEME, Theme } from "./theme";
import { MMKVStorage } from "@/storage/mmkv";

type ThemeType = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  themeType: ThemeType;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeType, setThemeType] = useState<ThemeType>("dark");

  useEffect(() => {
    const savedTheme = MMKVStorage.getItem("theme_preference") as ThemeType;
    if (savedTheme) {
      setThemeType(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = themeType === "light" ? "dark" : "light";
    setThemeType(nextTheme);
    MMKVStorage.setItem("theme_preference", nextTheme);
  };

  const theme = themeType === "light" ? LIGHT_THEME : DARK_THEME;

  return (
    <ThemeContext.Provider value={{ theme, themeType, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
