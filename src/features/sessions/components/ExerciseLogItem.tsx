import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { Exercise } from "@/features/workouts/workout.schema";
import { SetLog } from "../session.schema";
import { THEME } from "@/theme/theme";

interface ExerciseLogItemProps {
  exercise: Exercise;
  onLogSet: (weight: number, reps: number) => void;
  logs: SetLog[];
}

export const ExerciseLogItem = ({
  exercise,
  onLogSet,
  logs,
}: ExerciseLogItemProps) => {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState(exercise.reps.toString());

  const handleLog = useCallback(() => {
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);

    if (!isNaN(w) && !isNaN(r) && r > 0) {
      if (w < 0 || w > 1000) {
        Alert.alert(
          "Invalid Weight",
          "Please enter a weight between 0 and 1000kg",
        );
        return;
      }
      if (r > 1000) {
        Alert.alert("Invalid Reps", "Please enter reasonable reps (max 1000)");
        return;
      }
      onLogSet(w, r);
    }
  }, [weight, reps, onLogSet]);

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{exercise.name}</Text>
      <Text style={styles.target}>
        Target: {exercise.sets} sets x {exercise.reps} reps
      </Text>

      <View style={styles.logsContainer}>
        {logs.map((log, index) => (
          <View key={log.id} style={styles.logRow}>
            <Text style={styles.logText}>
              Set {index + 1}: {log.weight}kg x {log.reps}
            </Text>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        ))}
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>kg</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={THEME.colors.textMuted}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>reps</Text>
          <TextInput
            style={styles.input}
            value={reps}
            onChangeText={setReps}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={THEME.colors.textMuted}
          />
        </View>
        <Pressable style={styles.logButton} onPress={handleLog}>
          <Text style={styles.logButtonText}>Log</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.lg,
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  name: {
    color: THEME.colors.text,
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 4,
  },
  target: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginBottom: THEME.spacing.md,
  },
  logsContainer: {
    marginBottom: THEME.spacing.md,
  },
  logRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  logText: {
    color: THEME.colors.text,
    fontSize: 14,
  },
  checkMark: {
    color: THEME.colors.primary,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: THEME.spacing.md,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: THEME.colors.background,
    color: THEME.colors.text,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.sm,
    padding: 8,
    textAlign: "center",
    fontSize: 16,
  },
  logButton: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: THEME.borderRadius.sm,
    marginBottom: 1,
  },
  logButtonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 14,
  },
});
