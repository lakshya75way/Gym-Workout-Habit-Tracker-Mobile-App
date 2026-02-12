import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useAuthStore } from "../auth.store";
import { THEME } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";

export const LoginScreen = ({
  navigation,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList, "Login">;
}) => {
  const { theme, themeType } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Empty Fields", "Please enter your credentials to continue.");
      return;
    }
    try {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        if (error === "EMAIL_NOT_CONFIRMED") {
          Alert.alert(
            "Verify Your Email",
            "Please check your inbox and verify your email address before logging in.",
          );
        } else {
          Alert.alert("Authentication Failed", error);
        }
      }
    } catch (e: unknown) {
      Alert.alert(
        "Error",
        (e as Error).message || "Something went wrong. Please try again.",
      );
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <StatusBar
          barStyle={themeType === "dark" ? "light-content" : "dark-content"}
        />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View
              style={[
                styles.logoContainer,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Ionicons name="fitness" size={48} color={theme.colors.primary} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Forge
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              Unlock Your Potential
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>
                Email Address
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={theme.colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="you@example.com"
                  placeholderTextColor={theme.colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>
                Password
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: theme.colors.primary },
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.background} />
              ) : (
                <Text
                  style={[
                    styles.buttonText,
                    { color: theme.colors.background },
                  ]}
                >
                  Sign In
                </Text>
              )}
              {!isLoading && (
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={theme.colors.background}
                />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text
              style={[styles.footerText, { color: theme.colors.textMuted }]}
            >
              New to Forge?{" "}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: THEME.spacing.lg,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginTop: 60,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: THEME.borderRadius.lg,
    backgroundColor: THEME.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  title: {
    ...THEME.typography.h1,
    color: THEME.colors.text,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.textMuted,
    marginTop: THEME.spacing.xs,
  },
  form: {
    flex: 1,
    justifyContent: "center",
    marginTop: THEME.spacing.xl,
  },
  inputContainer: {
    marginBottom: THEME.spacing.lg,
  },
  label: {
    ...THEME.typography.small,
    color: THEME.colors.textMuted,
    marginBottom: THEME.spacing.sm,
    paddingLeft: THEME.spacing.xs,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: THEME.spacing.md,
  },
  inputIcon: {
    marginRight: THEME.spacing.sm,
  },
  input: {
    flex: 1,
    height: 56,
    color: THEME.colors.text,
    ...THEME.typography.body,
  },
  button: {
    backgroundColor: THEME.colors.primary,
    height: 56,
    borderRadius: THEME.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: THEME.colors.background,
    fontSize: 18,
    fontWeight: "700" as "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: THEME.spacing.xl,
  },
  footerText: {
    ...THEME.typography.body,
    color: THEME.colors.textMuted,
  },
  linkText: {
    ...THEME.typography.body,
    color: THEME.colors.primary,
    fontWeight: "700" as "700",
  },
});
