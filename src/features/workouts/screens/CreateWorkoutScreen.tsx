import React, { useState, useCallback, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActionSheetIOS,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { THEME } from "@/theme/theme";
import { useWorkoutActions } from "../workout.store";
import { MuscleGroup, MuscleGroupSchema } from "../workout.schema";
import { RootStackParamList } from "@/navigation/types";
import { Ionicons } from "@expo/vector-icons";
import { sanitizeInput } from "@/utils/sanitization";

const DAYS = [
  { label: "S", value: 64 }, // Sun
  { label: "M", value: 1 }, // Mon
  { label: "T", value: 2 }, // Tue
  { label: "W", value: 4 }, // Wed
  { label: "T", value: 8 }, // Thu
  { label: "F", value: 16 }, // Fri
  { label: "S", value: 32 }, // Sat
];

export const CreateWorkoutScreen = memo(() => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { createWorkout } = useWorkoutActions();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>("Full Body");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [videoUri, setVideoUri] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [externalImageUri, setExternalImageUri] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useExternalImage, setUseExternalImage] = useState(false);

  const toggleDay = useCallback((value: number) => {
    setSelectedDays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value],
    );
  }, []);

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
        setImageUri(result.assets[0].uri);
        setUseExternalImage(false);
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
          else if (buttonIndex === 3) setUseExternalImage(true);
        },
      );
    } else {
      Alert.alert("Select Source", "Choose where to get your workout image", [
        { text: "Camera", onPress: () => handleImagePick(true) },
        { text: "Gallery", onPress: () => handleImagePick(false) },
        { text: "Direct URL", onPress: () => setUseExternalImage(true) },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const calculateDayMask = useCallback(() => {
    return selectedDays.reduce((acc, curr) => acc + curr, 0);
  }, [selectedDays]);

  const validateUrl = (url: string) => {
    if (!url) return true;
    // Allow local file URIs (from camera/gallery)
    if (url.startsWith("file://")) return true;
    // Validate external URLs
    const pattern = new RegExp(/^(https?:\/\/)/);
    return pattern.test(url);
  };

  // ...

  const handleCreate = useCallback(async () => {
    const trimmedName = sanitizeInput(name);
    if (!trimmedName) {
      Alert.alert("Required", "Workout name is missing");
      return;
    }
    const sanitizedDesc = sanitizeInput(description);
    const dayMask = calculateDayMask();
    if (dayMask === 0) {
      Alert.alert("Required", "Please select training days");
      return;
    }

    const finalImageUri = useExternalImage ? externalImageUri.trim() : imageUri;

    // Only validate external image URLs (not local file URIs)
    if (finalImageUri && useExternalImage && !validateUrl(finalImageUri)) {
      Alert.alert(
        "Invalid URL",
        "Image URL must start with http:// or https://",
      );
      return;
    }

    if (videoUri && !validateUrl(videoUri.trim())) {
      Alert.alert(
        "Invalid URL",
        "Video URL must start with http:// or https://",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await createWorkout({
        name: trimmedName,
        description: sanitizedDesc,
        muscle_group: muscleGroup,
        day_mask: dayMask,
        video_uri: videoUri.trim() || undefined,
        image_uri: finalImageUri || undefined,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert("Failed", "Could not create workout plan.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    name,
    description,
    muscleGroup,
    calculateDayMask,
    videoUri,
    imageUri,
    externalImageUri,
    useExternalImage,
    createWorkout,
    navigation,
  ]);

  const muscleGroups = MuscleGroupSchema.options;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Ionicons name="close" size={24} color={THEME.colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>New Blueprint</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Nomenclature</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Hypertrophy A"
                placeholderTextColor={THEME.colors.textMuted}
                maxLength={50}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Briefing (Optional)</Text>
            <View style={[styles.inputBox, styles.textAreaBox]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Focus on mind-muscle connection..."
                placeholderTextColor={THEME.colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Cadence (Weekly)</Text>
            <View style={styles.daysContainer}>
              {DAYS.map((day) => {
                const isSelected = selectedDays.includes(day.value);
                return (
                  <TouchableOpacity
                    key={day.value}
                    style={[
                      styles.dayChip,
                      isSelected && styles.dayChipSelected,
                    ]}
                    onPress={() => toggleDay(day.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                      ]}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Target Focus</Text>
            <View style={styles.chipContainer}>
              {muscleGroups.map((mg) => (
                <TouchableOpacity
                  key={mg}
                  style={[
                    styles.chip,
                    muscleGroup === mg && styles.chipSelected,
                  ]}
                  onPress={() => setMuscleGroup(mg)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      muscleGroup === mg && styles.chipTextSelected,
                    ]}
                  >
                    {mg}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Visual Reference</Text>
            <TouchableOpacity
              style={styles.imagePicker}
              onPress={showImageOptions}
              activeOpacity={0.8}
            >
              {(useExternalImage && externalImageUri) ||
              (!useExternalImage && imageUri) ? (
                <Image
                  source={{
                    uri: useExternalImage ? externalImageUri : imageUri!,
                  }}
                  style={styles.previewImage}
                />
              ) : (
                <View style={styles.pickerPlaceholder}>
                  <Ionicons
                    name="camera-reverse-outline"
                    size={32}
                    color={THEME.colors.primary}
                  />
                  <Text style={styles.imagePickerText}>Set Workout Cover</Text>
                </View>
              )}
            </TouchableOpacity>

            {useExternalImage && (
              <View style={[styles.inputBox, { marginTop: 12 }]}>
                <Ionicons
                  name="link"
                  size={18}
                  color={THEME.colors.primary}
                  style={{ marginLeft: 12 }}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={externalImageUri}
                  onChangeText={setExternalImageUri}
                  placeholder="Direct Image URL (png/jpg)"
                  placeholderTextColor={THEME.colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <TouchableOpacity
                  onPress={() => {
                    setUseExternalImage(false);
                    setExternalImageUri("");
                  }}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={THEME.colors.textMuted}
                    style={{ marginRight: 12 }}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Technique Video (Optional)</Text>
            <View style={styles.inputBox}>
              <Ionicons
                name="logo-youtube"
                size={18}
                color="#FF0000"
                style={{ marginLeft: 12 }}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={videoUri}
                onChangeText={setVideoUri}
                placeholder="YouTube or Video URL"
                placeholderTextColor={THEME.colors.textMuted}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.mainBtn, isSubmitting && styles.btnDisabled]}
            onPress={handleCreate}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color={THEME.colors.background} />
            ) : (
              <>
                <Text style={styles.mainBtnText}>Finalize Plan</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={THEME.colors.background}
                />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: THEME.spacing.xl,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.text,
  },
  section: {
    marginBottom: THEME.spacing.lg,
  },
  label: {
    ...THEME.typography.caption,
    color: THEME.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: THEME.spacing.sm,
    marginLeft: 4,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  textAreaBox: {
    alignItems: "flex-start",
  },
  input: {
    ...THEME.typography.body,
    color: THEME.colors.text,
    padding: THEME.spacing.md,
    flex: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: THEME.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  dayChipSelected: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  dayText: {
    color: THEME.colors.text,
    fontWeight: "700",
  },
  dayTextSelected: {
    color: THEME.colors.background,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: THEME.spacing.sm,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  chipSelected: {
    backgroundColor: THEME.colors.secondary + "20",
    borderColor: THEME.colors.secondary,
  },
  chipText: {
    color: THEME.colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: THEME.colors.secondary,
  },
  imagePicker: {
    height: 160,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  pickerPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  imagePickerText: {
    ...THEME.typography.small,
    color: THEME.colors.textMuted,
    fontWeight: "600",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  mainBtn: {
    marginTop: THEME.spacing.xl,
    backgroundColor: THEME.colors.primary,
    height: 56,
    borderRadius: THEME.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  mainBtnText: {
    ...THEME.typography.h3,
    color: THEME.colors.background,
    fontWeight: "800",
  },
});
