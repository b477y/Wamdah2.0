import * as fs from "node:fs";
import { cloud } from "../../../utils/multer/cloudinary.multer";

const uploadToCloud = async ({ req, title, localFilePath }) => {
  return new Promise((resolve, reject) => {
    cloud.uploader.upload(
      localFilePath,
      {
        folder: `${process.env.APP_NAME}/${req.user._id}/${title}_${Date.now()}`,
        resource_type: "video",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          fs.unlink(localFilePath, (unlinkErr) => {
            if (unlinkErr) console.warn("Failed to delete local video file after upload error:", unlinkErr);
            else console.log("Deleted local file after upload error:", localFilePath);
          });
          return reject(new Error("An error occurred while uploading the video to Cloudinary"));
        }

        console.log("Video upload completed!");

        fs.unlink(localFilePath, (err) => {
          if (err) console.warn("Failed to delete local video file:", err);
          else console.log("Deleted local file:", localFilePath);
        });

        resolve(result);
      }
    );
  });
};

export default uploadToCloud;