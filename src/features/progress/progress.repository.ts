import { getDb } from "@/database/db";
import * as Crypto from "expo-crypto";

export interface ProgressPhoto {
  id: string;
  user_id: string;
  uri: string;
  taken_at: string;
  note?: string;
  session_id?: string | undefined;
  workout_id?: string | undefined;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

import { SyncService } from "@/services/sync.service";

export class ProgressRepository {
  static async saveProgressPhoto(
    userId: string,
    uri: string,
    dateValue: Date,
    sessionId?: string,
    workoutId?: string,
  ): Promise<ProgressPhoto> {
    const db = await getDb();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();
    const takenAt = dateValue.toISOString();

    await db.runAsync(
      `
      INSERT INTO progress_photos (id, user_id, uri, taken_at, note, session_id, workout_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        userId,
        uri,
        takenAt,
        "",
        sessionId || null,
        workoutId || null,
        now,
        now,
      ],
    );

    SyncService.pushChanges(userId);

    return {
      id,
      user_id: userId,
      uri,
      taken_at: takenAt,
      session_id: sessionId,
      workout_id: workoutId,
      created_at: now,
      updated_at: now,
    };
  }

  static async getAllProgressPhotos(userId: string): Promise<ProgressPhoto[]> {
    const db = await getDb();
    return db.getAllAsync<ProgressPhoto>(
      `
      SELECT * FROM progress_photos 
      WHERE user_id = ? AND deleted_at IS NULL
      ORDER BY taken_at DESC
      `,
      [userId],
    );
  }
  static async deleteProgressPhoto(id: string, userId: string): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      "UPDATE progress_photos SET deleted_at = ?, updated_at = ? WHERE id = ? AND user_id = ?",
      [now, now, id, userId],
    );
  }
}
