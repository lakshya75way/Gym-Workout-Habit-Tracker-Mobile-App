import React, { useState, useLayoutEffect, useCallback, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  StatusBar,
  TouchableOpacity,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { VideoPlayer } from "@/components/VideoPlayer";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { THEME } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";
import { useWorkoutById, useWorkoutActions, Exercise } from "../workout.store";
import { useSessionActions } from "@/features/sessions/session.store";
import { AddExerciseModal } from "../components/AddExerciseModal";
import { Ionicons } from "@expo/vector-icons";

type WorkoutDetailRouteProp = RouteProp<RootStackParamList, "WorkoutDetail">;

interface EditingExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  imageUri?: string | null | undefined;
  videoUri?: string | null | undefined;
}

export const WorkoutDetailScreen = memo(() => {
  const route = useRoute<WorkoutDetailRouteProp>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { workoutId: id } = route.params;

  const workout = useWorkoutById(id);
  const { duplicateWorkout, deleteWorkout, deleteExercise } =
    useWorkoutActions();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] =
    useState<EditingExercise | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const { theme, themeType } = useTheme();
  const { startSession } = useSessionActions();

  const handleStartSession = useCallback(async () => {
    if (workout) {
      setIsStarting(true);
      try {
        await startSession(id, workout.name);
        navigation.navigate("SessionActive", { sessionId: "active" });
      } finally {
        setIsStarting(false);
      }
    }
  }, [id, workout, startSession, navigation]);

  const handleDuplicate = useCallback(async () => {
    setIsDuplicating(true);
    try {
      await duplicateWorkout(id);
      Alert.alert("Success", "Workout duplicated successfully");
    } catch (e) {
      Alert.alert("Error", "Failed to duplicate workout");
    } finally {
      setIsDuplicating(false);
    }
  }, [duplicateWorkout, id]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Delete Workout",
      "Are you sure you want to permanently remove this workout plan?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Plan",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteWorkout(id);
              navigation.goBack();
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  }, [deleteWorkout, id, navigation]);

  const openAddModal = useCallback(() => {
    setEditingExercise(null);
    setIsModalVisible(true);
  }, []);

  const closeAddModal = useCallback(() => setIsModalVisible(false), []);

  const openEditModal = useCallback((exercise: Exercise) => {
    setEditingExercise({
      id: exercise.id,
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      imageUri: exercise.image_uri,
      videoUri: exercise.video_uri,
    });
    setIsModalVisible(true);
  }, []);

  const handleDeleteExercise = useCallback(
    (exerciseId: string) => {
      Alert.alert(
        "Remove Exercise",
        "This will remove the exercise from this workout plan.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => deleteExercise(exerciseId, id),
          },
        ],
      );
    },
    [deleteExercise, id],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTransparent: true,
      headerTitle: "",
      headerTintColor: "#FFFFFF",
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleDuplicate}
            style={styles.headerAction}
            disabled={isDuplicating}
            hitSlop={15}
          >
            {isDuplicating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="copy-outline" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("EditWorkout", { workoutId: id })
            }
            style={styles.headerAction}
            hitSlop={15}
          >
            <Ionicons name="create-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.headerAction}
            hitSlop={15}
          >
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, handleDelete, handleDuplicate, id, isDuplicating]);

  if (!workout) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Workout not found</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
      >
        <View style={styles.heroContainer}>
          {workout.image_uri ? (
            <Image
              source={{ uri: workout.image_uri }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.heroImage,
                { backgroundColor: theme.colors.surfaceSubtle },
              ]}
            />
          )}
          <View style={styles.heroOverlay} />

          <View style={styles.heroContent}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{workout.muscle_group}</Text>
            </View>
            <Text style={styles.title}>{workout.name}</Text>
            {!!workout.description && (
              <Text style={styles.description}>{workout.description}</Text>
            )}
          </View>
        </View>

        <View style={styles.mainContent}>
          {workout.video_uri && (
            <View
              style={[
                styles.videoCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.videoHeader,
                  { borderBottomColor: theme.colors.border },
                ]}
              >
                <Ionicons
                  name="videocam"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text style={[styles.videoLabel, { color: theme.colors.text }]}>
                  Technique Video
                </Text>
              </View>
              <VideoPlayer uri={workout.video_uri} />
            </View>
          )}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Exercises
              </Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: theme.colors.textMuted },
                ]}
              >
                {workout.exercises?.length || 0} Movements
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.addButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={openAddModal}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.exerciseList}>
            {workout.exercises?.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="fitness-outline"
                  size={48}
                  color={theme.colors.surfaceSubtle}
                />
                <Text
                  style={[styles.emptyText, { color: theme.colors.textMuted }]}
                >
                  No exercises added yet
                </Text>
                <TouchableOpacity onPress={openAddModal}>
                  <Text style={{ color: theme.colors.primary, marginTop: 8 }}>
                    Add your first exercise
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              workout.exercises?.map((ex, index) => (
                <TouchableOpacity
                  key={ex.id}
                  onPress={() => openEditModal(ex)}
                  activeOpacity={0.7}
                  style={[
                    styles.exerciseCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.exerciseRow}>
                    <View
                      style={[
                        styles.thumbnailContainer,
                        { backgroundColor: theme.colors.surfaceSubtle },
                      ]}
                    >
                      {ex.image_uri ? (
                        <Image
                          source={{ uri: ex.image_uri }}
                          style={styles.thumbnail}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.thumbnailPlaceholder}>
                          <Text
                            style={[
                              styles.indexText,
                              { color: theme.colors.textMuted },
                            ]}
                          >
                            {index + 1}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.exerciseInfo}>
                      <Text
                        style={[
                          styles.exerciseName,
                          { color: theme.colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {ex.name}
                      </Text>
                      <Text
                        style={[
                          styles.statValue,
                          { color: theme.colors.textMuted },
                        ]}
                      >
                        {ex.sets} Sets • {ex.reps} Reps
                      </Text>
                    </View>

                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        onPress={() => handleDeleteExercise(ex.id)}
                        style={styles.deleteAction}
                        hitSlop={10}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={THEME.colors.destructive + "80"}
                        />
                      </TouchableOpacity>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={THEME.colors.surfaceSubtle}
                      />
                    </View>
                  </View>

                  {ex.video_uri && (
                    <Pressable style={styles.videoWrapper} onPress={() => {}}>
                      <VideoPlayer uri={ex.video_uri} />
                    </Pressable>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startButton, isStarting && styles.disabledButton]}
          onPress={handleStartSession}
          disabled={isStarting}
        >
          {isStarting ? (
            <ActivityIndicator color={THEME.colors.background} />
          ) : (
            <>
              <View style={styles.buttonIcon}>
                <Ionicons
                  name="play"
                  size={20}
                  color={THEME.colors.background}
                />
              </View>
              <Text style={styles.buttonText}>START WORKOUT</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <AddExerciseModal
        visible={isModalVisible}
        onClose={closeAddModal}
        workoutId={id}
        initialData={editingExercise}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    paddingBottom: 150,
  },
  centered: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: THEME.colors.destructive,
    ...THEME.typography.h3,
  },
  heroContainer: {
    height: 440,
    width: "100%",
    position: "relative",
    backgroundColor: THEME.colors.surface,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  mainContent: {
    paddingHorizontal: THEME.spacing.lg,
    marginTop: -20,
    borderTopLeftRadius: THEME.borderRadius.lg,
    borderTopRightRadius: THEME.borderRadius.lg,
    paddingTop: THEME.spacing.xl,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME.spacing.md,
    marginRight: THEME.spacing.sm,
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.sm,
    alignSelf: "flex-start",
    marginBottom: THEME.spacing.sm,
  },
  badgeText: {
    ...THEME.typography.small,
    color: THEME.colors.background,
    fontWeight: "900",
  },
  title: {
    color: "#FFFFFF",
    ...THEME.typography.h1,
    fontSize: 40,
    lineHeight: 48,
  },
  description: {
    ...THEME.typography.body,
    color: "rgba(255,255,255,0.7)",
    marginTop: THEME.spacing.sm,
  },
  videoCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    overflow: "hidden",
    marginBottom: THEME.spacing.xl,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  videoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  videoLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME.spacing.lg,
  },
  sectionTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text,
  },
  sectionSubtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  exerciseList: {
    gap: THEME.spacing.sm,
  },
  exerciseCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: THEME.spacing.sm,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  thumbnailContainer: {
    width: 60,
    height: 60,
    borderRadius: THEME.borderRadius.sm,
    backgroundColor: THEME.colors.surfaceSubtle,
    overflow: "hidden",
    marginRight: THEME.spacing.md,
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  indexText: {
    ...THEME.typography.caption,
    color: THEME.colors.textMuted,
    fontWeight: "700",
  },
  videoIndicator: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  videoWrapper: {
    marginTop: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.sm,
    overflow: "hidden",
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    ...THEME.typography.body,
    fontWeight: "700",
    color: THEME.colors.text,
  },
  statValue: {
    ...THEME.typography.caption,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME.spacing.sm,
  },
  deleteAction: {
    padding: 8,
  },
  emptyState: {
    paddingVertical: THEME.spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    gap: THEME.spacing.xs,
  },
  emptyText: {
    color: THEME.colors.textMuted,
    ...THEME.typography.body,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: THEME.spacing.lg,
    right: THEME.spacing.lg,
  },
  startButton: {
    backgroundColor: THEME.colors.primary,
    height: 70,
    borderRadius: THEME.borderRadius.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: THEME.spacing.lg,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  buttonText: {
    color: THEME.colors.background,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
  },
  buttonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
