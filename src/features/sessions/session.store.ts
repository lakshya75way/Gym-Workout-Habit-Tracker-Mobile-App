import { create } from "zustand";
import * as Crypto from "expo-crypto";
import { Session, SetLog } from "./session.schema";
import { Exercise } from "../workouts/workout.schema";
import { SessionRepository } from "./session.repository";
import { MMKVStorage } from "@/storage/mmkv";
import { useAuthStore } from "@/features/auth/auth.store";
import { Logger } from "@/utils/logger";

interface SessionState {
  activeSession: Session | null;

  startSession: (workoutId: string, workoutName: string) => Promise<void>;
  endSession: () => Promise<void>;
  logSet: (exerciseId: string, weight: number, reps: number) => void;
  autoLogRemaining: (workoutExercises: Exercise[]) => void;
  togglePause: () => void;
  hydrateSession: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,

  autoLogRemaining: (workoutExercises: Exercise[]) => {
    const session = get().activeSession;
    if (!session || !workoutExercises) return;

    workoutExercises.forEach((ex) => {
      const loggedSetsCount = session.logs.filter(
        (l) => l.exercise_id === ex.id,
      ).length;

      // Only auto-log remaining sets if the user has started the exercise (exercises with 0 logs are effectively "skipped")
      if (loggedSetsCount > 0) {
        const remainingSets = Math.max(0, ex.sets - loggedSetsCount);

        for (let i = 0; i < remainingSets; i++) {
          const weight = 0; // Ideally could use last set weight, but 0 is safe for now
          const reps = ex.reps || 0;

          if (reps > 0) {
            get().logSet(ex.id, weight, reps);
          }
        }
      }
    });
  },

  togglePause: () => {
    const session = get().activeSession;
    if (!session) return;

    const now = new Date();
    const isPaused = session.status === "paused";

    let updatedSession = { ...session };

    if (isPaused) {
      const pausedAt = session.paused_at ? new Date(session.paused_at) : now;
      const pauseDurationMs = now.getTime() - pausedAt.getTime();
      const additionalSeconds = Math.floor(pauseDurationMs / 1000);

      updatedSession.status = "active";
      updatedSession.paused_duration =
        (session.paused_duration || 0) + additionalSeconds;
      updatedSession.paused_at = undefined;
      updatedSession.updated_at = now.toISOString();

      MMKVStorage.setPausedDuration(updatedSession.paused_duration);
      MMKVStorage.setPausedAt(null);
    } else {
      // PAUSING
      updatedSession.status = "paused";
      updatedSession.paused_at = now.toISOString();
      updatedSession.updated_at = now.toISOString();

      MMKVStorage.setPausedAt(now.toISOString());
    }

    set({ activeSession: updatedSession });
  },

  hydrateSession: () => {
    const persisted = MMKVStorage.getActiveSession();
    const user = useAuthStore.getState().user;

    if (persisted && user) {
      if (persisted.userId !== user.id) {
        MMKVStorage.clearActiveSession();
        return;
      }

      const now = new Date().toISOString();
      const isPaused = !!persisted.pausedAt;

      // Optimistically restore basic session from MMKV
      const session: Session = {
        id: persisted.id,
        user_id: user.id,
        workout_id: persisted.workoutId,
        workout_name: "", // Will be populated if possible or irrelevant for active
        start_time: persisted.startTime,
        status: isPaused ? "paused" : "active",
        logs: [], // Init empty, will fetch below
        paused_duration: persisted.pausedDuration,
        paused_at: persisted.pausedAt || undefined,
        created_at: persisted.startTime,
        updated_at: now,
      };
      set({ activeSession: session });

      // Async fetch logs to restore full state
      SessionRepository.getSessionWithLogs(persisted.id, user.id).then(
        (fullSession) => {
          if (fullSession) {
            set((state) => ({
              activeSession: state.activeSession
                ? { ...state.activeSession, logs: fullSession.logs }
                : null,
            }));
          }
        },
      );
    }
  },

  startSession: async (workoutId: string, workoutName: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const startTime = new Date().toISOString();

    try {
      const session = await SessionRepository.createSession(
        user.id,
        workoutId,
        startTime,
        workoutName,
      );

      MMKVStorage.setActiveSession(session.id, user.id, workoutId, startTime);

      set({ activeSession: session });
    } catch (e) {
      Logger.error("Failed to start session", e);
    }
  },

  endSession: async () => {
    const session = get().activeSession;
    const user = useAuthStore.getState().user;

    if (!session || !user) return;

    const endTime = new Date().toISOString();

    set((state) => ({
      activeSession: state.activeSession
        ? { ...state.activeSession, status: "completed", end_time: endTime }
        : null,
    }));

    MMKVStorage.clearActiveSession();

    try {
      await SessionRepository.completeSession(
        session.id,
        user.id,
        endTime,
        session.logs,
      );
    } catch (e) {
      Logger.error("Failed to complete session", e);
    }

    set({ activeSession: null });
  },

  logSet: (exerciseId: string, weight: number, reps: number) => {
    const session = get().activeSession;
    if (!session) return;

    const newLog: SetLog = {
      id: Crypto.randomUUID(),
      exercise_id: exerciseId,
      weight,
      reps,
      completed: true,
    };

    set({
      activeSession: {
        ...session,
        logs: [...session.logs, newLog],
      },
    });
  },
}));

export const useActiveSession = () =>
  useSessionStore((state) => state.activeSession);
export const useSessionActions = () => {
  const startSession = useSessionStore((state) => state.startSession);
  const endSession = useSessionStore((state) => state.endSession);
  const logSet = useSessionStore((state) => state.logSet);
  const autoLogRemaining = useSessionStore((state) => state.autoLogRemaining);
  const togglePause = useSessionStore((state) => state.togglePause);
  const hydrateSession = useSessionStore((state) => state.hydrateSession);
  return {
    startSession,
    endSession,
    logSet,
    autoLogRemaining,
    togglePause,
    hydrateSession,
  };
};
