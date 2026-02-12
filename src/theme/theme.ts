export const PALETTE = {
  emerald500: "#10b981",
  emerald400: "#34d399",
  rose500: "#f43f5e",
  blue500: "#3b82f6",
  violet500: "#8b5cf6",
  white: "#ffffff",
  black: "#000000",

  dark: {
    background: "#09090b",
    surface: "#18181b",
    surfaceSubtle: "#27272a",
    border: "#3f3f46",
    text: "#f4f4f5",
    textMuted: "#a1a1aa",
  },
  light: {
    background: "#ffffff",
    surface: "#f9fafb",
    surfaceSubtle: "#f3f4f6",
    border: "#e5e7eb",
    text: "#0f172a",
    textMuted: "#64748b",
  },
} as const;

import { TextStyle } from "react-native";

const mapTypography = (style: TextStyle & { fontWeight?: string }): TextStyle =>
  style as TextStyle;

const BASE_THEME = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    full: 9999,
  },
  typography: {
    h1: mapTypography({
      fontSize: 36,
      fontWeight: "800",
      letterSpacing: -1,
    }),
    h2: mapTypography({
      fontSize: 28,
      fontWeight: "700",
      letterSpacing: -0.5,
    }),
    h3: mapTypography({ fontSize: 22, fontWeight: "600" }),
    body: mapTypography({
      fontSize: 16,
      fontWeight: "400",
      lineHeight: 24,
    }),
    caption: mapTypography({ fontSize: 14, fontWeight: "500" }),
    small: mapTypography({
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
    }),
  },
};

export const DARK_THEME = {
  ...BASE_THEME,
  colors: {
    background: PALETTE.dark.background as string,
    surface: PALETTE.dark.surface as string,
    surfaceSubtle: PALETTE.dark.surfaceSubtle as string,
    border: PALETTE.dark.border as string,
    text: PALETTE.dark.text as string,
    textMuted: PALETTE.dark.textMuted as string,
    primary: PALETTE.emerald400 as string,
    secondary: PALETTE.violet500 as string,
    destructive: PALETTE.rose500 as string,
    action: PALETTE.blue500 as string,
  },
};

export const LIGHT_THEME = {
  ...BASE_THEME,
  colors: {
    background: PALETTE.light.background as string,
    surface: PALETTE.light.surface as string,
    surfaceSubtle: PALETTE.light.surfaceSubtle as string,
    border: PALETTE.light.border as string,
    text: PALETTE.light.text as string,
    textMuted: PALETTE.light.textMuted as string,
    primary: PALETTE.emerald500 as string,
    secondary: PALETTE.violet500 as string,
    destructive: PALETTE.rose500 as string,
    action: PALETTE.blue500 as string,
  },
};

export type Theme = typeof DARK_THEME;
export let THEME = DARK_THEME;
