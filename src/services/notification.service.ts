import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants from "expo-constants";

const isExpoGo = Constants.appOwnership === "expo";

if (!isExpoGo || Platform.OS === "ios") {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {}
}

export const NotificationService = {
  requestPermissions: async () => {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === "granted";
    } catch (error) {
      return true;
    }
  },

  scheduleReminder: async (
    title: string,
    body: string,
    hour: number,
    minute: number,
    weekdays: number[],
  ) => {
    try {
      const hasPermission = await NotificationService.requestPermissions();
      if (!hasPermission) return false;

      await Notifications.cancelAllScheduledNotificationsAsync();

      for (const day of weekdays) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: "default",
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: {
            hour,
            minute,
            weekday: day,
            repeats: true,
          } as Notifications.NotificationTriggerInput,
        });
      }
      return true;
    } catch (error) {
      console.warn("Notification scheduling failed (Expo Go limitation)");
      return false;
    }
  },

  cancelAll: async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {}
  },
};
