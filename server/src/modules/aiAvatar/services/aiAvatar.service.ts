import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import axios from "axios";
import asyncHandler from "../../../utils/response/error.response";
import successResponse from "../../../utils/response/success.response";
import { cloud } from "../../../utils/multer/cloudinary.multer";
import { exec } from "node:child_process";
import AiAvatarModel from "../../../db/models/AiAvatar.model";
import ffmpeg from 'fluent-ffmpeg';
import { getWordTimestampsFromScript } from "../../video/helpers/transcription";

// Load API key from environment variables
const apiKey = "M2Y5MDk0ZWQ1YzBiNDc2OGJjMmNlNDZiNmQ1NDk3OGMtMTc0NjAyMzU4OQ==";
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

export const generateAiAvatarWOCroma = async ({ req, speaker, script }) => {
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
      // Assuming `res` is available in this scope, if this function is called from a route handler.
      // If not, you might want to adjust how errors are returned/thrown.
      throw new Error(response.data.error.message);
    }

    const videoId = response.data.data.video_id;

    let statusData;
    let attempts = 0;
    const maxAttempts = 240; // 20 minutes (240 * 5 seconds)
    do {
      if (attempts >= maxAttempts) {
        throw new Error("Video processing timeout");
      }
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusRes = await axios.get(
        `${getVideoStatusUrl}?video_id=${videoId}`,
        {
          headers: { "X-Api-Key": apiKey },
        }
      );

      if (statusRes.data.code !== 100) {
        throw new Error(statusRes.data.message);
      }

      statusData = statusRes.data.data;
      if (statusData.status !== "completed") {
        console.log(`Status: ${statusData.status}...`);
      }

      attempts++;
    } while (statusData.status !== "completed");

    const videoUrl = statusData.video_url;

    const convertToMp3 = (inputPath, outputPath) => {
      return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .toFormat('mp3')
          .on('error', (err) => {
            console.error('Error during conversion:', err);
            reject(err);
          })
          .on('end', () => {
            console.log('Conversion finished:', outputPath);
            resolve(outputPath);
          })
          .save(outputPath);
      });
    };

    console.log(videoUrl);

    const timestamp = Date.now();
    const fileName = `${speaker}_${timestamp}.mp4`;
    const mp3FileName = `${speaker}_${timestamp}.mp3`;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const videosDir = path.resolve(
      __dirname,
      "../../../../../renders/aiAvatars"
    );
    const voicesDir = path.resolve(
      __dirname,
      "../../../../../renders/aiAvatarsVoices"
    );

    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
    }
    if (!fs.existsSync(voicesDir)) {
      fs.mkdirSync(voicesDir, { recursive: true });
    }

    const outputPath = path.join(videosDir, fileName); // This is the path for the downloaded MP4 video
    const voiceOutputPath = path.join(voicesDir, mp3FileName); // This is the path for the extracted MP3 audio
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

    // Now convert the downloaded video to MP3
    try {
      const resultPath = await convertToMp3(outputPath, voiceOutputPath); // Corrected: outputPath as input, voiceOutputPath as output
      console.log('MP3 file saved at:', resultPath);
      // You can now send this MP3 to Whisper
    } catch (err) {
      console.error('Conversion failed:', err);
      throw new Error("Failed to convert video to MP3"); // Re-throw to indicate failure
    }

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

    // const cloudUploadResult = await cloud.uploader.upload(outputWebm, {
    //   folder: `${process.env.APP_NAME}/${req.user._id}/${req.body.title}/ai-avatar-video`,
    //   resource_type: "video",
    // });

    const words = await getWordTimestampsFromScript(voiceOutputPath)
    console.log(words);

    const wordArray = Object.keys(words)
      .sort((a, b) => Number(a) - Number(b)) // ensure sorted by key
      .map(key => words[key]);


    return { aiAvatarFile: `${speaker}_${timestamp}.webm`, aiAvatarVoiceFile: mp3FileName, wordArray };
  } catch (error) {
    console.error("Error:", error);
    throw new Error(`An error occurred while generating the video: ${error.message}`)
  }
};