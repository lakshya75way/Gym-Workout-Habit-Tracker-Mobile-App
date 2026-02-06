import { supabase } from "./supabase";
import { Logger } from "@/utils/logger";

interface RNFile {
  uri: string;
  name: string;
  type: string;
}

export const MediaService = {
  uploadProgressPhoto: async (
    localUri: string,
    userId: string,
  ): Promise<string | null> => {
    try {
      const ext = localUri.split(".").pop() || "jpg";
      const fileName = `${userId}/${Date.now()}.${ext}`;

      const formData = new FormData();
      const file = {
        uri: localUri,
        name: fileName,
        type: `image/${ext === "png" ? "png" : "jpeg"}`,
      } as unknown as Blob;

      formData.append("file", file);

      const { data, error } = await supabase.storage
        .from("progress-photos")
        .upload(fileName, formData, {
          upsert: true,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("progress-photos").getPublicUrl(data.path);

      Logger.log("Media Upload Success:", publicUrl);
      return publicUrl;
    } catch (e) {
      Logger.error("Media Upload Failed", e);
      return null;
    }
  },
  uploadWorkoutMedia: async (
    localUri: string,
    userId: string,
  ): Promise<string | null> => {
    try {
      const ext = localUri.split(".").pop() || "jpg";
      const fileName = `${userId}/${Date.now()}.${ext}`;

      const formData = new FormData();
      const file = {
        uri: localUri,
        name: fileName,
        type: `image/${ext === "png" ? "png" : "jpeg"}`,
      } as unknown as Blob;

      formData.append("file", file);

      const { data, error } = await supabase.storage
        .from("workout-media")
        .upload(fileName, formData, {
          upsert: true,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("workout-media").getPublicUrl(data.path);

      Logger.log("Workout Media Upload Success:", publicUrl);
      return publicUrl;
    } catch (e) {
      Logger.error("Workout Media Upload Failed", e);
      return null;
    }
  },
};
