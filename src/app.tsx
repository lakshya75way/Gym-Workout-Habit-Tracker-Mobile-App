import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initDatabase } from "./database/db";
import { RootNavigator } from "./navigation/RootNavigator";
import { View, ActivityIndicator } from "react-native";
import { THEME } from "./theme/theme";
import { ErrorBoundary } from "./components/ErrorBoundary";

const originalError = console.error;
console.error = (...args: unknown[]) => {
  const message = args[0]?.toString() || "";
  if (
    message.includes("expo-notifications") ||
    message.includes("removed from Expo Go") ||
    message.includes("Notifications")
  ) {
    return;
  }
  if (message.includes("Video Load Error")) {
    return;
  }
  originalError(...args);
};

const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const message = args[0]?.toString() || "";
  if (message.includes("MediaTypeOptions") && message.includes("deprecated")) {
    return;
  }
  originalWarn(...args);
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
          backgroundColor: THEME.colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ErrorBoundary>
        <RootNavigator />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
