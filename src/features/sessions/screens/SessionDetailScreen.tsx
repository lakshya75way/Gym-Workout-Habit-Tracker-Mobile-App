import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { THEME } from "@/theme/theme";
import { SessionRepository } from "../session.repository";
import { Session, SetLog } from "../session.schema";
import { useAuthStore } from "@/features/auth/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/navigation/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type SessionDetailRouteProp = RouteProp<RootStackParamList, "SessionDetail">;

export const SessionDetailScreen = () => {
  const route = useRoute<SessionDetailRouteProp>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { sessionId } = route.params;
  const user = useAuthStore((state) => state.user);

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      if (!user) return;
      setIsLoading(true);
      setSession(null); // Clear previous data
      try {
        console.log(`[SessionDetail] Fetching logs for session: ${sessionId}`);
        const data = await SessionRepository.getSessionWithLogs(
          sessionId,
          user.id,
        );
        console.log(`[SessionDetail] Fetched ${data?.logs.length} logs`);
        setSession(data);
      } catch (e) {
        console.error("Failed to load session details", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadDetails();
  }, [sessionId, user]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Session not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const date = new Date(session.start_time).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const duration = session.end_time
    ? Math.floor(
        (new Date(session.end_time).getTime() -
          new Date(session.start_time).getTime()) /
          60000,
      )
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={THEME.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session Summary</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.workoutName}>
            {session.workout_name || "Workout"}
          </Text>
          <Text style={styles.dateText}>{date}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Ionicons
                name="time-outline"
                size={20}
                color={THEME.colors.primary}
              />
              <View>
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>{duration}m</Text>
              </View>
            </View>
            <View style={styles.statBox}>
              <Ionicons
                name="flash-outline"
                size={20}
                color={THEME.colors.secondary}
              />
              <View>
                <Text style={styles.statLabel}>Exercises</Text>
                <Text style={styles.statValue}>{session.logs.length}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Exercise Log</Text>

        {session.logs.map((log, index) => (
          <View key={log.id} style={styles.logItem}>
            <View style={styles.logHeader}>
              <View style={styles.indexBadge}>
                <Text style={styles.indexText}>{index + 1}</Text>
              </View>
              <Text style={styles.exerciseName}>
                {(log as SetLog & { exercise_name?: string }).exercise_name ||
                  "Exercise"}
              </Text>
            </View>
            <View style={styles.logDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Weight</Text>
                <Text style={styles.detailValue}>{log.weight}kg</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Reps</Text>
                <Text style={styles.detailValue}>{log.reps}</Text>
              </View>
              <View style={[styles.detailItem, { flex: 0 }]}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={THEME.colors.primary}
                />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: THEME.spacing.md,
    height: 60,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  headerTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text,
  },
  content: {
    padding: THEME.spacing.lg,
  },
  summaryCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.xl,
  },
  workoutName: {
    ...THEME.typography.h2,
    color: THEME.colors.text,
  },
  dateText: {
    ...THEME.typography.body,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: THEME.spacing.lg,
    gap: THEME.spacing.xl,
  },
  statBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.textMuted,
  },
  statValue: {
    ...THEME.typography.body,
    fontWeight: "700",
    color: THEME.colors.text,
  },
  sectionTitle: {
    ...THEME.typography.small,
    color: THEME.colors.textMuted,
    marginBottom: THEME.spacing.md,
    letterSpacing: 1.2,
  },
  logItem: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
    gap: 12,
  },
  indexBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.colors.surfaceSubtle,
    justifyContent: "center",
    alignItems: "center",
  },
  indexText: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.colors.primary,
  },
  exerciseName: {
    ...THEME.typography.body,
    fontWeight: "600",
    color: THEME.colors.text,
  },
  logDetails: {
    flexDirection: "row",
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.sm,
    padding: THEME.spacing.sm,
    alignItems: "center",
  },
  detailItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.textMuted,
  },
  detailValue: {
    ...THEME.typography.body,
    fontWeight: "700",
    color: THEME.colors.text,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: THEME.colors.background,
  },
  errorText: {
    ...THEME.typography.body,
    color: THEME.colors.textMuted,
    marginBottom: THEME.spacing.md,
  },
  backButton: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: THEME.colors.background,
    fontWeight: "700",
  },
});
