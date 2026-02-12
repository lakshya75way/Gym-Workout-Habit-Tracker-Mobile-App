import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";

interface PlateCalculatorModalProps {
  isVisible: boolean;
  onClose: () => void;
  initialWeight?: number;
}

const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const BAR_WEIGHT = 20;

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({
  isVisible,
  onClose,
  initialWeight = 60,
}) => {
  const { theme } = useTheme();
  const [targetWeight, setTargetWeight] = useState(initialWeight.toString());

  const plateBreakdown = useMemo(() => {
    let weight = parseFloat(targetWeight);
    if (isNaN(weight) || weight <= BAR_WEIGHT) return [];

    let weightPerSide = (weight - BAR_WEIGHT) / 2;
    const breakdown: { plate: number; count: number }[] = [];

    for (const plate of PLATES) {
      const count = Math.floor(weightPerSide / plate);
      if (count > 0) {
        breakdown.push({ plate, count });
        weightPerSide -= count * plate;
      }
    }

    return breakdown;
  }, [targetWeight]);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContent}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Plate Calculator
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>
                Target Weight (kg) - 20kg Bar included
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                  },
                ]}
                keyboardType="numeric"
                value={targetWeight}
                onChangeText={setTargetWeight}
                autoFocus
                placeholder="0"
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            <ScrollView contentContainerStyle={styles.resultSection}>
              {parseFloat(targetWeight) <= BAR_WEIGHT ? (
                <Text style={styles.emptyText}>Empty Bar</Text>
              ) : (
                <View style={styles.plateList}>
                  <Text
                    style={[styles.sideLabel, { color: theme.colors.primary }]}
                  >
                    PER SIDE
                  </Text>
                  {plateBreakdown.map((item, index) => (
                    <View key={index} style={styles.plateRow}>
                      <View
                        style={[
                          styles.plateBadge,
                          { backgroundColor: theme.colors.primary + "20" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.plateText,
                            { color: theme.colors.primary },
                          ]}
                        >
                          {item.plate}kg
                        </Text>
                      </View>
                      <Ionicons
                        name="close-outline"
                        size={16}
                        color={theme.colors.textMuted}
                      />
                      <Text
                        style={[styles.countText, { color: theme.colors.text }]}
                      >
                        {item.count}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.doneBtn,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={onClose}
            >
              <Text
                style={[styles.doneBtnText, { color: theme.colors.background }]}
              >
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    width: "100%",
  },
  card: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 4,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    fontSize: 32,
    fontWeight: "800",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    textAlign: "center",
  },
  resultSection: {
    minHeight: 150,
  },
  plateList: {
    alignItems: "center",
    gap: 12,
  },
  sideLabel: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 8,
  },
  plateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    justifyContent: "center",
  },
  plateBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  plateText: {
    fontSize: 18,
    fontWeight: "700",
  },
  countText: {
    fontSize: 24,
    fontWeight: "800",
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    fontStyle: "italic",
    marginTop: 40,
  },
  doneBtn: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  doneBtnText: {
    fontSize: 18,
    fontWeight: "800",
  },
});
