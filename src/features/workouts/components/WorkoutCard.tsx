import React, { memo } from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { Workout } from "../workout.schema";
import { THEME } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

interface WorkoutCardProps {
  workout: Workout;
  onPress: (id: string) => void;
}

export const WorkoutCard = memo(({ workout, onPress }: WorkoutCardProps) => {
  const { theme } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        pressed && styles.pressed,
      ]}
      onPress={() => onPress(workout.id)}
    >
      {workout.image_uri && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: workout.image_uri }}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay} />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.muscleGroup, { color: theme.colors.primary }]}>
            {workout.muscle_group}
          </Text>
          <View
            style={[
              styles.intensityTag,
              { backgroundColor: theme.colors.primary + "15" },
            ]}
          >
            <Ionicons name="flash" size={12} color={theme.colors.primary} />
            <Text
              style={[styles.intensityText, { color: theme.colors.primary }]}
            >
              Active
            </Text>
          </View>
        </View>

        <Text style={[styles.title, { color: theme.colors.text }]}>
          {workout.name}
        </Text>

        {!!workout.description && (
          <Text
            style={[styles.description, { color: theme.colors.textMuted }]}
            numberOfLines={2}
          >
            {workout.description}
          </Text>
        )}

        <View
          style={[
            styles.footer,
            { borderTopColor: theme.colors.border + "50" },
          ]}
        >
          <View style={styles.daysRow}>
            {[
              { l: "S", v: 64 },
              { l: "M", v: 1 },
              { l: "T", v: 2 },
              { l: "W", v: 4 },
              { l: "T", v: 8 },
              { l: "F", v: 16 },
              { l: "S", v: 32 },
            ].map((day, i) => {
              const isActive = (workout.day_mask & day.v) === day.v;
              return (
                <View
                  key={i}
                  style={[
                    styles.dayIndicator,
                    {
                      backgroundColor: theme.colors.surfaceSubtle,
                      borderColor: theme.colors.border,
                    },
                    isActive && {
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: theme.colors.textMuted },
                      isActive && { color: theme.colors.background },
                    ]}
                  >
                    {day.l}
                  </Text>
                </View>
              );
            })}
          </View>

          <View
            style={[
              styles.chevron,
              { backgroundColor: theme.colors.surfaceSubtle },
            ]}
          >
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.primary}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.surface,
    marginBottom: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    width: "100%",
    height: 120,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  content: {
    padding: THEME.spacing.md,
    gap: THEME.spacing.xs,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME.spacing.xs,
  },
  muscleGroup: {
    ...THEME.typography.small,
    color: THEME.colors.primary,
    fontWeight: "700",
  },
  intensityTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.primary + "15",
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.full,
    gap: 4,
  },
  intensityText: {
    ...THEME.typography.small,
    fontSize: 10,
    color: THEME.colors.primary,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.text,
    fontWeight: "700",
  },
  description: {
    ...THEME.typography.caption,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border + "50",
  },
  daysRow: {
    flexDirection: "row",
    gap: 4,
  },
  dayIndicator: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: THEME.colors.surfaceSubtle,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  dayIndicatorActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  dayText: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.colors.textMuted,
  },
  dayTextActive: {
    color: THEME.colors.background,
  },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surfaceSubtle,
    justifyContent: "center",
    alignItems: "center",
  },
});
