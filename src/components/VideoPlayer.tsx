import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  Text,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import YoutubePlayer from "react-native-youtube-iframe";
import { THEME } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";

interface VideoPlayerProps {
  uri: string;
  containerStyle?: ViewStyle;
}

export const VideoPlayer = ({ uri, containerStyle }: VideoPlayerProps) => {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getYoutubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const onStateChange = useCallback((state: string) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);

  if (!uri) return null;

  const youtubeId = getYoutubeVideoId(uri);

  return (
    <View style={[styles.container, containerStyle]}>
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator color={THEME.colors.primary} size="large" />
        </View>
      )}

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle"
            size={32}
            color={THEME.colors.destructive}
          />
          <Text style={styles.errorText}>Video unavailable</Text>
        </View>
      ) : youtubeId ? (
        <YoutubePlayer
          height={210}
          play={playing}
          videoId={youtubeId}
          onChangeState={onStateChange}
          onReady={() => setLoading(false)}
          onError={(e: string) => {
            console.error("YouTube Player Error:", e);
            setError("Failed to load YouTube video");
            setLoading(false);
          }}
        />
      ) : (
        <Video
          style={styles.video}
          source={{ uri }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping={false}
          onLoad={() => setLoading(false)}
          onError={(e: string) => {
            console.error("Video Load Error:", e);
            setError("Failed to load video file");
            setLoading(false);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000",
    width: "100%",
    aspectRatio: 16 / 9,
    justifyContent: "center",
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
    zIndex: 1,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: THEME.colors.surfaceSubtle,
    gap: 8,
  },
  errorText: {
    ...THEME.typography.caption,
    color: THEME.colors.textMuted,
  },
});
