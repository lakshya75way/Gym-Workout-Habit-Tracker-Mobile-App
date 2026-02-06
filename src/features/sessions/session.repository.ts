import { getDb } from "@/database/db";
import { Session, SetLog } from "./session.schema";
import { SyncService } from "@/services/sync.service";
import * as Crypto from "expo-crypto";

interface LogRecord {
  id: string;
  user_id: string;
  session_id: string;
  exercise_id: string;
  weight: number;
  reps_completed: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export class SessionRepository {
  static async createSession(
    userId: string,
    workoutId: string,
    startTime: string,
    workoutName: string,
  ): Promise<Session> {
    const db = await getDb();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO sessions (id, user_id, workout_id, start_time, status, created_at, updated_at, workout_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, workoutId, startTime, "active", now, now, workoutName],
    );

    SyncService.pushChanges(userId);

    return {
      id,
      user_id: userId,
      workout_id: workoutId,
      workout_name: workoutName,
      start_time: startTime,
      status: "active",
      logs: [],
      paused_duration: 0,
      created_at: now,
      updated_at: now,
    };
  }

  static async completeSession(
    sessionId: string,
    userId: string,
    endTime: string,
    logs: SetLog[],
  ): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `UPDATE sessions 
         SET status = 'completed', end_time = ?, updated_at = ?
         WHERE id = ? AND user_id = ?`,
        [endTime, now, sessionId, userId],
      );

      for (const log of logs) {
        await db.runAsync(
          `INSERT INTO logs (id, user_id, session_id, exercise_id, weight, reps_completed, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            log.id,
            userId,
            sessionId,
            log.exercise_id,
            log.weight,
            log.reps,
            now,
            now,
          ],
        );
      }
    });

    SyncService.pushChanges(userId);
  }
  static async getSessionWithLogs(
    sessionId: string,
    userId: string,
  ): Promise<Session | null> {
    const db = await getDb();

    const sessionResult = await db.getFirstAsync<Session>(
      "SELECT * FROM sessions WHERE id = ? AND user_id = ?",
      [sessionId, userId],
    );

    if (!sessionResult) return null;

    const logsResult = await db.getAllAsync<
      LogRecord & { exercise_name: string }
    >(
      `SELECT l.*, e.name as exercise_name 
       FROM logs l
       LEFT JOIN exercises e ON l.exercise_id = e.id
       WHERE l.session_id = ? AND l.user_id = ?
       ORDER BY l.created_at ASC`,
      [sessionId, userId],
    );

    console.log(
      `[Repo] getSessionWithLogs: Found ${logsResult.length} logs for session ${sessionId}`,
    );

    return {
      ...sessionResult,
      logs: logsResult.map((l) => ({
        id: l.id,
        exercise_id: l.exercise_id,
        exercise_name: l.exercise_name,
        weight: l.weight,
        reps: l.reps_completed,
        completed: true,
      })),
    };
  }

  static async getAllSessions(userId: string): Promise<Session[]> {
    const db = await getDb();
    const result = await db.getAllAsync<Session>(
      `SELECT * FROM sessions WHERE user_id = ? AND status = 'completed' ORDER BY start_time DESC`,
      [userId],
    );

    return result.map((r) => ({
      ...r,
      logs: [],
    }));
  }
}
