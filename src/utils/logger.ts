export const Logger = {
  log: (message: string, ...args: unknown[]) => {
    if (__DEV__) {
      console.log(`[LOG] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (__DEV__) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  error: (message: string, error?: unknown) => {
    if (__DEV__) {
      console.error(`[ERROR] ${message}`, error);
    }
  },
};
