import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import axios from "axios";
import asyncHandler from "../../../utils/response/error.response";
import successResponse from "../../../utils/response/success.response";
import { cloud } from "../../../utils/multer/cloudinary.multer";
import { exec } from "node:child_process";
import AiAvatarModel from "../../../db/models/AiAvatar.model";

// Load API key from environment variables
const apiKey = process.env.HEYGEN_API_KEY;
const generateVideoUrl = "https://api.heygen.com/v2/video/generate";
const getVideoStatusUrl = "https://api.heygen.com/v1/video_status.get";

// brandon
// diran
// justo
// violante
// imelda

export const retrieveAiAvatars = asyncHandler(async (req, res, next) => {
  const avatars = await AiAvatarModel.find({})
  return successResponse({
    res, status: 200, message: "AI Avatars retrieved successfully", data: avatars,
  });
});

export const generateAiAvatarWithCroma = async ({ req, speaker, script }) => {
  if (!speaker || !script) {
    throw new Error("Missing required fields: speaker and script")
  }
  const avatarData = await AiAvatarModel.findOne({ avatarName: speaker })
  if (!avatarData) { throw new Error("Invalid speaker selected.") }
  const requestBody = {
    video_inputs: [
      {
        character: {
          type: "avatar", avatar_id: avatarData.avatarId, avatar_style: "normal",
        },
        voice: {
          type: "text", input_text: script, voice_id: avatarData.voiceId,
        },
        background: {
          type: "color", value: "#00FF00",
        },
      },
    ],
    dimension: {
      width: 720, height: 1280,
    },
  };

  try {
    const response = await axios.post(generateVideoUrl, requestBody, {
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
    });

    if (response.data.error) {
      return res.status(500).json({ message: response.data.error.message });
    }

    const videoId = response.data.data.video_id;

    let statusData;
    let attempts = 0;
    const maxAttempts = 240;
    do {
      if (attempts >= maxAttempts) {
        return res.status(500).json({ message: "Video processing timeout" });
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const statusRes = await axios.get(
        `${getVideoStatusUrl}?video_id=${videoId}`,
        {
          headers: { "X-Api-Key": apiKey },
        }
      );

      if (statusRes.data.code !== 100) {
        return res.status(500).json({ message: statusRes.data.message });
      }

      statusData = statusRes.data.data;
      if (statusData.status !== "completed") {
        console.log(`Status: ${statusData.status}...`);
      }

      attempts++;
    } while (statusData.status !== "completed");

    const videoUrl = statusData.video_url;
    const timestamp = Date.now();
    const fileName = `${speaker}_${timestamp}.mp4`;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const videosDir = path.resolve(
      __dirname,
      "../../../../../remotion/public/videos"
    );

    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
    }

    const outputPath = path.join(videosDir, fileName);
    const outputAbsolutePath = path.resolve(outputPath);
    console.log(outputAbsolutePath);

    const videoStream = await axios.get(videoUrl, {
      responseType: "stream",
      timeout: 3600000,
    });

    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(outputPath);
      videoStream.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    console.log(`Video saved locally at ${outputPath}`);

    const outputWebm = path.join(videosDir, `${speaker}_${timestamp}.webm`);

    // Removing Croma
    await new Promise((resolve, reject) => {
      exec(
        `ffmpeg -i "${outputPath}" -vf "chromakey=0x00FF00:0.3:0.0" -c:v libvpx -pix_fmt yuva420p -auto-alt-ref 0 "${outputWebm}" -y`,
        (error, stdout, stderr) => {
          if (error) {
            console.error("Error removing background:", stderr);
            return reject(error);
          }
          console.log("Background removed and converted to .webm successfully.");
          resolve();
        }
      );
    });

    const cloudUploadResult = await cloud.uploader.upload(outputWebm, {
      folder: `${process.env.APP_NAME}/${req.user._id}/${req.body.title}/ai-avatar-video`,
      resource_type: "video",
    });

    return {
      videoSource: {
        public_id: cloudUploadResult.public_id,
        secure_url: cloudUploadResult.secure_url,
        fileName: `${speaker}_${timestamp}.webm`,
      }
    };
  } catch (error) {
    console.error("Error:", error);
    throw new Error("An error occurred while generating the video")
  }
};
