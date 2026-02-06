import { supabase } from "./supabase";
import { getDb } from "@/database/db";
import { Logger } from "@/utils/logger";
import { MediaService } from "./media.service";
import { Workout, Exercise } from "@/features/workouts/workout.schema";
import { SessionStatus } from "@/features/sessions/session.schema";
import { ProgressPhoto } from "@/features/progress/progress.repository";
import { Session as SupabaseSession } from "@supabase/supabase-js";

interface LocalSessionRecord {
  id: string;
  user_id: string;
  workout_id: string;
  workout_name?: string;
  start_time: string;
  end_time?: string;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

interface LocalLogRecord {
  id: string;
  user_id: string;
  session_id: string;
  exercise_id: string;
  weight: number;
  reps_completed: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export const SyncService = {
  pushChanges: async (
    userId: string,
    activeSession?: SupabaseSession | null,
  ) => {
    let session = activeSession;
    if (!session) {
      const { data } = await supabase.auth.getSession();
      session = data.session;
    }

    if (!session || session.user.id !== userId) {
      if (session && session.user.id !== userId) {
        Logger.warn("Sync blocked: Session user ID mismatch", {
          expected: userId,
          actual: session.user.id,
        });
      }
      return;
    }

    const db = await getDb();
    const now = new Date().toISOString();

    try {
      const localWorkouts = await db.getAllAsync<Workout>(
        "SELECT * FROM workouts WHERE user_id = ? AND (synced_at IS NULL OR updated_at > synced_at)",
        [userId],
      );

      for (const workout of localWorkouts) {
        let cloudUri = workout.image_uri;

        if (
          workout.image_uri &&
          (workout.image_uri.startsWith("file://") ||
            !workout.image_uri.startsWith("http"))
        ) {
          const uploadedUrl = await MediaService.uploadWorkoutMedia(
            workout.image_uri,
            userId,
          );
          if (uploadedUrl) {
            cloudUri = uploadedUrl;
            await db.runAsync(
              "UPDATE workouts SET image_uri = ? WHERE id = ?",
              [cloudUri, workout.id],
            );
          }
        }

        const { error } = await supabase.from("workouts").upsert({
          id: workout.id,
          user_id: workout.user_id,
          name: workout.name,
          description: workout.description,
          day_mask: workout.day_mask,
          muscle_group: workout.muscle_group,
          image_uri: cloudUri,
          video_uri: workout.video_uri,
          created_at: workout.created_at,
          updated_at: workout.updated_at,
          deleted_at: workout.deleted_at,
        });

        if (!error) {
          await db.runAsync("UPDATE workouts SET synced_at = ? WHERE id = ?", [
            now,
            workout.id,
          ]);
        }
      }

      const localExercises = await db.getAllAsync<Exercise>(
        "SELECT * FROM exercises WHERE user_id = ? AND (synced_at IS NULL OR updated_at > synced_at)",
        [userId],
      );

      for (const ex of localExercises) {
        let cloudUri = ex.image_uri;

        if (
          ex.image_uri &&
          (ex.image_uri.startsWith("file://") ||
            !ex.image_uri.startsWith("http"))
        ) {
          const uploadedUrl = await MediaService.uploadWorkoutMedia(
            ex.image_uri,
            userId,
          );
          if (uploadedUrl) {
            cloudUri = uploadedUrl;
            await db.runAsync(
              "UPDATE exercises SET image_uri = ? WHERE id = ?",
              [cloudUri, ex.id],
            );
          }
        }

        const { error } = await supabase.from("exercises").upsert({
          id: ex.id,
          user_id: ex.user_id,
          workout_id: ex.workout_id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          sort_order: ex.sort_order,
          image_uri: cloudUri,
          video_uri: ex.video_uri,
          created_at: ex.created_at,
          updated_at: ex.updated_at,
          deleted_at: ex.deleted_at,
        });

        if (!error) {
          await db.runAsync("UPDATE exercises SET synced_at = ? WHERE id = ?", [
            now,
            ex.id,
          ]);
        }
      }

      const localSessions = await db.getAllAsync<LocalSessionRecord>(
        "SELECT * FROM sessions WHERE user_id = ? AND (synced_at IS NULL OR updated_at > synced_at)",
        [userId],
      );

      for (const sessionRecord of localSessions) {
        const { error } = await supabase.from("sessions").upsert({
          id: sessionRecord.id,
          user_id: sessionRecord.user_id,
          workout_id: sessionRecord.workout_id,
          workout_name: sessionRecord.workout_name,
          start_time: sessionRecord.start_time,
          end_time: sessionRecord.end_time,
          status: sessionRecord.status,
          created_at: sessionRecord.created_at,
          updated_at: sessionRecord.updated_at,
          deleted_at: sessionRecord.deleted_at,
        });

        if (!error) {
          await db.runAsync("UPDATE sessions SET synced_at = ? WHERE id = ?", [
            now,
            sessionRecord.id,
          ]);
        }
      }

      const localLogs = await db.getAllAsync<LocalLogRecord>(
        "SELECT * FROM logs WHERE user_id = ? AND (synced_at IS NULL OR updated_at > synced_at)",
        [userId],
      );

      for (const log of localLogs) {
        const { error } = await supabase.from("logs").upsert({
          id: log.id,
          user_id: log.user_id,
          session_id: log.session_id,
          exercise_id: log.exercise_id,
          weight: log.weight,
          reps_completed: log.reps_completed,
          created_at: log.created_at,
          updated_at: log.updated_at,
          deleted_at: log.deleted_at,
        });

        if (!error) {
          await db.runAsync("UPDATE logs SET synced_at = ? WHERE id = ?", [
            now,
            log.id,
          ]);
        }
      }

      const localPhotos = await db.getAllAsync<ProgressPhoto>(
        "SELECT * FROM progress_photos WHERE user_id = ? AND (synced_at IS NULL OR updated_at > synced_at)",
        [userId],
      );

      for (const photo of localPhotos) {
        let cloudUri = photo.uri;

        if (photo.uri.startsWith("file://") || !photo.uri.startsWith("http")) {
          const uploadedUrl = await MediaService.uploadProgressPhoto(
            photo.uri,
            userId,
          );
          if (uploadedUrl) {
            cloudUri = uploadedUrl;
            await db.runAsync(
              "UPDATE progress_photos SET uri = ? WHERE id = ?",
              [cloudUri, photo.id],
            );
          }
        }

        const { error } = await supabase.from("progress_photos").upsert({
          id: photo.id,
          user_id: photo.user_id,
          uri: cloudUri,
          taken_at: photo.taken_at,
          note: photo.note,
          session_id: photo.session_id,
          workout_id: photo.workout_id,
          created_at: photo.created_at,
          updated_at: photo.updated_at,
          deleted_at: photo.deleted_at,
        });

        if (!error) {
          await db.runAsync(
            "UPDATE progress_photos SET synced_at = ? WHERE id = ?",
            [now, photo.id],
          );
        }
      }

      Logger.log("Sync changes pushed to cloud");
    } catch (e) {
      Logger.error("Sync push failed", e);
    }
  },

  pullData: async (userId: string, activeSession?: SupabaseSession | null) => {
    let session = activeSession;
    if (!session) {
      const { data } = await supabase.auth.getSession();
      session = data.session;
    }

    if (!session || session.user.id !== userId) {
      return;
    }

    const db = await getDb();
    const now = new Date().toISOString();

    try {
      const tables = [
        "workouts",
        "exercises",
        "sessions",
        "logs",
        "progress_photos",
      ];

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .eq("user_id", userId);

        if (error) throw error;

        if (data && data.length > 0) {
          Logger.log(`Pulling ${data.length} rows from ${table}`);

          for (const row of data) {
            const rowData = row as Record<
              string,
              string | number | boolean | null
            >;
            const columns = Object.keys(rowData);
            const placeholders = columns.map(() => "?").join(", ");
            const values = Object.values(rowData);

            const conflictKeys = ["id"];
            const updateCols = columns
              .filter((c) => !conflictKeys.includes(c))
              .map((c) => `${c} = excluded.${c}`)
              .join(", ");

            await db.runAsync(
              `INSERT INTO ${table} (${columns.join(
                ", ",
              )}) VALUES (${placeholders}) 
               ON CONFLICT(id) DO UPDATE SET ${updateCols}, synced_at = ?`,
              [...values, now],
            );
          }
        }
      }

      Logger.log("Account recovery pull completed successfully");
    } catch (e) {
      Logger.error("Sync pull failed", e);
    }
  },
};
