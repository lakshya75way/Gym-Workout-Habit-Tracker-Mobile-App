export class TimerService {
  static getElapsedSeconds(
    startTime: string,
    pausedDurationSeconds: number = 0,
  ): number {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const diff = now - start;
    const seconds = Math.floor(diff / 1000);
    return Math.max(0, seconds - pausedDurationSeconds);
  }

  static formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }
}
