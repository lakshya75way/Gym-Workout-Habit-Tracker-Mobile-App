const memoryStore = new Map<string, string>();

type MMKVLike = {
  set: (key: string, value: string | number | boolean | null) => void;
  getString: (key: string) => string | undefined;
  getNumber: (key: string) => number | undefined;
  contains: (key: string) => boolean;
  delete: (key: string) => void;
};

const createMemoryStorage = (): MMKVLike => {
  return {
    set: (key, value) => {
      memoryStore.set(key, String(value));
    },
    getString: (key) => {
      return memoryStore.get(key);
    },
    getNumber: (key) => {
      const val = memoryStore.get(key);
      return val ? parseFloat(val) : undefined;
    },
    contains: (key) => {
      return memoryStore.has(key);
    },
    delete: (key) => {
      memoryStore.delete(key);
    },
  };
};

export const storage: MMKVLike = createMemoryStorage();

export enum StorageKeys {
  ACTIVE_SESSION_ID = "active_session_id",
  ACTIVE_SESSION_USER_ID = "active_session_user_id",
  ACTIVE_SESSION_START_TIME = "active_session_start_time",
  ACTIVE_SESSION_PAUSED_DURATION = "active_session_paused_duration",
  ACTIVE_SESSION_PAUSED_AT = "active_session_paused_at",
  ACTIVE_SESSION_WORKOUT_ID = "active_session_workout_id",
  LAST_PUSH_TIMESTAMP = "last_push_timestamp",
  LAST_PULL_TIMESTAMP = "last_pull_timestamp",
}

export const MMKVStorage = {
  setActiveSession: (
    id: string,
    userId: string,
    workoutId: string,
    startTime: string,
  ) => {
    storage.set(StorageKeys.ACTIVE_SESSION_ID, id);
    storage.set(StorageKeys.ACTIVE_SESSION_USER_ID, userId);
    storage.set(StorageKeys.ACTIVE_SESSION_WORKOUT_ID, workoutId);
    storage.set(StorageKeys.ACTIVE_SESSION_START_TIME, startTime);
    if (!storage.contains(StorageKeys.ACTIVE_SESSION_PAUSED_DURATION)) {
      storage.set(StorageKeys.ACTIVE_SESSION_PAUSED_DURATION, 0);
    }
  },

  clearActiveSession: () => {
    storage.delete(StorageKeys.ACTIVE_SESSION_ID);
    storage.delete(StorageKeys.ACTIVE_SESSION_USER_ID);
    storage.delete(StorageKeys.ACTIVE_SESSION_WORKOUT_ID);
    storage.delete(StorageKeys.ACTIVE_SESSION_START_TIME);
    storage.delete(StorageKeys.ACTIVE_SESSION_PAUSED_DURATION);
    storage.delete(StorageKeys.ACTIVE_SESSION_PAUSED_AT);
  },

  getActiveSession: () => {
    const id = storage.getString(StorageKeys.ACTIVE_SESSION_ID);
    const userId = storage.getString(StorageKeys.ACTIVE_SESSION_USER_ID);
    const workoutId = storage.getString(StorageKeys.ACTIVE_SESSION_WORKOUT_ID);
    const startTime = storage.getString(StorageKeys.ACTIVE_SESSION_START_TIME);
    const pausedDuration =
      storage.getNumber(StorageKeys.ACTIVE_SESSION_PAUSED_DURATION) || 0;
    const pausedAt = storage.getString(StorageKeys.ACTIVE_SESSION_PAUSED_AT);

    if (id && userId && workoutId && startTime) {
      return { id, userId, workoutId, startTime, pausedDuration, pausedAt };
    }
    return null;
  },

  setPausedDuration: (duration: number) => {
    storage.set(StorageKeys.ACTIVE_SESSION_PAUSED_DURATION, duration);
  },

  setPausedAt: (timestamp: string | null) => {
    if (timestamp) {
      storage.set(StorageKeys.ACTIVE_SESSION_PAUSED_AT, timestamp);
    } else {
      storage.delete(StorageKeys.ACTIVE_SESSION_PAUSED_AT);
    }
  },

  getLastPush: () => storage.getString(StorageKeys.LAST_PUSH_TIMESTAMP),
  setLastPush: (ts: string) => storage.set(StorageKeys.LAST_PUSH_TIMESTAMP, ts),
  getLastPull: () => storage.getString(StorageKeys.LAST_PULL_TIMESTAMP),
  setLastPull: (ts: string) => storage.set(StorageKeys.LAST_PULL_TIMESTAMP, ts),

  purgeSettings: () => {
    Object.values(StorageKeys).forEach((key) => storage.delete(key));
  },

  getItem: (key: string) => storage.getString(key) || null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
};
