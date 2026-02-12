import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initDatabase } from "./database/db";
import { RootNavigator } from "./navigation/RootNavigator";
import { View, ActivityIndicator } from "react-native";
import { DARK_THEME, THEME } from "./theme/theme";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider, useTheme } from "./theme/ThemeContext";

const originalError = console.error;
// ... (omitting console.error/warn logic for brevity in TargetContent if possible, but I'll replace the App component)

const AppContent = () => {
  const { theme } = useTheme();
  return (
    <SafeAreaProvider>
      <StatusBar style={theme === DARK_THEME ? "light" : "dark"} />
      <ErrorBoundary>
        <RootNavigator />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
};

export function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => setIsReady(true))
      .catch((e) => console.error(e));
  }, []);

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: DARK_THEME.colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={DARK_THEME.colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
