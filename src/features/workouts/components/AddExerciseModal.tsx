import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  Alert,
  Image,
  TouchableOpacity,
  Platform,
  ActionSheetIOS,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/theme/theme";
import { useWorkoutActions } from "../workout.store";
import { sanitizeInput } from "@/utils/sanitization";

interface AddExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  workoutId: string;
  initialData?: {
    id: string;
    name: string;
    sets: number;
    reps: number;
    imageUri?: string | null | undefined;
    videoUri?: string | null | undefined;
  } | null;
}

export const AddExerciseModal = ({
  visible,
  onClose,
  workoutId,
  initialData,
}: AddExerciseModalProps) => {
  const { addExercise, updateExercise } = useWorkoutActions();
  const [name, setName] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");

  const [videoUri, setVideoUri] = useState("");
  const [pickerUri, setPickerUri] = useState<string | null>(null);
  const [externalUri, setExternalUri] = useState("");
  const [useExternal, setUseExternal] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setName(initialData.name);
        setSets(initialData.sets.toString());
        setReps(initialData.reps.toString());
        setVideoUri(initialData?.videoUri || "");

        const img = initialData.imageUri || "";
        if (img.startsWith("http")) {
          setExternalUri(img);
          setPickerUri(null);
          setUseExternal(true);
        } else if (img) {
          setPickerUri(img);
          setExternalUri("");
          setUseExternal(false);
        } else {
          setPickerUri(null);
          setExternalUri("");
          setUseExternal(false);
        }
      } else {
        setName("");
        setSets("3");
        setReps("10");
        setVideoUri("");
        setPickerUri(null);
        setExternalUri("");
        setUseExternal(false);
      }
    }
  }, [visible, initialData]);

  const handleImagePick = async (useCamera: boolean) => {
    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission",
          `Access to ${useCamera ? "camera" : "gallery"} is required.`,
        );
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
          });

      if (!result.canceled) {
        setPickerUri(result.assets[0].uri);
        setUseExternal(false);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to acquire image.");
    }
  };

  const showImageOptions = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Camera", "Gallery", "Direct URL"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleImagePick(true);
          else if (buttonIndex === 2) handleImagePick(false);
          else if (buttonIndex === 3) setUseExternal(true);
        },
      );
    } else {
      Alert.alert("Select Source", "Choose image source", [
        { text: "Camera", onPress: () => handleImagePick(true) },
        { text: "Gallery", onPress: () => handleImagePick(false) },
        { text: "Direct URL", onPress: () => setUseExternal(true) },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const handleSave = async () => {
    const sanitizedName = sanitizeInput(name);
    if (!sanitizedName) {
      Alert.alert("Error", "Please enter an exercise name");
      return;
    }

    const s = parseInt(sets);
    const r = parseInt(reps);

    if (isNaN(s) || s <= 0 || s > 100) {
      Alert.alert("Error", "Sets must be between 1 and 100");
      return;
    }

    if (isNaN(r) || r <= 0 || r > 1000) {
      Alert.alert("Error", "Reps must be between 1 and 1000");
      return;
    }

    const finalImageUri = useExternal ? externalUri.trim() : pickerUri;

    setIsSubmitting(true);
    try {
      if (initialData) {
        await updateExercise(
          initialData.id,
          workoutId,
          sanitizedName,
          s,
          r,
          finalImageUri || undefined,
          videoUri.trim() || undefined,
        );
      } else {
        await addExercise(
          workoutId,
          sanitizedName,
          s,
          r,
          finalImageUri || undefined,
          videoUri.trim() || undefined,
        );
      }
      onClose();
    } catch (e) {
      Alert.alert("Error", "Failed to save exercise");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>
            {initialData ? "Edit Exercise" : "Add Exercise"}
          </Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Bench Press"
            placeholderTextColor={THEME.colors.textMuted}
            autoFocus={!initialData}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Sets</Text>
              <TextInput
                style={styles.input}
                value={sets}
                onChangeText={setSets}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Reps</Text>
              <TextInput
                style={styles.input}
                value={reps}
                onChangeText={setReps}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.label}>Visual Reference</Text>
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={showImageOptions}
            activeOpacity={0.8}
          >
            {(useExternal && externalUri) || (!useExternal && pickerUri) ? (
              <Image
                source={{
                  uri: useExternal ? externalUri : pickerUri!,
                }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.pickerPlaceholder}>
                <Ionicons
                  name="camera-outline"
                  size={24}
                  color={THEME.colors.primary}
                />
                <Text style={styles.pickerText}>Select Image</Text>
              </View>
            )}
          </TouchableOpacity>

          {useExternal && (
            <View style={styles.urlInputContainer}>
              <TextInput
                style={styles.input}
                value={externalUri}
                onChangeText={setExternalUri}
                placeholder="https://..."
                placeholderTextColor={THEME.colors.textMuted}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.closeUrlBtn}
                onPress={() => {
                  setUseExternal(false);
                  setExternalUri("");
                }}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={THEME.colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          )}

          <Text style={[styles.label, { marginTop: THEME.spacing.md }]}>
            Video URL (Optional)
          </Text>
          <TextInput
            style={styles.input}
            value={videoUri}
            onChangeText={setVideoUri}
            placeholder="YouTube or MP4 link"
            placeholderTextColor={THEME.colors.textMuted}
            autoCapitalize="none"
          />

          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              <Text style={styles.saveText}>
                {isSubmitting ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: THEME.spacing.md,
  },
  container: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.text,
    marginBottom: THEME.spacing.md,
  },
  label: {
    ...THEME.typography.caption,
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginBottom: THEME.spacing.xs,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  input: {
    backgroundColor: THEME.colors.background,
    color: THEME.colors.text,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  half: {
    flex: 1,
  },
  imagePicker: {
    height: 120,
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: THEME.spacing.sm,
    overflow: "hidden",
  },
  pickerPlaceholder: {
    alignItems: "center",
    gap: 8,
  },
  pickerText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  urlInputContainer: {
    marginBottom: THEME.spacing.sm,
    position: "relative",
  },
  closeUrlBtn: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: THEME.spacing.md,
    marginTop: THEME.spacing.md,
  },
  cancelButton: {
    padding: THEME.spacing.md,
  },
  cancelText: {
    color: THEME.colors.textMuted,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.sm,
  },
  saveText: {
    color: "#000",
    fontWeight: "700",
  },
});
