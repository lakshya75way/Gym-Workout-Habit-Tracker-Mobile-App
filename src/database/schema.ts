export const MIGRATIONS = [
  `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS workouts (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    day_mask INTEGER DEFAULT 0,
    muscle_group TEXT NOT NULL,
    image_uri TEXT,
    video_uri TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    workout_id TEXT NOT NULL,
    name TEXT NOT NULL,
    sets INTEGER DEFAULT 3,
    reps INTEGER DEFAULT 10,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    deleted_at TEXT,
    FOREIGN KEY (workout_id) REFERENCES workouts (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    workout_id TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    deleted_at TEXT,
    FOREIGN KEY (workout_id) REFERENCES workouts (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    weight REAL,
    reps_completed INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    deleted_at TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS progress_photos (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    uri TEXT NOT NULL,
    taken_at TEXT NOT NULL,
    note TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    deleted_at TEXT
  );
  `,
  `
  ALTER TABLE progress_photos ADD COLUMN session_id TEXT;
  ALTER TABLE progress_photos ADD COLUMN workout_id TEXT;
  `,
  `
  ALTER TABLE sessions ADD COLUMN workout_name TEXT;
  `,
  `
  ALTER TABLE exercises ADD COLUMN image_uri TEXT;
  ALTER TABLE exercises ADD COLUMN video_uri TEXT;
  `,
  `
  ALTER TABLE workouts ADD COLUMN synced_at TEXT;
  ALTER TABLE exercises ADD COLUMN synced_at TEXT;
  ALTER TABLE sessions ADD COLUMN synced_at TEXT;
  ALTER TABLE logs ADD COLUMN synced_at TEXT;
  ALTER TABLE progress_photos ADD COLUMN synced_at TEXT;
  `,
  `
  CREATE TABLE IF NOT EXISTS weight_logs (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    weight REAL NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    synced_at TEXT
  );
  `,
];
