import { create } from "zustand";
import * as Crypto from "expo-crypto";
import { Workout, CreateWorkoutDTO, Exercise } from "./workout.schema";
export type { Exercise };
import { WorkoutRepository } from "./workout.repository";
import { useAuthStore } from "@/features/auth/auth.store";

interface WorkoutState {
  workouts: Workout[];
  isLoading: boolean;
  error: string | null;

  loadWorkouts: () => Promise<void>;
  createWorkout: (data: CreateWorkoutDTO) => Promise<void>;
  updateWorkout: (id: string, data: CreateWorkoutDTO) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  addExercise: (
    workoutId: string,
    name: string,
    sets: number,
    reps: number,
    imageUri?: string,
    videoUri?: string,
  ) => Promise<void>;
  updateExercise: (
    exerciseId: string,
    workoutId: string,
    name: string,
    sets: number,
    reps: number,
    imageUri?: string,
    videoUri?: string,
  ) => Promise<void>;
  deleteExercise: (exerciseId: string, workoutId: string) => Promise<void>;
}

const useStore = create<WorkoutState>((set, get) => ({
  workouts: [],
  isLoading: false,
  error: null,

  loadWorkouts: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ workouts: [] });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const workouts = await WorkoutRepository.getAllWorkouts(user.id);
      set({ workouts, isLoading: false });
    } catch (e) {
      set({ error: "Failed to load workouts", isLoading: false });
    }
  },

  createWorkout: async (data: CreateWorkoutDTO) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ error: "User not authenticated" });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const newWorkout = await WorkoutRepository.createWorkout(data, user.id);
      set((state) => ({
        workouts: [newWorkout, ...state.workouts],
        isLoading: false,
      }));
    } catch (e) {
      set({ error: "Failed to create workout", isLoading: false });
      throw e;
    }
  },

  updateWorkout: async (id: string, data: CreateWorkoutDTO) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ isLoading: true, error: null });
    try {
      const updatedWorkout = await WorkoutRepository.updateWorkout(
        id,
        data,
        user.id,
      );
      set((state) => ({
        workouts: state.workouts.map((w) =>
          w.id === id ? { ...w, ...updatedWorkout } : w,
        ),
        isLoading: false,
      }));
    } catch (e) {
      set({ error: "Failed to update workout", isLoading: false });
      throw e;
    }
  },

  deleteWorkout: async (id: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const previous = get().workouts;
    set((state) => ({
      workouts: state.workouts.filter((w) => w.id !== id),
    }));

    try {
      await WorkoutRepository.deleteWorkout(id, user.id);
    } catch (e) {
      set({ workouts: previous, error: "Failed to delete workout" });
    }
  },

  addExercise: async (
    workoutId: string,
    name: string,
    sets: number,
    reps: number,
    imageUri?: string,
    videoUri?: string,
  ) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const workouts = get().workouts;
    const workout = workouts.find((w) => w.id === workoutId);
    if (!workout) return;

    const sortOrder = workout.exercises?.length || 0;

    const tempId = Crypto.randomUUID();
    const now = new Date().toISOString();
    const optimisticExercise: Exercise = {
      id: tempId,
      user_id: user.id,
      workout_id: workoutId,
      name,
      sets,
      reps,
      sort_order: sortOrder,
      image_uri: imageUri,
      video_uri: videoUri,
      created_at: now,
      updated_at: now,
    };

    const newWorkouts = workouts.map((w) => {
      if (w.id === workoutId) {
        return {
          ...w,
          exercises: [...(w.exercises || []), optimisticExercise],
        };
      }
      return w;
    });

    set({ workouts: newWorkouts });

    try {
      const realExercise = await WorkoutRepository.addExercise(
        workoutId,
        user.id,
        name,
        sets,
        reps,
        sortOrder,
        imageUri,
        videoUri,
      );
      set((state) => ({
        workouts: state.workouts.map((w) => {
          if (w.id === workoutId) {
            return {
              ...w,
              exercises: (w.exercises || []).map((e) =>
                e.id === tempId ? realExercise : e,
              ),
            };
          }
          return w;
        }),
      }));
    } catch (e) {
      set({ workouts, error: "Failed to add exercise" });
    }
  },

  deleteExercise: async (exerciseId: string, workoutId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const workouts = get().workouts;
    set((state) => ({
      workouts: state.workouts.map((w) => {
        if (w.id === workoutId) {
          return {
            ...w,
            exercises: (w.exercises || []).filter((e) => e.id !== exerciseId),
          };
        }
        return w;
      }),
    }));

    try {
      await WorkoutRepository.deleteExercise(exerciseId, user.id);
    } catch (e) {
      set({ workouts, error: "Failed to delete exercise" });
    }
  },

  updateExercise: async (
    exerciseId: string,
    workoutId: string,
    name: string,
    sets: number,
    reps: number,
    imageUri?: string,
    videoUri?: string,
  ) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const workouts = get().workouts;
    const previousWorkouts = [...workouts];

    set({
      workouts: workouts.map((w) => {
        if (w.id === workoutId) {
          return {
            ...w,
            exercises: (w.exercises || []).map((e) =>
              e.id === exerciseId
                ? {
                    ...e,
                    name,
                    sets,
                    reps,
                    image_uri: imageUri,
                    video_uri: videoUri,
                  }
                : e,
            ),
          };
        }
        return w;
      }),
    });

    try {
      await WorkoutRepository.updateExercise(
        exerciseId,
        user.id,
        name,
        sets,
        reps,
        imageUri,
        videoUri,
      );
    } catch (e) {
      set({ workouts: previousWorkouts, error: "Failed to update exercise" });
    }
  },
}));

export const useWorkouts = () => useStore((state) => state.workouts);
export const useWorkoutIsLoading = () => useStore((state) => state.isLoading);
export const useWorkoutError = () => useStore((state) => state.error);

export const useWorkoutActions = () => {
  const loadWorkouts = useStore((state) => state.loadWorkouts);
  const createWorkout = useStore((state) => state.createWorkout);
  const updateWorkout = useStore((state) => state.updateWorkout);
  const deleteWorkout = useStore((state) => state.deleteWorkout);
  const addExercise = useStore((state) => state.addExercise);
  const deleteExercise = useStore((state) => state.deleteExercise);
  const updateExercise = useStore((state) => state.updateExercise);

  return {
    loadWorkouts,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    addExercise,
    deleteExercise,
    updateExercise,
  };
};

export const useWorkoutById = (id: string) => {
  return useStore((state) => state.workouts.find((w) => w.id === id));
};
