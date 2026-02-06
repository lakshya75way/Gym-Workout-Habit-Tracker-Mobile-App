import * as ImagePicker from "expo-image-picker";
import { Alert, Linking } from "react-native";

export class PermissionService {
  static async requestCameraAccess(): Promise<boolean> {
    const { status, canAskAgain } =
      await ImagePicker.requestCameraPermissionsAsync();

    if (status === "granted") return true;

    if (!canAskAgain) {
      PermissionService.showSettingsAlert("Camera");
    }
    return false;
  }

  static async requestGalleryAccess(): Promise<boolean> {
    const { status, canAskAgain } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status === "granted") return true;

    if (!canAskAgain) {
      PermissionService.showSettingsAlert("Photo Gallery");
    }
    return false;
  }

  private static showSettingsAlert(feature: string) {
    Alert.alert(
      `${feature} Permission Required`,
      `This app needs access to your ${feature.toLowerCase()} to capture workout progress. Please enable it in settings.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ],
    );
  }
}
