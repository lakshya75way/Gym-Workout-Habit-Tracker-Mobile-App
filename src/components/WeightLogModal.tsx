import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";

interface WeightLogModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (weight: number) => Promise<void>;
  initialWeight?: string;
}

export const WeightLogModal = ({
  isVisible,
  onClose,
  onSave,
  initialWeight = "",
}: WeightLogModalProps) => {
  const { theme } = useTheme();
  const [weight, setWeight] = useState(initialWeight);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const weightVal = parseFloat(weight);
    if (isNaN(weightVal) || weightVal <= 0) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(weightVal);
      setWeight("");
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.container}
            >
              <View
                style={[
                  styles.content,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.header}>
                  <Text style={[styles.title, { color: theme.colors.text }]}>
                    Log Body Weight
                  </Text>
                  <TouchableOpacity onPress={onClose}>
                    <Ionicons
                      name="close"
                      size={24}
                      color={theme.colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.label, { color: theme.colors.textMuted }]}>
                  Enter your current weight in kilograms
                </Text>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    placeholder="0.0"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="decimal-pad"
                    value={weight}
                    onChangeText={setWeight}
                    autoFocus
                  />
                  <Text
                    style={[styles.unit, { color: theme.colors.textMuted }]}
                  >
                    kg
                  </Text>
                </View>

                <View style={styles.footer}>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.cancelButton,
                      { borderColor: theme.colors.border },
                    ]}
                    onPress={onClose}
                  >
                    <Text
                      style={[
                        styles.cancelText,
                        { color: theme.colors.textMuted },
                      ]}
                    >
                      Skip
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.saveButton,
                      { backgroundColor: theme.colors.primary },
                      (!weight || isSaving) && styles.disabledButton,
                    ]}
                    onPress={handleSave}
                    disabled={!weight || isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator color={theme.colors.background} />
                    ) : (
                      <Text
                        style={[
                          styles.saveText,
                          { color: theme.colors.background },
                        ]}
                      >
                        Save Weight
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: THEME.spacing.lg,
  },
  container: {
    width: "100%",
    maxWidth: 400,
  },
  content: {
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    padding: THEME.spacing.lg,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME.spacing.sm,
  },
  title: {
    ...THEME.typography.h3,
    fontWeight: "800",
  },
  label: {
    ...THEME.typography.caption,
    marginBottom: THEME.spacing.lg,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: THEME.spacing.xl,
  },
  input: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 16,
    ...THEME.typography.h2,
    fontWeight: "700",
  },
  unit: {
    ...THEME.typography.h3,
    fontWeight: "800",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: THEME.borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    flex: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelText: {
    fontWeight: "700",
  },
  saveText: {
    fontWeight: "800",
    fontSize: 16,
  },
});
