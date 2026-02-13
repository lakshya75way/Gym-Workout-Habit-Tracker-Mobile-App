import React, { useState, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Modal,
  Alert,
  ActionSheetIOS,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { THEME } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";
import { RootStackParamList } from "@/navigation/types";
import { useWorkouts, useWorkoutActions } from "../workout.store";
import { Workout } from "../workout.schema";
import { WorkoutCard } from "../components/WorkoutCard";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const DAYS = [
  { id: 1, label: "Mon", full: "Monday" },
  { id: 2, label: "Tue", full: "Tuesday" },
  { id: 4, label: "Wed", full: "Wednesday" },
  { id: 8, label: "Thu", full: "Thursday" },
  { id: 16, label: "Fri", full: "Friday" },
  { id: 32, label: "Sat", full: "Saturday" },
  { id: 64, label: "Sun", full: "Sunday" },
];

export const WeeklyPlanScreen = memo(() => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, themeType } = useTheme();
  const workouts = useWorkouts();
  const { updateWorkout } = useWorkoutActions();

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Get current day of week (shifted to match our bitmask: Mon=1...Sun=64)
  const currentDayIndex = new Date().getDay();
  const initialDayValue =
    currentDayIndex === 0 ? 64 : Math.pow(2, currentDayIndex - 1);

  const [selectedDay, setSelectedDay] = useState(initialDayValue);

  const filteredWorkouts = useMemo(() => {
    return workouts.filter((w) => (w.day_mask & selectedDay) === selectedDay);
  }, [workouts, selectedDay]);

  const availableToAssign = useMemo(() => {
    return workouts.filter((w) => (w.day_mask & selectedDay) !== selectedDay);
  }, [workouts, selectedDay]);

  const selectedDayLabel = useMemo(() => {
    return DAYS.find((d) => d.id === selectedDay)?.full || "";
  }, [selectedDay]);

  const handlePressWorkout = useCallback(
    (workoutId: string) => {
      navigation.navigate("WorkoutDetail", { workoutId });
    },
    [navigation],
  );

  const handleAddExisting = useCallback(
    async (workout: Workout) => {
      try {
        const newMask = workout.day_mask | selectedDay;
        await updateWorkout(workout.id, {
          name: workout.name,
          description: workout.description,
          day_mask: newMask,
          muscle_group: workout.muscle_group,
          image_uri: workout.image_uri,
          video_uri: workout.video_uri,
        });
        setIsLibraryOpen(false);
      } catch (e) {
        Alert.alert("Error", "Failed to assign workout");
      }
    },
    [selectedDay, updateWorkout],
  );

  const handleRemoveFromDay = useCallback(
    async (workout: Workout) => {
      Alert.alert(
        "Remove from Schedule",
        `Do you want to remove "${workout.name}" from your ${selectedDayLabel} schedule?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              try {
                const newMask = workout.day_mask & ~selectedDay; // Remove only this day
                await updateWorkout(workout.id, {
                  ...workout,
                  day_mask: newMask,
                });
              } catch (e) {
                Alert.alert("Error", "Failed to update schedule");
              }
            },
          },
        ],
      );
    },
    [selectedDay, selectedDayLabel, updateWorkout],
  );

  const handleTopAddPress = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Add from Library", "Create New Workout"],
          cancelButtonIndex: 0,
          title: "Manage Schedule",
          message: `Add a workout for ${selectedDayLabel}`,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) setIsLibraryOpen(true);
          else if (buttonIndex === 2) navigation.navigate("CreateWorkout");
        },
      );
    } else {
      Alert.alert("Manage Schedule", "What would you like to do?", [
        { text: "Cancel", style: "cancel" },
        { text: "Add from Library", onPress: () => setIsLibraryOpen(true) },
        {
          text: "Create New Workout",
          onPress: () => navigation.navigate("CreateWorkout"),
        },
      ]);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={themeType === "dark" ? "light-content" : "dark-content"}
      />

      <View style={styles.header}>
        <View>
          <Text
            style={[styles.headerSubtitle, { color: theme.colors.primary }]}
          >
            Weekly Schedule
          </Text>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {selectedDayLabel}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.addBtn,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={handleTopAddPress}
        >
          <Ionicons name="add" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.daySelectorContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelectorScroll}
        >
          {DAYS.map((day) => {
            const isSelected = selectedDay === day.id;
            const isToday = day.id === initialDayValue;

            return (
              <TouchableOpacity
                key={day.id}
                onPress={() => setSelectedDay(day.id)}
                style={[
                  styles.dayChip,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                  isSelected && [
                    styles.dayChipSelected,
                    {
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.primary,
                    },
                  ],
                  isToday &&
                    !isSelected && [
                      styles.dayChipToday,
                      { borderColor: theme.colors.primary + "40" },
                    ],
                ]}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    { color: theme.colors.textMuted },
                    isSelected && [
                      styles.dayLabelSelected,
                      { color: theme.colors.background },
                    ],
                    isToday &&
                      !isSelected && [
                        styles.dayLabelToday,
                        { color: theme.colors.primary },
                      ],
                  ]}
                >
                  {day.label}
                </Text>
                {isToday && (
                  <View
                    style={[
                      styles.todayIndicator,
                      { backgroundColor: theme.colors.primary },
                      isSelected && {
                        backgroundColor: theme.colors.background,
                      },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredWorkouts.length === 0 ? (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={48}
                color={theme.colors.surfaceSubtle}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              Rest Day
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}
            >
              No workouts scheduled for {selectedDayLabel}. Enjoy your recovery!
            </Text>
            <TouchableOpacity
              style={[
                styles.scheduleBtn,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => setIsLibraryOpen(true)}
            >
              <Text
                style={[styles.scheduleBtnText, { color: theme.colors.text }]}
              >
                Assign from Library
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredWorkouts.map((workout) => (
            <View key={workout.id} style={styles.scheduledItem}>
              <View style={styles.cardWrapper}>
                <WorkoutCard workout={workout} onPress={handlePressWorkout} />
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemoveFromDay(workout)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={THEME.colors.destructive}
                />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={isLibraryOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsLibraryOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Your Plans</Text>
            <TouchableOpacity
              onPress={() => setIsLibraryOpen(false)}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={24} color={THEME.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            <Text style={styles.modalSubtitle}>
              Select a plan to add to {selectedDayLabel}
            </Text>

            {availableToAssign.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Text style={styles.modalEmptyText}>
                  All your plans are already scheduled for this day!
                </Text>
              </View>
            ) : (
              availableToAssign.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={styles.assignCard}
                  onPress={() => handleAddExisting(w)}
                >
                  <View style={styles.assignInfo}>
                    <Text style={styles.assignName}>{w.name}</Text>
                    <Text style={styles.assignSubtitle}>{w.muscle_group}</Text>
                  </View>
                  <View style={styles.assignBtn}>
                    <Text style={styles.assignBtnText}>Assign</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  headerSubtitle: {
    ...THEME.typography.small,
    color: THEME.colors.primary,
    letterSpacing: 1.5,
  },
  headerTitle: {
    ...THEME.typography.h1,
    color: THEME.colors.text,
    marginTop: 4,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  daySelectorContainer: {
    height: 80,
    marginBottom: THEME.spacing.md,
  },
  daySelectorScroll: {
    paddingHorizontal: THEME.spacing.lg,
    gap: THEME.spacing.sm,
    alignItems: "center",
  },
  dayChip: {
    width: (width - 48 - 60) / 7 + 15,
    height: 60,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  dayChipSelected: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  dayChipToday: {
    borderColor: THEME.colors.primary + "40",
  },
  dayLabel: {
    ...THEME.typography.caption,
    fontWeight: "700",
    color: THEME.colors.textMuted,
  },
  dayLabelSelected: {
    color: THEME.colors.background,
  },
  dayLabelToday: {
    color: THEME.colors.primary,
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.primary,
    position: "absolute",
    bottom: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: THEME.spacing.xl,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: THEME.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  emptyTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  emptySubtitle: {
    ...THEME.typography.body,
    color: THEME.colors.textMuted,
    textAlign: "center",
    marginBottom: THEME.spacing.xl,
  },
  scheduleBtn: {
    paddingHorizontal: THEME.spacing.xl,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  scheduleBtnText: {
    color: THEME.colors.text,
    fontWeight: "700",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  modalTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text,
  },
  modalSubtitle: {
    ...THEME.typography.body,
    color: THEME.colors.textMuted,
    marginBottom: THEME.spacing.lg,
  },
  modalScroll: {
    padding: THEME.spacing.lg,
  },
  closeBtn: {
    padding: 8,
  },
  assignCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  assignInfo: {
    flex: 1,
  },
  assignName: {
    ...THEME.typography.h3,
    color: THEME.colors.text,
    fontWeight: "700",
  },
  assignSubtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.primary,
    marginTop: 2,
  },
  assignBtn: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.sm,
  },
  assignBtnText: {
    color: THEME.colors.background,
    fontWeight: "700",
    fontSize: 14,
  },
  modalEmpty: {
    padding: THEME.spacing.xxl,
    alignItems: "center",
  },
  modalEmptyText: {
    color: THEME.colors.textMuted,
    textAlign: "center",
    ...THEME.typography.body,
  },
  scheduledItem: {
    position: "relative",
    marginBottom: THEME.spacing.md,
  },
  cardWrapper: {
    width: "100%",
  },
  removeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.surfaceSubtle,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
});
