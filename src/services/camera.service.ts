import * as ImagePicker from "expo-image-picker";
import { PermissionService } from "./permission.service";

export class CameraService {
  static async takePhoto(): Promise<string | null> {
    const hasPermission = await PermissionService.requestCameraAccess();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      return result.assets[0].uri;
    }
    return null;
  }

  static async pickImage(): Promise<string | null> {
    const hasPermission = await PermissionService.requestGalleryAccess();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      return result.assets[0].uri;
    }
    return null;
  }
}
