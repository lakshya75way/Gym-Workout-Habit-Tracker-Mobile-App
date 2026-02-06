import { getDb } from "@/database/db";

export interface PersonalRecord {
  exerciseName: string;
  weight: number;
  date: string;
}

export interface DashboardStats {
  commits: number;
  streak: number;
  longestStreak: number;
  totalVolume: number;
  consistencyScore: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export class AnalyticsRepository {
  static async getWorkoutsLast7Days(userId: string): Promise<ChartDataPoint[]> {
    const db = await getDb();
    const result = await db.getAllAsync<{ day: string; count: number }>(
      `
      SELECT strftime('%w', start_time) as day, COUNT(*) as count 
      FROM sessions 
      WHERE user_id = ? 
      AND start_time >= date('now', '-6 days')
      AND (status = 'completed' OR status = 'active')
      GROUP BY day
      `,
      [userId],
    );

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const data = days.map((label) => ({ label, value: 0 }));

    result.forEach((r) => {
      const idx = parseInt(r.day, 10);
      if (!isNaN(idx)) {
        data[idx].value = r.count;
      }
    });

    return data;
  }

  static async getVolumeHistory(userId: string): Promise<ChartDataPoint[]> {
    const db = await getDb();
    const result = await db.getAllAsync<{ date: string; volume: number }>(
      `
      SELECT strftime('%m-%d', s.start_time) as date, SUM(COALESCE(l.weight, 0) * l.reps_completed) as volume
      FROM logs l
      JOIN sessions s ON l.session_id = s.id
      WHERE l.user_id = ?
      AND s.start_time >= date('now', '-30 days')
      GROUP BY date
      ORDER BY s.start_time ASC
      `,
      [userId],
    );

    return result.map((r) => ({
      label: r.date,
      value: r.volume || 0,
    }));
  }

  static async getPersonalRecords(userId: string): Promise<PersonalRecord[]> {
    const db = await getDb();
    const result = await db.getAllAsync<{
      name: string;
      max_weight: number;
      date: string;
    }>(
      `
      SELECT e.name, MAX(l.weight) as max_weight, MAX(s.start_time) as date
      FROM logs l
      JOIN exercises e ON l.exercise_id = e.id
      JOIN sessions s ON l.session_id = s.id
      WHERE l.user_id = ?
      AND l.weight IS NOT NULL
      GROUP BY e.name
      ORDER BY max_weight DESC
      `,
      [userId],
    );

    return result.map((r) => ({
      exerciseName: r.name,
      weight: r.max_weight,
      date: r.date,
    }));
  }

  static async getUserExerciseNames(userId: string): Promise<string[]> {
    const db = await getDb();
    const result = await db.getAllAsync<{ name: string }>(
      `SELECT DISTINCT name FROM exercises WHERE user_id = ?`,
      [userId],
    );
    return result.map((r) => r.name);
  }

  static async getExerciseProgressHistory(
    userId: string,
    exerciseName: string,
  ): Promise<ChartDataPoint[]> {
    const db = await getDb();
    const result = await db.getAllAsync<{ date: string; weight: number }>(
      `
      SELECT strftime('%m-%d', s.start_time) as date, MAX(l.weight) as weight
      FROM logs l
      JOIN exercises e ON l.exercise_id = e.id
      JOIN sessions s ON l.session_id = s.id
      WHERE l.user_id = ?
      AND e.name = ?
      AND l.weight IS NOT NULL
      GROUP BY date
      ORDER BY s.start_time ASC
      LIMIT 10
      `,
      [userId, exerciseName],
    );

    return result.map((r) => ({
      label: r.date,
      value: r.weight,
    }));
  }

  static async getDashboardStats(userId: string): Promise<DashboardStats> {
    const db = await getDb();

    const commitsRes = await db.getFirstAsync<{ total: number }>(
      "SELECT COUNT(*) as total FROM sessions WHERE user_id = ? AND status = 'completed'",
      [userId],
    );
    const commits = commitsRes?.total || 0;

    const volRes = await db.getFirstAsync<{ total: number }>(
      "SELECT SUM(COALESCE(weight, 0) * reps_completed) as total FROM logs WHERE user_id = ?",
      [userId],
    );
    const totalVolume = volRes?.total || 0;

    const consistencyRes = await db.getFirstAsync<{ active_days: number }>(
      `
      SELECT COUNT(DISTINCT date(start_time)) as active_days 
      FROM sessions 
      WHERE user_id = ? 
      AND status = 'completed' 
      AND start_time >= date('now', '-29 days')
      `,
      [userId],
    );
    const activeDaysLast30 = consistencyRes?.active_days || 0;
    const consistencyScore = Math.round((activeDaysLast30 / 30) * 100);

    const sessions = await db.getAllAsync<{ start_time: string }>(
      "SELECT start_time FROM sessions WHERE user_id = ? AND status = 'completed' ORDER BY start_time DESC",
      [userId],
    );

    if (sessions.length === 0) {
      return {
        commits,
        streak: 0,
        longestStreak: 0,
        totalVolume,
        consistencyScore: 0,
      };
    }

    const uniqueDates = Array.from(
      new Set(sessions.map((s) => s.start_time.split("T")[0])),
    )
      .sort()
      .reverse();

    let cStreak = 0;
    let maxStreak = 0;

    const today = new Date();

    const todayStr = today.toISOString().split("T")[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yestStr = yesterday.toISOString().split("T")[0];

    const hasRecent =
      uniqueDates.includes(todayStr) || uniqueDates.includes(yestStr);

    if (hasRecent) {
      cStreak = 1;
      let prevDate = new Date(uniqueDates[0]);
      prevDate.setHours(0, 0, 0, 0);

      for (let i = 1; i < uniqueDates.length; i++) {
        const currDate = new Date(uniqueDates[i]);
        currDate.setHours(0, 0, 0, 0);
        const diffTime = Math.abs(prevDate.getTime() - currDate.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          cStreak++;
          prevDate = currDate;
        } else {
          break;
        }
      }
    }

    if (uniqueDates.length > 0) {
      let tempStreak = 1;
      maxStreak = 1;
      let prevDate = new Date(uniqueDates[0]);
      prevDate.setHours(0, 0, 0, 0);

      for (let i = 1; i < uniqueDates.length; i++) {
        const currDate = new Date(uniqueDates[i]);
        currDate.setHours(0, 0, 0, 0);
        const diffTime = Math.abs(prevDate.getTime() - currDate.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
        maxStreak = Math.max(maxStreak, tempStreak);
        prevDate = currDate;
      }
    }

    return {
      commits,
      streak: cStreak,
      longestStreak: maxStreak,
      totalVolume,
      consistencyScore,
    };
  }
}
