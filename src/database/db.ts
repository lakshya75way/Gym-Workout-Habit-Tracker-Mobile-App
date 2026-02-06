import * as SQLite from "expo-sqlite";
import { MIGRATIONS } from "./schema";

let db: SQLite.SQLiteDatabase | null = null;

export const getDb = async () => {
  if (db) return db;
  db = await SQLite.openDatabaseAsync("gym_tracker.db");
  return db;
};

export const initDatabase = async () => {
  const database = await getDb();

  try {
    const result = await database.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version",
    );
    let currentVersion = result?.user_version ?? 0;

    for (let i = currentVersion; i < MIGRATIONS.length; i++) {
      await database.execAsync(MIGRATIONS[i]);
    }

    await database.execAsync(`PRAGMA user_version = ${MIGRATIONS.length}`);
  } catch (error) {
    console.warn("Migration failed", error);
    throw error;
  }
};

export const purgeAllData = async () => {
  const database = await getDb();
  await database.withTransactionAsync(async () => {
    await database.execAsync("DELETE FROM logs;");
    await database.execAsync("DELETE FROM sessions;");
    await database.execAsync("DELETE FROM exercises;");
    await database.execAsync("DELETE FROM workouts;");
    await database.execAsync("DELETE FROM progress_photos;");
    await database.execAsync("DELETE FROM progress_photos;");
  });
};
