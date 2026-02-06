import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/config";

const _memoryStorage: Record<string, string> = {};

const customStorage = {
  getItem: async (key: string) => {
    try {
      if (AsyncStorage && typeof AsyncStorage.getItem === "function") {
        return await AsyncStorage.getItem(key);
      }
    } catch {}
    return _memoryStorage[key] || null;
  },
  setItem: async (key: string, value: string) => {
    try {
      if (AsyncStorage && typeof AsyncStorage.setItem === "function") {
        return await AsyncStorage.setItem(key, value);
      }
    } catch {}
    _memoryStorage[key] = value;
  },
  removeItem: async (key: string) => {
    try {
      if (AsyncStorage && typeof AsyncStorage.removeItem === "function") {
        return await AsyncStorage.removeItem(key);
      }
    } catch {}
    delete _memoryStorage[key];
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
