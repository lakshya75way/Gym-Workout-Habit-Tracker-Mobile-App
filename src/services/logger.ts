export const Logger = {
  log: (message: string, ...args: unknown[]) => {
    if (__DEV__) {
      console.log(`[LOG] ${message}`, ...args);
    }
  },

  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${message}`, error);
  },
};
