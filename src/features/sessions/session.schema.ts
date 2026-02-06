import { z } from "zod";

export const SessionStatusSchema = z.enum([
  "active",
  "paused",
  "completed",
  "abandoned",
]);
export type SessionStatus = z.infer<typeof SessionStatusSchema>;

export const SetLogSchema = z.object({
  id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  weight: z.number().min(0),
  reps: z.number().int().min(0),
  completed: z.boolean(),
});

export type SetLog = z.infer<typeof SetLogSchema>;

export const SessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  workout_id: z.string().uuid(),
  workout_name: z.string().optional(),
  start_time: z.string(), // ISO
  end_time: z.string().optional(),
  status: SessionStatusSchema,
  logs: z.array(SetLogSchema),
  paused_duration: z.number().default(0), // Seconds
  paused_at: z.string().optional(), // Timestamp when last paused
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),
});

export type Session = z.infer<typeof SessionSchema>;
