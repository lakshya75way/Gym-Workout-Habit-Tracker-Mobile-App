import { create } from "zustand";
import { storage } from "@/storage/mmkv";
import { Logger } from "@/utils/logger";

interface ReminderState {
  isEnabled: boolean;
  hour: number;
  minute: number;
  selectedDays: number[];

  setReminder: (
    enabled: boolean,
    hour: number,
    minute: number,
    days: number[],
  ) => void;
  loadSettings: () => void;
}

const STORAGE_KEY = "workout_reminder_settings";

export const useReminderStore = create<ReminderState>((set) => ({
  isEnabled: false,
  hour: 8,
  minute: 0,
  selectedDays: [2, 3, 4, 5, 6],

  setReminder: (enabled, hour, minute, days) => {
    const settings = { isEnabled: enabled, hour, minute, selectedDays: days };
    storage.set(STORAGE_KEY, JSON.stringify(settings));
    set(settings);
  },

  loadSettings: () => {
    const stored = storage.getString(STORAGE_KEY);
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        set(settings);
      } catch (e) {
        Logger.error("Failed to parse reminder settings", e);
      }
    }
  },
}));
