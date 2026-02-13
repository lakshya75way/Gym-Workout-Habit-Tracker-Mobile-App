import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Switch,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuthStore } from "../auth.store";
import { THEME } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { MMKVStorage } from "@/storage/mmkv";

export const ProfileScreen = () => {
  const { user, signOut } = useAuthStore();
  const { theme, themeType, toggleTheme } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [restTime, setRestTime] = useState(
    MMKVStorage.getItem("default_rest_time") || "60",
  );

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to log out of Forge?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: signOut },
    ]);
  };

  const updateRestTime = (val: string) => {
    const num = parseInt(val);
    if (!isNaN(num) && num > 0) {
      MMKVStorage.setItem("default_rest_time", val);
      setRestTime(val);
    } else if (val === "") {
      setRestTime("");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Ionicons name="person" size={40} color={theme.colors.primary} />
          </View>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {user?.email?.split("@")[0] || "User"}
          </Text>
          <Text style={[styles.userEmail, { color: theme.colors.textMuted }]}>
            {user?.email}
          </Text>
        </View>

        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textMuted }]}
          >
            App Settings
          </Text>

          <View
            style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.surfaceSubtle },
              ]}
            >
              <Ionicons
                name="moon-outline"
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
              Dark Mode
            </Text>
            <Switch
              value={themeType === "dark"}
              onValueChange={toggleTheme}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary + "80",
              }}
              thumbColor={
                themeType === "dark" ? theme.colors.primary : "#f4f3f4"
              }
            />
          </View>

          <View
            style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.surfaceSubtle },
              ]}
            >
              <Ionicons
                name="timer-outline"
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
              Rest Timer (sec)
            </Text>
            <TextInput
              style={{
                color: theme.colors.text,
                backgroundColor: theme.colors.background,
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 8,
                width: 60,
                textAlign: "center",
                fontWeight: "700",
              }}
              keyboardType="number-pad"
              value={restTime}
              onChangeText={updateRestTime}
              maxLength={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate("Reminders")}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.surfaceSubtle },
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
              Notifications
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
            onPress={handleSignOut}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.destructive + "20" },
              ]}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color={theme.colors.destructive}
              />
            </View>
            <Text
              style={[styles.menuItemText, { color: theme.colors.destructive }]}
            >
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: theme.colors.textMuted }]}>
            Forge v1.1.0
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  userName: {
    ...THEME.typography.h2,
    color: THEME.colors.text,
    textTransform: "capitalize",
  },
  userEmail: {
    ...THEME.typography.body,
    color: THEME.colors.textMuted,
    marginTop: THEME.spacing.xs,
  },
  section: {
    padding: THEME.spacing.lg,
  },
  sectionTitle: {
    ...THEME.typography.small,
    color: THEME.colors.textMuted,
    marginBottom: THEME.spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: THEME.borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: THEME.spacing.md,
  },
  menuItemText: {
    flex: 1,
    ...THEME.typography.body,
    fontWeight: "600",
    color: THEME.colors.text,
  },
  footer: {
    marginTop: "auto",
    alignItems: "center",
    paddingBottom: 100,
  },
  versionText: {
    ...THEME.typography.caption,
    color: THEME.colors.textMuted,
  },
  restInput: {
    width: 60,
    textAlign: "center",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: "600",
  },
});
