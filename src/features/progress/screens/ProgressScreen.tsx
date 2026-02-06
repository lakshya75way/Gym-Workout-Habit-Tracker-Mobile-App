import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  FlatList,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ScrollView,
} from "react-native";
import { THEME } from "@/theme/theme";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import { useAuthStore } from "@/features/auth/auth.store";
import { Logger } from "@/services/logger";
import { ProgressRepository, ProgressPhoto } from "../progress.repository";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - THEME.spacing.lg * 3) / 2;

export const ProgressScreen = () => {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const user = useAuthStore((state) => state.user);

  const loadPhotos = useCallback(async () => {
    if (!user) return;
    try {
      const data = await ProgressRepository.getAllProgressPhotos(user.id);
      setPhotos(data);
    } catch (e) {
      Logger.error("ProgressScreen: Failed to load progress photos", e);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [loadPhotos]),
  );

  const handleAddPhoto = useCallback(async () => {
    if (!user) return;

    const captureImage = async (useCamera: boolean) => {
      try {
        const permission = useCamera
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Permission Required",
            `${useCamera ? "Camera" : "Gallery"} access is needed to save your progress.`,
          );
          return;
        }

        const result = useCamera
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
              allowsEditing: true,
              aspect: [1, 1],
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
              allowsEditing: true,
              aspect: [1, 1],
            });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          await ProgressRepository.saveProgressPhoto(
            user.id,
            result.assets[0].uri,
            new Date(),
          );
          loadPhotos();
        }
      } catch (e) {
        Logger.error("Image Picker Error", e);
        Alert.alert("Error", "Failed to capture photo.");
      }
    };

    Alert.alert("Add Progress Photo", "Choose an option", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Select from Gallery",
        onPress: () => captureImage(false),
      },
      {
        text: "Take Photo",
        onPress: () => captureImage(true),
      },
    ]);
  }, [user, loadPhotos]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const handleDeletePhoto = async (photoId: string) => {
    Alert.alert(
      "Delete Photo",
      "Are you sure you want to remove this memory?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            try {
              await ProgressRepository.deleteProgressPhoto(photoId, user.id);
              loadPhotos();
            } catch (e) {
              Alert.alert("Error", "Failed to delete photo");
            }
          },
        },
      ],
    );
  };

  const PhotoCard = ({
    item,
    isSelected,
  }: {
    item: ProgressPhoto;
    isSelected: boolean;
  }) => (
    <Pressable
      style={[styles.card, isSelected && styles.selectedCard]}
      onLongPress={() => handleDeletePhoto(item.id)}
      onPress={() => toggleSelect(item.id)}
    >
      <Image source={{ uri: item.uri }} style={styles.image} />
      <View style={styles.cardOverlay}>
        <Text style={styles.dateText}>
          {new Date(item.taken_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </Text>
        {isSelected && (
          <View style={styles.checkContainer}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={THEME.colors.primary}
            />
          </View>
        )}
      </View>
    </Pressable>
  );

  const selectedPhotos = photos
    .filter((p) => selectedIds.includes(p.id))
    .sort(
      (a, b) => new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime(),
    );

  if (compareMode && selectedPhotos.length === 2) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.compareHeader}>
          <TouchableOpacity
            onPress={() => setCompareMode(false)}
            style={styles.backBtn}
          >
            <Ionicons name="close" size={24} color={THEME.colors.text} />
          </TouchableOpacity>
          <Text style={styles.compareTitle}>Side-by-Side</Text>
        </View>
        <ScrollView contentContainerStyle={styles.compareScroll}>
          <View style={styles.compareWrapper}>
            <View style={styles.compareItem}>
              <Text style={styles.compareLabel}>BEFORE</Text>
              <Image
                source={{ uri: selectedPhotos[0].uri }}
                style={styles.compareImage}
              />
              <Text style={styles.compareDate}>
                {new Date(selectedPhotos[0].taken_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.compareItem}>
              <Text style={styles.compareLabel}>AFTER</Text>
              <Image
                source={{ uri: selectedPhotos[1].uri }}
                style={styles.compareImage}
              />
              <Text style={styles.compareDate}>
                {new Date(selectedPhotos[1].taken_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.subtitle}>Visual Journey</Text>
          <Text style={styles.title}>Progress Gallery</Text>
        </View>
        <View style={styles.headerRight}>
          {selectedIds.length === 2 && (
            <TouchableOpacity
              style={[styles.actionBtn, { marginRight: THEME.spacing.sm }]}
              onPress={() => setCompareMode(true)}
            >
              <Ionicons
                name="git-compare-outline"
                size={20}
                color={THEME.colors.primary}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.fab}
            onPress={handleAddPhoto}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={32} color={THEME.colors.background} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={photos}
        renderItem={({ item }) => (
          <PhotoCard item={item} isSelected={selectedIds.includes(item.id)} />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons
                name="images-outline"
                size={64}
                color={THEME.colors.surfaceSubtle}
              />
            </View>
            <Text style={styles.emptyText}>No transformation yet</Text>
            <Text style={styles.emptySubtext}>
              Capture your first photo to start your timeline.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

import { TouchableOpacity } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subtitle: {
    ...THEME.typography.small,
    color: THEME.colors.primary,
    letterSpacing: 1.5,
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.text,
    marginTop: 2,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  listContent: {
    padding: THEME.spacing.lg,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: THEME.spacing.lg,
  },
  card: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH * 1.3,
    borderRadius: THEME.borderRadius.lg,
    backgroundColor: THEME.colors.surface,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  selectedCard: {
    borderColor: THEME.colors.primary,
    borderWidth: 2,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: THEME.spacing.sm,
    backgroundColor: "rgba(0,0,0,0.6)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: {
    ...THEME.typography.caption,
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 10,
  },
  checkContainer: {
    backgroundColor: THEME.colors.background,
    borderRadius: 10,
  },
  compareHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: THEME.spacing.lg,
    backgroundColor: THEME.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backBtn: {
    padding: THEME.spacing.sm,
    marginRight: THEME.spacing.md,
  },
  compareTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text,
  },
  compareScroll: {
    padding: THEME.spacing.lg,
  },
  compareWrapper: {
    gap: THEME.spacing.xl,
  },
  compareItem: {
    width: "100%",
  },
  compareLabel: {
    ...THEME.typography.small,
    color: THEME.colors.primary,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: THEME.spacing.sm,
  },
  compareImage: {
    width: "100%",
    height: width - THEME.spacing.lg * 2,
    borderRadius: THEME.borderRadius.lg,
    backgroundColor: THEME.colors.surface,
  },
  compareDate: {
    ...THEME.typography.caption,
    color: THEME.colors.textMuted,
    marginTop: THEME.spacing.sm,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
    paddingHorizontal: THEME.spacing.xxl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  emptyText: {
    ...THEME.typography.h3,
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  emptySubtext: {
    ...THEME.typography.body,
    color: THEME.colors.textMuted,
    textAlign: "center",
  },
});
