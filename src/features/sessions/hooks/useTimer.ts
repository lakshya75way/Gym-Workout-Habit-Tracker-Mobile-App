import { useState, useEffect } from "react";
import { TimerService } from "@/services/timer.service";

export const useTimer = (
  startTime: string | undefined,
  pausedDuration: number = 0,
  pausedAt: string | undefined = undefined,
) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;

    const calculate = () => {
      if (pausedAt) {
        // If paused, time is Fixed: (PausedAt - StartTime) - PausedDuration
        // We use TimerService logic but simulate "now" as "pausedAt"
        const start = new Date(startTime).getTime();
        const end = new Date(pausedAt).getTime();
        const diff = end - start;
        const seconds = Math.floor(diff / 1000);
        return Math.max(0, seconds - pausedDuration);
      } else {
        return TimerService.getElapsedSeconds(startTime, pausedDuration);
      }
    };

    // Initial
    setElapsed(calculate());

    if (!pausedAt) {
      const interval = setInterval(() => {
        setElapsed(calculate());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, pausedDuration, pausedAt]);

  return {
    elapsedSeconds: elapsed,
    formattedTime: TimerService.formatTime(elapsed),
  };
};
