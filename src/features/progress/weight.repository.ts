import { getDb } from "@/database/db";
import * as Crypto from "expo-crypto";

export interface WeightLog {
  id: string;
  user_id: string;
  weight: number;
  date: string;
}

export class WeightRepository {
  static async saveWeight(
    userId: string,
    weight: number,
    date: Date,
  ): Promise<void> {
    const db = await getDb();
    const id = Crypto.randomUUID();
    const dateStr = date.toISOString();

    await db.runAsync(
      `INSERT INTO weight_logs (id, user_id, weight, date) VALUES (?, ?, ?, ?)`,
      [id, userId, weight, dateStr],
    );
  }

  static async getWeightHistory(userId: string): Promise<WeightLog[]> {
    const db = await getDb();
    return await db.getAllAsync<WeightLog>(
      `SELECT * FROM weight_logs WHERE user_id = ? ORDER BY date DESC LIMIT 30`,
      [userId],
    );
  }

  static async deleteWeight(id: string, userId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(`DELETE FROM weight_logs WHERE id = ? AND user_id = ?`, [
      id,
      userId,
    ]);
  }
}
