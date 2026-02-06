import { getDb } from "@/database/db";
import { Workout, Exercise, CreateWorkoutDTO } from "./workout.schema";
import { SyncService } from "@/services/sync.service";
// @ts-ignore
import * as Crypto from "expo-crypto";

export class WorkoutRepository {
  static async getAllWorkouts(userId: string): Promise<Workout[]> {
    const db = await getDb();
    const workouts = await db.getAllAsync<Workout>(
      `
      SELECT * FROM workouts 
      WHERE user_id = ? AND deleted_at IS NULL
      ORDER BY created_at DESC
    `,
      [userId],
    );

    const hydratedWorkouts = await Promise.all(
      workouts.map(async (workout) => {
        const exercises = await db.getAllAsync<Exercise>(
          `
          SELECT * FROM exercises WHERE workout_id = ? AND deleted_at IS NULL ORDER BY sort_order ASC
        `,
          [workout.id],
        );
        return { ...workout, exercises };
      }),
    );

    return hydratedWorkouts;
  }

  static async getWorkoutById(
    id: string,
    userId: string,
  ): Promise<Workout | null> {
    const db = await getDb();
    const workout = await db.getFirstAsync<Workout>(
      `
      SELECT * FROM workouts WHERE id = ? AND user_id = ? AND deleted_at IS NULL
    `,
      [id, userId],
    );

    if (!workout) return null;

    const exercises = await db.getAllAsync<Exercise>(
      `
      SELECT * FROM exercises WHERE workout_id = ? AND deleted_at IS NULL ORDER BY sort_order ASC
    `,
      [id],
    );

    return { ...workout, exercises };
  }

  static async createWorkout(
    data: CreateWorkoutDTO,
    userId: string,
  ): Promise<Workout> {
    const db = await getDb();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `
      INSERT INTO workouts (id, user_id, name, description, day_mask, muscle_group, image_uri, video_uri, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        userId,
        data.name,
        data.description || "",
        data.day_mask,
        data.muscle_group,
        data.image_uri || "",
        data.video_uri || "",
        now,
        now,
      ],
    );

    if (data.exercises && data.exercises.length > 0) {
      for (let i = 0; i < data.exercises.length; i++) {
        const ex = data.exercises[i];
        const exId = Crypto.randomUUID();
        await db.runAsync(
          `
          INSERT INTO exercises (id, user_id, workout_id, name, sets, reps, sort_order, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [exId, userId, id, ex.name, ex.sets, ex.reps, i, now, now],
        );
      }
    }

    const created = await this.getWorkoutById(id, userId);
    if (!created) throw new Error("Failed to create workout");
    SyncService.pushChanges(userId);
    return created;
  }

  static async updateWorkout(
    id: string,
    data: CreateWorkoutDTO,
    userId: string,
  ): Promise<Workout> {
    const db = await getDb();
    const now = new Date().toISOString();

    await db.runAsync(
      `
      UPDATE workouts 
      SET name = ?, description = ?, day_mask = ?, muscle_group = ?, image_uri = ?, video_uri = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
      `,
      [
        data.name,
        data.description || "",
        data.day_mask,
        data.muscle_group,
        data.image_uri || "",
        data.video_uri || "",
        now,
        id,
        userId,
      ],
    );

    const updated = await this.getWorkoutById(id, userId);
    if (!updated) throw new Error("Failed to update workout");
    SyncService.pushChanges(userId);
    return updated;
  }

  static async deleteWorkout(id: string, userId: string): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      "UPDATE workouts SET deleted_at = ?, updated_at = ? WHERE id = ? AND user_id = ?",
      [now, now, id, userId],
    );
    SyncService.pushChanges(userId);
  }

  static async addExercise(
    workoutId: string,
    userId: string,
    name: string,
    sets: number,
    reps: number,
    sortOrder: number,
    imageUri?: string,
    videoUri?: string,
  ): Promise<Exercise> {
    const db = await getDb();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `
      INSERT INTO exercises (id, user_id, workout_id, name, sets, reps, sort_order, image_uri, video_uri, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        userId,
        workoutId,
        name,
        sets,
        reps,
        sortOrder,
        imageUri || null,
        videoUri || null,
        now,
        now,
      ],
    );
    SyncService.pushChanges(userId);
    return {
      id,
      user_id: userId,
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
  }

  static async updateExercise(
    id: string,
    userId: string,
    name: string,
    sets: number,
    reps: number,
    imageUri?: string,
    videoUri?: string,
  ): Promise<Exercise> {
    const db = await getDb();
    const now = new Date().toISOString();

    await db.runAsync(
      `
      UPDATE exercises 
      SET name = ?, sets = ?, reps = ?, image_uri = ?, video_uri = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
      `,
      [name, sets, reps, imageUri || null, videoUri || null, now, id, userId],
    );

    const exercise = await db.getFirstAsync<Exercise>(
      `SELECT * FROM exercises WHERE id = ? AND user_id = ?`,
      [id, userId],
    );

    if (!exercise) throw new Error("Failed to update exercise");
    SyncService.pushChanges(userId);
    return exercise;
  }
  static async deleteExercise(id: string, userId: string): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      "UPDATE exercises SET deleted_at = ?, updated_at = ? WHERE id = ? AND user_id = ?",
      [now, now, id, userId],
    );
    SyncService.pushChanges(userId);
  }
}
