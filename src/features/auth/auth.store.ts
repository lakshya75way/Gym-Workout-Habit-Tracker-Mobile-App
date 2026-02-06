import { create } from "zustand";
import { supabase } from "@/services/supabase";
import { SyncService } from "@/services/sync.service";
import { purgeAllData } from "@/database/db";
import { MMKVStorage } from "@/storage/mmkv";

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  initialize: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  checkSession: async () => {
    set({ isLoading: true });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        if (!user.email_confirmed_at) {
          await supabase.auth.signOut();
          set({ user: null, isAuthenticated: false });
          return;
        }

        set({
          user: { id: user.id, email: user.email! },
          isAuthenticated: true,
        });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch (e) {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error: error.message };

      if (data.user) {
        if (!data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          return { error: "EMAIL_NOT_CONFIRMED" };
        }

        set({
          user: { id: data.user.id, email: data.user.email! },
          isAuthenticated: true,
        });
        await SyncService.pullData(data.user.id);
      }
      return { error: null };
    } catch (e) {
      return { error: "An unexpected error occurred" };
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) return { error: error.message };

      if (data.user && data.session) {
        if (!data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          set({ user: null, isAuthenticated: false });
          return { error: "VERIFICATION_REQUIRED" };
        }

        set({
          user: { id: data.user.id, email: data.user.email! },
          isAuthenticated: true,
        });
        await SyncService.pullData(data.user.id);
      } else if (data.user && !data.session) {
        if (data.user.identities && data.user.identities.length === 0) {
          return { error: "EMAIL_ALREADY_EXISTS" };
        }
        return { error: "VERIFICATION_REQUIRED" };
      }
      return { error: null };
    } catch (e) {
      return { error: "An unexpected error occurred" };
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    const { user } = useAuthStore.getState();
    if (user) {
      await SyncService.pushChanges(user.id);
    }

    MMKVStorage.purgeSettings();
    await purgeAllData();

    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },
  initialize: () => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        `[AUTH] Event: ${event}, User: ${session?.user?.id}, Confirmed: ${session?.user?.email_confirmed_at}`,
      );

      if (session?.user) {
        if (!session.user.email_confirmed_at) {
          console.log(
            "[AUTH] Unverified user detected in listener. Signing out...",
          );
          await supabase.auth.signOut();
          set({ user: null, isAuthenticated: false });
          return;
        }

        set({
          user: { id: session.user.id, email: session.user.email! },
          isAuthenticated: true,
        });

        if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
          SyncService.pullData(session.user.id, session);
        }
      } else if (event === "SIGNED_OUT") {
        set({ user: null, isAuthenticated: false });
      }
    });

    return () => subscription.unsubscribe();
  },
}));
