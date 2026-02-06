import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { THEME } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { Logger } from "@/utils/logger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Logger.error("Uncaught error:", error);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons
            name="alert-circle"
            size={64}
            color={THEME.colors.destructive}
          />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || "An unexpected error occurred."}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: THEME.spacing.xl,
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.text,
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
  },
  message: {
    ...THEME.typography.body,
    color: THEME.colors.textMuted,
    textAlign: "center",
    marginBottom: THEME.spacing.xl,
  },
  button: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.xl,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
  },
  buttonText: {
    ...THEME.typography.h3,
    color: THEME.colors.background,
    fontWeight: "800",
  },
});
