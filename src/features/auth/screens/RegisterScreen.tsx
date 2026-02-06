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
import { Ionicons } from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";

export const RegisterScreen = ({
  navigation,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList, "Register">;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signUp, isLoading } = useAuthStore();

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert(
        "Fields Required",
        "Please provide an email and password to create your account.",
      );
      return;
    }
    if (password.length < 6) {
      Alert.alert(
        "Weak Password",
        "Password must be at least 6 characters long.",
      );
      return;
    }
    try {
      const { error } = await signUp(email.trim(), password);
      if (error) {
        if (error === "VERIFICATION_REQUIRED") {
          Alert.alert(
            "Verify Your Email",
            "A verification link has been sent to your email. Please verify your account before logging in.",
            [{ text: "OK", onPress: () => navigation.navigate("Login") }],
          );
        } else if (error === "EMAIL_ALREADY_EXISTS") {
          Alert.alert(
            "Account Exists",
            "An account with this email already exists. Would you like to sign in instead?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Sign In", onPress: () => navigation.navigate("Login") },
            ],
          );
        } else {
          Alert.alert("Registration Failed", error);
        }
        return;
      }
      Alert.alert("Success", "Your account has been created! Please sign in.");
      navigation.navigate("Login");
    } catch (e: unknown) {
      Alert.alert(
        "Registration Failed",
        (e as Error).message || "An unexpected error occurred.",
      );
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <StatusBar barStyle="light-content" />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={THEME.colors.text}
              />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Ionicons name="rocket" size={40} color={THEME.colors.primary} />
            </View>
            <Text style={styles.title}>Join Forge</Text>
            <Text style={styles.subtitle}>
              Start your fitness journey today
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={THEME.colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={THEME.colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Create Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={THEME.colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={THEME.colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={THEME.colors.background} />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
              {!isLoading && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={THEME.colors.background}
                />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.linkText}>Sign In</Text>
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
    marginTop: 40,
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: THEME.borderRadius.md,
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
