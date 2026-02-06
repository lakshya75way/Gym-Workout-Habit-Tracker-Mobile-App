import { z } from "zod";

// --- Primitives ---
export const MuscleGroupSchema = z.enum([
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Arms",
  "Core",
  "Full Body",
  "Cardio",
]);

export type MuscleGroup = z.infer<typeof MuscleGroupSchema>;

// --- Schemas ---

export const ExerciseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  workout_id: z.string().uuid(),
  name: z.string().min(1),
  sets: z.number().int().min(1),
  reps: z.number().int().min(1),
  sort_order: z.number().int(),
  image_uri: z.string().optional(),
  video_uri: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),
});

export const WorkoutSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  day_mask: z.number().int().min(0).max(127), // Bitmask for 7 days
  muscle_group: MuscleGroupSchema,
  image_uri: z.string().optional(),
  video_uri: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),
  exercises: z.array(ExerciseSchema).optional(), // Hydrated relation
});

// --- Derived Types ---
export type Exercise = z.infer<typeof ExerciseSchema>;
export type Workout = z.infer<typeof WorkoutSchema>;

// --- DTOs (Data Transfer Objects for Forms) ---
export const CreateWorkoutSchema = WorkoutSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
  exercises: true,
}).extend({
  exercises: z
    .array(
      ExerciseSchema.omit({ id: true, workout_id: true, sort_order: true }),
    )
    .optional(),
});

export type CreateWorkoutDTO = z.infer<typeof CreateWorkoutSchema>;
