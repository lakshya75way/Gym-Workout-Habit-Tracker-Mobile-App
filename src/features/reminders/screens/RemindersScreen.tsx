import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { NotificationService } from "@/services/notification.service";
import { THEME } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useReminderStore } from "../reminder.store";

const DAYS = [
  { id: 1, label: "S" },
  { id: 2, label: "M" },
  { id: 3, label: "T" },
  { id: 4, label: "W" },
  { id: 5, label: "T" },
  { id: 6, label: "F" },
  { id: 7, label: "S" },
];

export const RemindersScreen = () => {
  const { theme, themeType } = useTheme();
  const { isEnabled, hour, minute, selectedDays, setReminder, loadSettings } =
    useReminderStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const schedule = useCallback(
    async (enabled: boolean, h: number, m: number, days: number[]) => {
      if (!enabled) {
        await NotificationService.cancelAll();
        return;
      }

      const success = await NotificationService.scheduleReminder(
        "Workout Time!",
        "Time to crush your goals!",
        h,
        m,
        days,
      );

      if (!success) {
        Alert.alert(
          "Permission Denied",
          "Please enable notifications in your system settings.",
        );
        setReminder(false, h, m, days);
      }
    },
    [setReminder],
  );

  const handleToggle = (value: boolean) => {
    setReminder(value, hour, minute, selectedDays);
    schedule(value, hour, minute, selectedDays);
  };

  const handleTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      const h = date.getHours();
      const m = date.getMinutes();
      setReminder(isEnabled, h, m, selectedDays);
      if (isEnabled) {
        schedule(isEnabled, h, m, selectedDays);
      }
    }
  };

  const toggleDay = (dayId: number) => {
    let newDays: number[];
    if (selectedDays.includes(dayId)) {
      newDays = selectedDays.filter((d) => d !== dayId);
    } else {
      newDays = [...selectedDays, dayId].sort();
    }
    setReminder(isEnabled, hour, minute, newDays);
    if (isEnabled) {
      schedule(isEnabled, hour, minute, newDays);
    }
  };

  const currentTime = new Date();
  currentTime.setHours(hour);
  currentTime.setMinutes(minute);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={themeType === "dark" ? "light-content" : "dark-content"}
      />

      <View style={styles.header}>
        <Text style={[styles.subtitle, { color: theme.colors.primary }]}>
          Stay Consistent
        </Text>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Daily Echo
        </Text>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={[styles.row, { borderBottomColor: theme.colors.border }]}>
          <View style={styles.labelContainer}>
            <Ionicons
              name="notifications"
              size={22}
              color={theme.colors.primary}
            />
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Enable Alerts
            </Text>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={handleToggle}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primary,
            }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.daySection}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textMuted }]}
          >
            Active Days
          </Text>
          <View style={styles.daysRow}>
            {DAYS.map((day) => {
              const isActive = selectedDays.includes(day.id);
              return (
                <Pressable
                  key={day.id}
                  style={[
                    styles.dayCircle,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                    },
                    isActive && [
                      styles.dayCircleActive,
                      {
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.primary,
                      },
                    ],
                  ]}
                  onPress={() => toggleDay(day.id)}
                >
                  <Text
                    style={[
                      styles.dayLabel,
                      { color: theme.colors.text },
                      isActive && [
                        styles.dayLabelActive,
                        { color: theme.colors.background },
                      ],
                    ]}
                  >
                    {day.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.pickerSection}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textMuted }]}
          >
            Preferred Time
          </Text>
          <View
            style={[
              styles.pickerWrapper,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <DateTimePicker
              value={currentTime}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
              textColor={theme.colors.text}
              style={styles.picker}
            />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Consistency is the key to progress.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.xl,
  },
  subtitle: {
    ...THEME.typography.small,
    color: THEME.colors.primary,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    ...THEME.typography.h1,
    color: THEME.colors.text,
    marginTop: 4,
  },
  card: {
    marginHorizontal: THEME.spacing.lg,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME.spacing.xl,
    paddingBottom: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  label: {
    ...THEME.typography.h3,
    color: THEME.colors.text,
  },
  sectionTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: THEME.spacing.md,
    fontSize: 10,
    fontWeight: "800",
  },
  daySection: {
    marginBottom: THEME.spacing.xl,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  dayCircleActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  dayLabel: {
    ...THEME.typography.small,
    color: THEME.colors.text,
    fontWeight: "700",
  },
  dayLabelActive: {
    color: THEME.colors.background,
  },
  pickerWrapper: {
    alignItems: "center",
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: "hidden",
  },
  picker: {
    height: 180,
    width: "100%",
  },
  footer: {
    marginTop: "auto",
    padding: THEME.spacing.xxl,
    alignItems: "center",
  },
  footerText: {
    ...THEME.typography.caption,
    color: THEME.colors.surfaceSubtle,
    fontStyle: "italic",
  },
  pickerSection: {},
});
