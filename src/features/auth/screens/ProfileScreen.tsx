import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from "react-native";
import { useAuthStore } from "../auth.store";
import { THEME } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";

export const ProfileScreen = () => {
  const { user, signOut } = useAuthStore();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to log out of Forge?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: signOut,
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={THEME.colors.primary} />
        </View>
        <Text style={styles.userName}>
          {user?.email?.split("@")[0] || "User"}
        </Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("Reminders")}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: THEME.colors.surfaceSubtle },
            ]}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color={THEME.colors.primary}
            />
          </View>
          <Text style={styles.menuItemText}>Notifications & Reminders</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={THEME.colors.textMuted}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: THEME.colors.destructive + "20" },
            ]}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={THEME.colors.destructive}
            />
          </View>
          <Text
            style={[styles.menuItemText, { color: THEME.colors.destructive }]}
          >
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>Forge v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    alignItems: "center",
    paddingVertical: THEME.spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
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
    paddingBottom: THEME.spacing.xl,
  },
  versionText: {
    ...THEME.typography.caption,
    color: THEME.colors.textMuted,
  },
});
