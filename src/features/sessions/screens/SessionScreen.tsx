import React, { useCallback, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { THEME } from "@/theme/theme";
import { useActiveSession, useSessionActions } from "../session.store";
import { useTimer } from "../hooks/useTimer";
import { useWorkoutById } from "@/features/workouts/workout.store";
import { useTheme } from "@/theme/ThemeContext";
import { ExerciseLogItem } from "../components/ExerciseLogItem";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "@/features/auth/auth.store";
import { ProgressRepository } from "@/features/progress/progress.repository";
import { PlateCalculatorModal } from "../components/PlateCalculatorModal";

const { width } = Dimensions.get("window");

export const SessionScreen = memo(() => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const session = useActiveSession();
  const { theme, themeType } = useTheme();
  const { endSession, logSet, autoLogRemaining, togglePause } =
    useSessionActions();

  const [isFinishing, setIsFinishing] = React.useState(false);
  const [isCalculatorVisible, setIsCalculatorVisible] = React.useState(false);
  const workout = useWorkoutById(session?.workout_id ?? "");

  const { formattedTime } = useTimer(
    session?.start_time,
    session?.paused_duration,
    session?.paused_at,
  );

  const isPaused = session?.status === "paused";

  React.useEffect(() => {
    return navigation.addListener("beforeRemove", (e) => {
      if (!session) return;
      e.preventDefault();
      Alert.alert("Workout in Progress", "How would you like to proceed?", [
        { text: "Keep Training", style: "cancel" },
        {
          text: "Finish Workout",
          onPress: () => handleFinish(),
        },
        {
          text: "Discard Progress",
          style: "destructive",
          onPress: () => navigation.dispatch(e.data.action),
        },
      ]);
    });
  }, [navigation, session]);

  const finishSession = useCallback(async () => {
    setIsFinishing(true);
    try {
      await endSession();
      navigation.popToTop();
    } finally {
      setIsFinishing(false);
    }
  }, [endSession, navigation]);

  const handlePhotoCapture = useCallback(
    async (useCamera: boolean) => {
      try {
        const permission = useCamera
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Permission Required",
            `${useCamera ? "Camera" : "Gallery"} access is needed to save your progress.`,
          );
          return;
        }

        const result = useCamera
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
            });

        if (
          !result.canceled &&
          result.assets &&
          result.assets.length > 0 &&
          session
        ) {
          const user = useAuthStore.getState().user;
          if (user) {
            try {
              setIsFinishing(true); // Show loading while saving
              await ProgressRepository.saveProgressPhoto(
                user.id,
                result.assets[0].uri,
                new Date(),
                session.id,
                session.workout_id,
              );
            } catch (e) {
              Alert.alert("Error", "Failed to save photo");
            }
          }
        }
        // Always finish session after photo attempt (successful or canceled)
        await finishSession();
      } catch (e) {
        // If something blows up in picker, still try to finish
        await finishSession();
      }
    },
    [session, finishSession],
  );

  const handleFinish = useCallback(async () => {
    // 1. Auto-log remaining sets immediately
    if (workout?.exercises) {
      autoLogRemaining(workout.exercises);
    }

    // 2. Prompt for Progress Photo
    Alert.alert(
      "Workout Complete!",
      "Would you like to capture a progress photo?",
      [
        {
          text: "Skip",
          style: "cancel",
          onPress: finishSession,
        },
        {
          text: "Gallery",
          onPress: () => handlePhotoCapture(false),
        },
        {
          text: "Take Photo",
          onPress: () => handlePhotoCapture(true),
        },
      ],
    );
  }, [workout, autoLogRemaining, finishSession, handlePhotoCapture]);

  if (!session || !workout) {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.colors.background }]}
      >
        <Ionicons
          name="fitness-outline"
          size={64}
          color={theme.colors.surfaceSubtle}
        />
        <Text style={[styles.errorText, { color: theme.colors.textMuted }]}>
          No active session found
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: theme.colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.link, { color: theme.colors.primary }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={themeType === "dark" ? "light-content" : "dark-content"}
      />

      <View
        style={[
          styles.timerHeader,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
          isPaused && [
            styles.timerPaused,
            { backgroundColor: theme.colors.surfaceSubtle + "80" },
          ],
        ]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={togglePause}
            style={[
              styles.controlBtn,
              { backgroundColor: theme.colors.surfaceSubtle },
            ]}
          >
            <Ionicons
              name={isPaused ? "play" : "pause"}
              size={24}
              color={isPaused ? theme.colors.primary : theme.colors.text}
            />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text
              style={[styles.workoutNameLabel, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {workout.name}
            </Text>
            <Text
              style={[
                styles.statusLabel,
                { color: theme.colors.primary },
                isPaused && styles.statusPaused,
              ]}
            >
              {isPaused ? "PAUSED" : "RECORDING"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsCalculatorVisible(true)}
            style={[
              styles.controlBtn,
              { backgroundColor: theme.colors.surfaceSubtle, marginRight: 8 },
            ]}
          >
            <Ionicons
              name="calculator-outline"
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleFinish}
            style={[
              styles.finishHeaderBtn,
              { backgroundColor: theme.colors.destructive + "15" },
            ]}
          >
            <Ionicons name="stop" size={24} color={theme.colors.destructive} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.timerValue, { color: theme.colors.text }]}>
          {formattedTime}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.exerciseSection}>
          {workout.exercises?.map((exercise) => (
            <ExerciseLogItem
              key={exercise.id}
              exercise={exercise}
              onLogSet={(weight, reps) => logSet(exercise.id, weight, reps)}
              logs={session.logs.filter((l) => l.exercise_id === exercise.id)}
            />
          ))}
          {(!workout.exercises || workout.exercises.length === 0) && (
            <View style={styles.emptyState}>
              <Text
                style={[styles.instruction, { color: theme.colors.textMuted }]}
              >
                No exercises in this workout.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.finishBtn, { backgroundColor: theme.colors.primary }]}
          onPress={handleFinish}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.finishBtnText, { color: theme.colors.background }]}
          >
            Finish Workout
          </Text>
          <Ionicons
            name="checkmark-done"
            size={20}
            color={theme.colors.background}
          />
        </TouchableOpacity>
      </View>

      <PlateCalculatorModal
        isVisible={isCalculatorVisible}
        onClose={() => setIsCalculatorVisible(false)}
      />
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  timerHeader: {
    paddingTop: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.lg,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    alignItems: "center",
  },
  timerPaused: {
    backgroundColor: THEME.colors.surfaceSubtle + "80",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: THEME.spacing.sm,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.surfaceSubtle,
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: THEME.spacing.md,
  },
  workoutNameLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text,
    fontWeight: "700",
  },
  statusLabel: {
    ...THEME.typography.small,
    fontSize: 10,
    color: THEME.colors.primary,
    fontWeight: "800",
    letterSpacing: 1,
  },
  statusPaused: {
    color: "#eab308",
  },
  finishHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.destructive + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  timerValue: {
    ...THEME.typography.h1,
    fontSize: 56,
    color: THEME.colors.text,
    fontVariant: ["tabular-nums"],
    letterSpacing: -1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.spacing.lg,
    paddingBottom: 100,
  },
  exerciseSection: {
    gap: THEME.spacing.md,
  },
  emptyState: {
    padding: THEME.spacing.xl,
    alignItems: "center",
  },
  instruction: {
    ...THEME.typography.body,
    color: THEME.colors.textMuted,
    fontStyle: "italic",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: THEME.spacing.lg,
    backgroundColor: THEME.colors.background,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  finishBtn: {
    backgroundColor: THEME.colors.primary,
    height: 56,
    borderRadius: THEME.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  finishBtnText: {
    color: THEME.colors.background,
    fontSize: 18,
    fontWeight: "800",
  },
  centered: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    justifyContent: "center",
    alignItems: "center",
    gap: THEME.spacing.md,
  },
  errorText: {
    ...THEME.typography.h3,
    color: THEME.colors.textMuted,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  link: {
    color: THEME.colors.primary,
    fontWeight: "700",
  },
});
