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
  TextInput,
  TouchableOpacity,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { THEME, Theme } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import { useAuthStore } from "@/features/auth/auth.store";
import { Logger } from "@/services/logger";
import { ProgressRepository, ProgressPhoto } from "../progress.repository";
import { WeightRepository, WeightLog } from "../weight.repository";
import { Ionicons } from "@expo/vector-icons";
import { WeightLogModal } from "@/components/WeightLogModal";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - THEME.spacing.lg * 3) / 2;

const PhotoCard = React.memo(
  ({
    item,
    isSelected,
    onPress,
    onLongPress,
    theme,
  }: {
    item: ProgressPhoto;
    isSelected: boolean;
    onPress: (id: string) => void;
    onLongPress: (id: string) => void;
    theme: Theme;
  }) => (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        isSelected && [
          styles.selectedCard,
          { borderColor: theme.colors.primary },
        ],
      ]}
      onLongPress={() => onLongPress(item.id)}
      onPress={() => onPress(item.id)}
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
              color={theme.colors.primary}
            />
          </View>
        )}
      </View>
    </Pressable>
  ),
);

export const ProgressScreen = () => {
  const { theme, themeType } = useTheme();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [isWeightModalVisible, setIsWeightModalVisible] = useState(false);
  const [isLoadingWeights, setIsLoadingWeights] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const user = useAuthStore((state) => state.user);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [photoData, weightData] = await Promise.all([
        ProgressRepository.getAllProgressPhotos(user.id),
        WeightRepository.getWeightHistory(user.id),
      ]);
      setPhotos(photoData);
      setWeights(weightData);
    } catch (e) {
      Logger.error("ProgressScreen: Failed to load data", e);
    }
  }, [user]);

  const sortedPhotos = React.useMemo(() => {
    return [...photos].sort(
      (a, b) => new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime(),
    );
  }, [photos]);

  const sortedWeights = React.useMemo(() => {
    return [...weights].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [weights]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleSaveWeight = async (weightVal: number) => {
    if (!user) return;
    try {
      await WeightRepository.saveWeight(user.id, weightVal, new Date());
      await loadData();
      Alert.alert("Success", "Weight logged successfully!");
    } catch (e) {
      Logger.error("Failed to log weight", e);
      Alert.alert("Error", "Failed to log weight. Please try again.");
    }
  };

  const handleDeleteWeight = useCallback(
    async (id: string) => {
      Alert.alert("Delete Log", "Remove this weight entry?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            try {
              await WeightRepository.deleteWeight(id, user.id);
              loadData();
            } catch (e) {
              Alert.alert("Error", "Failed to delete weight log");
            }
          },
        },
      ]);
    },
    [user, loadData],
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
          loadData();
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
  }, [user, loadData]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }, []);

  const handleDeletePhoto = useCallback(
    async (photoId: string) => {
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
                loadData();
              } catch (e) {
                Alert.alert("Error", "Failed to delete photo");
              }
            },
          },
        ],
      );
    },
    [user, loadData],
  );

  const selectedPhotos = React.useMemo(() => {
    return photos
      .filter((p) => selectedIds.includes(p.id))
      .sort(
        (a, b) =>
          new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime(),
      );
  }, [photos, selectedIds]);

  if (compareMode && selectedPhotos.length === 2) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View
          style={[
            styles.compareHeader,
            {
              backgroundColor: theme.colors.background,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => setCompareMode(false)}
            style={styles.backBtn}
          >
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.compareTitle, { color: theme.colors.text }]}>
            Side-by-Side
          </Text>
        </View>
        <ScrollView contentContainerStyle={styles.compareScroll}>
          <View style={styles.compareWrapper}>
            <View style={styles.compareItem}>
              <Text
                style={[styles.compareLabel, { color: theme.colors.primary }]}
              >
                BEFORE
              </Text>
              <Image
                source={{ uri: selectedPhotos[0].uri }}
                style={[
                  styles.compareImage,
                  { backgroundColor: theme.colors.surface },
                ]}
              />
              <Text
                style={[styles.compareDate, { color: theme.colors.textMuted }]}
              >
                {new Date(selectedPhotos[0].taken_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.compareItem}>
              <Text
                style={[styles.compareLabel, { color: theme.colors.primary }]}
              >
                AFTER
              </Text>
              <Image
                source={{ uri: selectedPhotos[1].uri }}
                style={[
                  styles.compareImage,
                  { backgroundColor: theme.colors.surface },
                ]}
              />
              <Text
                style={[styles.compareDate, { color: theme.colors.textMuted }]}
              >
                {new Date(selectedPhotos[1].taken_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={themeType === "dark" ? "light-content" : "dark-content"}
      />
      <FlatList
        data={photos}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text
                  style={[styles.subtitle, { color: theme.colors.primary }]}
                >
                  Visual Journey
                </Text>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                  Progress Gallery
                </Text>
              </View>
              <View style={styles.headerRight}>
                {selectedIds.length === 2 && (
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        marginRight: THEME.spacing.sm,
                      },
                    ]}
                    onPress={() => setCompareMode(true)}
                  >
                    <Ionicons
                      name="git-compare-outline"
                      size={20}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.fab,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={handleAddPhoto}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="add"
                    size={32}
                    color={theme.colors.background}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Body Weight
              </Text>
            </View>

            <View
              style={[
                styles.weightCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.logWeightButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => setIsWeightModalVisible(true)}
              >
                <Ionicons
                  name="scale-outline"
                  size={20}
                  color={theme.colors.background}
                />
                <Text
                  style={[
                    styles.logWeightButtonText,
                    { color: theme.colors.background },
                  ]}
                >
                  Log Current Weight
                </Text>
              </TouchableOpacity>

              {sortedWeights.length > 1 && (
                <LineChart
                  data={{
                    labels: sortedWeights
                      .map((w) =>
                        new Date(w.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        }),
                      )
                      .slice(-7),
                    datasets: [
                      {
                        data: sortedWeights.map((w) => w.weight).slice(-7),
                      },
                    ],
                  }}
                  width={width - THEME.spacing.lg * 3}
                  height={180}
                  chartConfig={{
                    backgroundColor: theme.colors.surface,
                    backgroundGradientFrom: theme.colors.surface,
                    backgroundGradientTo: theme.colors.surface,
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                    labelColor: (opacity = 1) => theme.colors.textMuted,
                    style: { borderRadius: 16 },
                    propsForDots: {
                      r: "4",
                      strokeWidth: "2",
                      stroke: theme.colors.primary,
                    },
                  }}
                  bezier
                  style={{ marginVertical: THEME.spacing.md, borderRadius: 16 }}
                />
              )}

              {sortedWeights.length > 0 && (
                <View style={styles.weightHistoryList}>
                  <TouchableOpacity
                    style={styles.toggleHistoryBtn}
                    onPress={() => setShowHistory(!showHistory)}
                  >
                    <Text
                      style={[
                        styles.historyTitle,
                        { color: theme.colors.textMuted, marginBottom: 0 },
                      ]}
                    >
                      {showHistory ? "HIDE HISTORY" : "SHOW HISTORY"}
                    </Text>
                    <Ionicons
                      name={showHistory ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={theme.colors.textMuted}
                    />
                  </TouchableOpacity>

                  {showHistory && (
                    <View style={styles.historyItemsContainer}>
                      {[...sortedWeights]
                        .reverse()
                        .slice(0, 10)
                        .map((w) => (
                          <View key={w.id} style={styles.weightHistoryItem}>
                            <View>
                              <Text
                                style={[
                                  styles.historyWeight,
                                  { color: theme.colors.text },
                                ]}
                              >
                                {w.weight} kg
                              </Text>
                              <Text
                                style={[
                                  styles.historyDate,
                                  { color: theme.colors.textMuted },
                                ]}
                              >
                                {new Date(w.date).toLocaleDateString()}
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => handleDeleteWeight(w.id)}
                              hitSlop={8}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={16}
                                color={theme.colors.destructive}
                              />
                            </TouchableOpacity>
                          </View>
                        ))}
                      {sortedWeights.length > 10 && (
                        <Text
                          style={[
                            styles.moreHistory,
                            { color: theme.colors.textMuted },
                          ]}
                        >
                          + {sortedWeights.length - 10} more entries in database
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Photo Gallery
              </Text>
              {photos.length > 0 && (
                <Text
                  style={[styles.photoCount, { color: theme.colors.textMuted }]}
                >
                  {photos.length} photos
                </Text>
              )}
            </View>
          </>
        }
        renderItem={useCallback(
          ({ item }: { item: ProgressPhoto }) => (
            <PhotoCard
              item={item}
              isSelected={selectedIds.includes(item.id)}
              onPress={toggleSelect}
              onLongPress={handleDeletePhoto}
              theme={theme}
            />
          ),
          [selectedIds, theme, toggleSelect, handleDeletePhoto],
        )}
        keyExtractor={useCallback((item: ProgressPhoto) => item.id, [])}
        numColumns={2}
        contentContainerStyle={styles.galleryContent}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconContainer,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Ionicons
                name="images-outline"
                size={64}
                color={theme.colors.surfaceSubtle}
              />
            </View>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              No transformation yet
            </Text>
            <Text
              style={[styles.emptySubtext, { color: theme.colors.textMuted }]}
            >
              Capture your first photo to start your timeline.
            </Text>
          </View>
        }
      />

      <WeightLogModal
        isVisible={isWeightModalVisible}
        onClose={() => setIsWeightModalVisible(false)}
        onSave={handleSaveWeight}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.xl,
    marginBottom: THEME.spacing.md,
  },
  sectionTitle: {
    ...THEME.typography.h3,
    fontWeight: "800",
  },
  photoCount: {
    ...THEME.typography.caption,
    fontWeight: "600",
  },
  weightCard: {
    marginHorizontal: THEME.spacing.lg,
    padding: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  logWeightButton: {
    width: "100%",
    height: 52,
    borderRadius: THEME.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: THEME.spacing.sm,
  },
  logWeightButtonText: {
    fontWeight: "800",
    fontSize: 16,
  },
  moreHistory: {
    ...THEME.typography.caption,
    fontSize: 10,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: THEME.spacing.xs,
  },
  galleryContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 100,
  },
  weightHistoryList: {
    width: "100%",
    marginTop: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  historyTitle: {
    ...THEME.typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  toggleHistoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: THEME.spacing.xs,
  },
  historyItemsContainer: {
    marginTop: THEME.spacing.md,
  },
  weightHistoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  historyWeight: {
    ...THEME.typography.body,
    fontWeight: "700",
  },
  historyDate: {
    ...THEME.typography.caption,
    fontSize: 10,
  },
});
