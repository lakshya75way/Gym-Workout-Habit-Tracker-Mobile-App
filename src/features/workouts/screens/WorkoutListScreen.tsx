import React, { useEffect, useCallback, useLayoutEffect, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ListRenderItem,
  Pressable,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { THEME } from "@/theme/theme";
import { useWorkouts, useWorkoutActions } from "../workout.store";
import { WorkoutCard } from "../components/WorkoutCard";
import { Workout } from "../workout.schema";
import { RootStackParamList } from "@/navigation/types";
import { Ionicons } from "@expo/vector-icons";

export const WorkoutListScreen = memo(() => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const workouts = useWorkouts();
  const { loadWorkouts } = useWorkoutActions();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>My Workouts</Text>
        </View>
      ),
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate("CreateWorkout")}
          style={styles.headerIconButton}
        >
          <Ionicons name="add" size={24} color={THEME.colors.primary} />
        </Pressable>
      ),
      headerLeft: () => (
        <Pressable
          onPress={() => navigation.navigate("Reminders")}
          style={styles.headerIconButton}
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color={THEME.colors.text}
          />
        </Pressable>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  const handlePressWorkout = useCallback(
    (workoutId: string) => {
      navigation.navigate("WorkoutDetail", { workoutId });
    },
    [navigation],
  );

  const renderItem: ListRenderItem<Workout> = useCallback(
    ({ item }) => <WorkoutCard workout={item} onPress={handlePressWorkout} />,
    [handlePressWorkout],
  );

  const keyExtractor = useCallback((item: Workout) => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={workouts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Keep it up!</Text>
            <Text style={styles.welcomeSubtitle}>
              You have {workouts.length} active plans
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons
                name="leaf-outline"
                size={64}
                color={THEME.colors.surfaceSubtle}
              />
            </View>
            <Text style={styles.emptyText}>No workouts yet</Text>
            <Text style={styles.emptySubtext}>
              Your journey starts with the first plan.
            </Text>
            <Pressable
              style={styles.createButton}
              onPress={() => navigation.navigate("CreateWorkout")}
            >
              <Text style={styles.createButtonText}>
                Create Your First Workout
              </Text>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text,
    fontWeight: "800",
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
  },
  welcomeContainer: {
    marginBottom: THEME.spacing.xl,
  },
  welcomeTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text,
  },
  welcomeSubtitle: {
    ...THEME.typography.body,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    padding: THEME.spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
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
    marginBottom: THEME.spacing.xl,
  },
  createButton: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.xl,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
  },
  createButtonText: {
    color: THEME.colors.background,
    fontWeight: "700",
    fontSize: 16,
  },
});
