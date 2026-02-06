import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { THEME } from "@/theme/theme";
import { SessionRepository } from "../session.repository";
import { Session } from "../session.schema";
import { useAuthStore } from "@/features/auth/auth.store";
import { useWorkoutById } from "@/features/workouts/workout.store";
import { Ionicons } from "@expo/vector-icons";
import { Logger } from "@/utils/logger";

const SessionHistoryItem = ({ session }: { session: Session }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const workout = useWorkoutById(session.workout_id);
  const date = new Date(session.start_time).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = new Date(session.start_time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("SessionDetail", { sessionId: session.id })
      }
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.workoutIconBox}>
          <Ionicons
            name="checkmark-done-circle"
            size={24}
            color={THEME.colors.primary}
          />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.workoutName}>
            {session.workout_name || workout?.name || "Deleted Workout"}
          </Text>
          <Text style={styles.dateText}>
            {date} • {time}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Done</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerStat}>
          <Ionicons
            name="time-outline"
            size={14}
            color={THEME.colors.textMuted}
          />
          <Text style={styles.footerStatText}>Completed</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={THEME.colors.border}
        />
      </View>
    </TouchableOpacity>
  );
};

export const SessionHistoryScreen = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  const loadSessions = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await SessionRepository.getAllSessions(user.id);
      // Sort sessions by date descending
      const sorted = data.sort(
        (a, b) =>
          new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
      );
      setSessions(sorted);
    } catch (e) {
      Logger.error("Failed to load session history", e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions]),
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.subtitle}>Audit Trail</Text>
        <Text style={styles.title}>Workout Log</Text>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SessionHistoryItem session={item} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons
                name="calendar-outline"
                size={64}
                color={THEME.colors.surfaceSubtle}
              />
            </View>
            <Text style={styles.emptyText}>No sessions recorded</Text>
            <Text style={styles.emptySubtext}>
              Finish a workout to see it here.
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
  },
  subtitle: {
    ...THEME.typography.small,
    color: THEME.colors.primary,
    letterSpacing: 1.5,
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.text,
    marginTop: 2,
  },
  list: {
    padding: THEME.spacing.lg,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
  },
  workoutIconBox: {
    width: 44,
    height: 44,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: THEME.spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  workoutName: {
    ...THEME.typography.body,
    fontWeight: "700",
    color: THEME.colors.text,
  },
  dateText: {
    ...THEME.typography.caption,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.primary + "20",
  },
  statusText: {
    ...THEME.typography.small,
    fontSize: 10,
    color: THEME.colors.primary,
    fontWeight: "800",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  footerStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerStatText: {
    ...THEME.typography.caption,
    color: THEME.colors.textMuted,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: THEME.colors.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  emptyText: {
    ...THEME.typography.h3,
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  emptySubtext: {
    ...THEME.typography.body,
    color: THEME.colors.textMuted,
    textAlign: "center",
  },
});
