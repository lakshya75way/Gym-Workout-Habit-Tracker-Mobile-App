import React from "react";
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { LineChart, BarChart } from "react-native-chart-kit";
import { THEME } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import {
  AnalyticsRepository,
  ChartDataPoint,
  DashboardStats,
  PersonalRecord,
} from "../analytics.repository";
import { useAuthStore } from "@/features/auth/auth.store";
import { useFocusEffect } from "@react-navigation/native";
import { Logger } from "@/utils/logger";

const screenWidth = Dimensions.get("window").width;

const chartConfig = {
  backgroundGradientFrom: THEME.colors.surface,
  backgroundGradientTo: THEME.colors.surface,
  color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(161, 161, 170, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.6,
  useShadowColorFromDataset: false,
  decimalPlaces: 0,
};

export const AnalyticsScreen = () => {
  const user = useAuthStore((state) => state.user);
  const [volumeData, setVolumeData] = React.useState<ChartDataPoint[]>([]);
  const [workoutData, setWorkoutData] = React.useState<ChartDataPoint[]>([]);
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [prs, setPrs] = React.useState<PersonalRecord[]>([]);
  const [exercises, setExercises] = React.useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = React.useState<string | null>(
    null,
  );
  const [historyData, setHistoryData] = React.useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const loadExerciseTrend = async (userId: string, name: string) => {
    try {
      const data = await AnalyticsRepository.getExerciseProgressHistory(
        userId,
        name,
      );
      setHistoryData(data);
    } catch (e) {
      Logger.error("Failed to load exercise trend", e);
    }
  };

  const loadData = React.useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [vData, wData, sData, prData, exList] = await Promise.all([
        AnalyticsRepository.getVolumeHistory(user.id),
        AnalyticsRepository.getWorkoutsLast7Days(user.id),
        AnalyticsRepository.getDashboardStats(user.id),
        AnalyticsRepository.getPersonalRecords(user.id),
        AnalyticsRepository.getUserExerciseNames(user.id),
      ]);
      setVolumeData(vData);
      setWorkoutData(wData);
      setStats(sData);
      setPrs(prData);
      setExercises(exList);

      if (exList.length > 0 && !selectedExercise) {
        setSelectedExercise(exList[0]);
        loadExerciseTrend(user.id, exList[0]);
      } else if (selectedExercise) {
        loadExerciseTrend(user.id, selectedExercise);
      }
    } catch (e) {
      Logger.error("Failed to load analytics", e);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedExercise]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const chartData = {
    labels:
      workoutData.length > 0
        ? workoutData.map((d) => d.label)
        : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data:
          workoutData.length > 0
            ? workoutData.map((d) => d.value)
            : [0, 0, 0, 0, 0, 0, 0],
      },
    ],
  };

  const volumeChartData = {
    labels:
      volumeData.length > 0
        ? volumeData.map((d) => d.label)
        : ["W1", "W2", "W3", "W4"],
    datasets: [
      {
        data:
          volumeData.length > 0 ? volumeData.map((d) => d.value) : [0, 0, 0, 0],
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
      },
    ],
  };

  const strengthChartData = {
    labels: historyData.length > 0 ? historyData.map((d) => d.label) : [],
    datasets: [
      {
        data: historyData.length > 0 ? historyData.map((d) => d.value) : [],
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
      },
    ],
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Analyzing your progress...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.welcomeText}>Insights</Text>
        <Text style={styles.title}>Track Your Growth</Text>
      </View>

      {stats && (
        <View style={styles.badgeContainer}>
          <View
            style={[
              styles.badgeCard,
              {
                borderColor: getBadgeInfo(stats.consistencyScore).color + "40",
                backgroundColor:
                  getBadgeInfo(stats.consistencyScore).color + "10",
              },
            ]}
          >
            <View
              style={[
                styles.badgeIcon,
                { backgroundColor: getBadgeInfo(stats.consistencyScore).color },
              ]}
            >
              <Ionicons
                name={
                  getBadgeInfo(stats.consistencyScore)
                    .icon as keyof typeof Ionicons.glyphMap
                }
                size={24}
                color={THEME.colors.background}
              />
            </View>
            <View style={styles.badgeInfo}>
              <Text style={styles.badgeLabel}>
                Rank: {getBadgeInfo(stats.consistencyScore).title}
              </Text>
              <Text style={styles.badgeDesc}>
                {stats.consistencyScore >= 80
                  ? "You're in the top 5% of athletes! Unstoppable."
                  : stats.consistencyScore >= 50
                    ? "Solid consistency. You're building a massive base."
                    : "Keep showing up. Every session counts towards your goal."}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: THEME.colors.primary + "15" },
            ]}
          >
            <Ionicons name="flame" size={20} color={THEME.colors.primary} />
          </View>
          <Text style={styles.statValue}>{stats?.streak || 0}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>

        <View style={styles.statCard}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: THEME.colors.action + "15" },
            ]}
          >
            <Ionicons name="medal" size={20} color={THEME.colors.action} />
          </View>
          <Text style={styles.statValue}>{stats?.longestStreak || 0}</Text>
          <Text style={styles.statLabel}>Best Streak</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: THEME.colors.secondary + "15" },
            ]}
          >
            <Ionicons
              name="calendar"
              size={20}
              color={THEME.colors.secondary}
            />
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.statValue}>
              {stats?.consistencyScore || 0}%
            </Text>
          </View>
          <Text style={styles.statLabel}>Monthly Consistency</Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${stats?.consistencyScore || 0}%`,
                  backgroundColor: THEME.colors.secondary,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.statCard}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: THEME.colors.textMuted + "15" },
            ]}
          >
            <Ionicons name="trophy" size={20} color={THEME.colors.textMuted} />
          </View>
          <Text style={styles.statValue}>{stats?.commits || 0}</Text>
          <Text style={styles.statLabel}>Total Workouts</Text>
        </View>
      </View>

      {prs.length > 0 && (
        <View style={styles.section}>
          <View style={styles.chartHeader}>
            <Ionicons name="ribbon" size={18} color={THEME.colors.action} />
            <Text style={styles.chartTitle}>Personal Records</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.prScroller}
          >
            {prs.map((pr, index) => (
              <View key={index} style={styles.prCard}>
                <Text style={styles.prWeight}>{pr.weight} kg</Text>
                <Text style={styles.prName} numberOfLines={1}>
                  {pr.exerciseName}
                </Text>
                <Text style={styles.prDate}>
                  {new Date(pr.date).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {exercises.length > 0 && (
        <View style={styles.section}>
          <View style={styles.chartHeader}>
            <Ionicons
              name="trending-up"
              size={18}
              color={THEME.colors.primary}
            />
            <Text style={styles.chartTitle}>Strength Analytics</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.exPicker}
          >
            {exercises.map((ex) => (
              <TouchableOpacity
                key={ex}
                onPress={() => {
                  setSelectedExercise(ex);
                  if (user) loadExerciseTrend(user.id, ex);
                }}
                style={[
                  styles.exTag,
                  selectedExercise === ex && styles.exTagActive,
                ]}
              >
                <Text
                  style={[
                    styles.exTagText,
                    selectedExercise === ex && styles.exTagTextActive,
                  ]}
                >
                  {ex}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.chartWrapper}>
            {historyData.length > 0 ? (
              <LineChart
                data={strengthChartData}
                width={screenWidth - THEME.spacing.lg * 2 - 20}
                height={180}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                }}
                style={styles.chart}
                bezier
              />
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons
                  name="analytics-outline"
                  size={40}
                  color={THEME.colors.surfaceSubtle}
                />
                <Text style={styles.emptyChartText}>
                  No trend data available for this exercise yet.
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.chartSection}>
        <View style={styles.chartHeader}>
          <Ionicons name="bar-chart" size={18} color={THEME.colors.primary} />
          <Text style={styles.chartTitle}>Activity this Week</Text>
        </View>
        <View style={styles.chartWrapper}>
          <BarChart
            data={chartData}
            width={screenWidth - THEME.spacing.lg * 2 - 20}
            height={200}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            style={styles.chart}
            fromZero
            showValuesOnTopOfBars
          />
        </View>
      </View>

      <View style={styles.chartSection}>
        <View style={styles.chartHeader}>
          <Ionicons name="trending-up" size={18} color={THEME.colors.action} />
          <Text style={styles.chartTitle}>Volume Progress</Text>
        </View>
        <View style={styles.chartWrapper}>
          <LineChart
            data={volumeChartData}
            width={screenWidth - THEME.spacing.lg * 2 - 20}
            height={200}
            yAxisLabel=""
            yAxisSuffix="kg"
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            }}
            bezier
            style={styles.chart}
          />
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const getBadgeInfo = (consistency: number) => {
  if (consistency >= 80)
    return {
      title: "Elite Athlete",
      color: THEME.colors.primary,
      icon: "ribbon",
      level: 3,
    };
  if (consistency >= 50)
    return {
      title: "Consistent Grinder",
      color: THEME.colors.secondary,
      icon: "fitness",
      level: 2,
    };
  if (consistency >= 20)
    return {
      title: "Dedicated Novice",
      color: THEME.colors.action,
      icon: "walk",
      level: 1,
    };
  return {
    title: "Getting Started",
    color: THEME.colors.textMuted,
    icon: "star-outline",
    level: 0,
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    paddingHorizontal: THEME.spacing.lg,
  },
  header: {
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
  },
  welcomeText: {
    ...THEME.typography.small,
    color: THEME.colors.primary,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.text,
    marginTop: 4,
  },
  badgeContainer: {
    marginBottom: THEME.spacing.xl,
  },
  badgeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    gap: THEME.spacing.lg,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeInfo: {
    flex: 1,
  },
  badgeLabel: {
    ...THEME.typography.h3,
    color: THEME.colors.text,
    fontWeight: "800",
  },
  badgeDesc: {
    ...THEME.typography.caption,
    color: THEME.colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: "row",
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: THEME.borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
  },
  statValue: {
    ...THEME.typography.h2,
    color: THEME.colors.text,
    fontWeight: "800",
  },
  statLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.textMuted,
    marginTop: 2,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  progressTrack: {
    height: 4,
    backgroundColor: THEME.colors.background,
    borderRadius: 2,
    marginTop: THEME.spacing.md,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
  section: {
    marginBottom: THEME.spacing.xxl,
  },
  prScroller: {
    marginHorizontal: -THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.md,
  },
  prCard: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    width: 140,
    marginRight: THEME.spacing.md,
  },
  prWeight: {
    ...THEME.typography.h3,
    color: THEME.colors.action,
    fontWeight: "900",
  },
  prName: {
    ...THEME.typography.caption,
    color: THEME.colors.text,
    marginTop: 4,
    fontWeight: "700",
  },
  prDate: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  exPicker: {
    marginVertical: THEME.spacing.md,
  },
  exTag: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginRight: THEME.spacing.sm,
    backgroundColor: THEME.colors.surface,
  },
  exTagActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primary + "20",
  },
  exTagText: {
    ...THEME.typography.small,
    color: THEME.colors.textMuted,
  },
  exTagTextActive: {
    color: THEME.colors.primary,
    fontWeight: "700",
  },
  chartSection: {
    marginTop: THEME.spacing.xl,
    marginBottom: THEME.spacing.xxl,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: THEME.spacing.md,
  },
  chartTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text,
  },
  chartWrapper: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: THEME.borderRadius.lg,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: THEME.colors.background,
  },
  loadingText: {
    marginTop: THEME.spacing.md,
    color: THEME.colors.textMuted,
    ...THEME.typography.body,
  },
  emptyChart: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    padding: THEME.spacing.xl,
  },
  emptyChartText: {
    ...THEME.typography.caption,
    color: THEME.colors.textMuted,
    textAlign: "center",
    marginTop: THEME.spacing.sm,
  },
});
