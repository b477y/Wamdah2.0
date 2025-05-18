import * as fs from "node:fs";
import { cloud } from "../../../utils/multer/cloudinary.multer";

const uploadToCloud = async ({ req, title, outputLocation }) => {
  return new Promise((resolve, reject) => {
    cloud.uploader.upload_large(
      outputLocation,
      {
        folder: `${process.env.APP_NAME}/${req.user._id}/${title}_${Date.now()}`,
        resource_type: "video",
        chunk_size: 6 * 1024 * 1024,
      },
      (error, result) => {
        if (error) {
          console.error("❌ Cloudinary upload error:", error);
          return reject(new Error("An error occurred while uploading the video to Cloudinary"));
        }

        console.log("✅ Video upload completed!");

        // Async deletion, logging any error but not failing upload because of it
        fs.unlink(outputLocation, (err) => {
          if (err) console.warn("Failed to delete local video file:", err);
          else console.log("Deleted local file:", outputLocation);
        });

        resolve(result); // <-- result contains secure_url, public_id, etc.
      }
    );
  });
};

export default uploadToCloud;
