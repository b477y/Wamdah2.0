import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import axios from "axios";
import asyncHandler from "../../../utils/response/error.response";
import successResponse from "../../../utils/response/success.response";
import { exec } from "node:child_process";
import AiAvatarModel from "../../../db/models/AiAvatar.model";
import ffmpeg from 'fluent-ffmpeg';
import { getWordTimestampsFromScript } from "../../video/helpers/transcription";

// Load API key from environment variables
const apiKey = "ODJjZDFmY2RkMDhmNGVmNjk2ZWU3YTQwM2E3MmNjMmItMTc0ODA5NzI2Mw==";
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

export const generateAiAvatarWOCroma = async ({ req, speaker, script, timestamp, language }) => {
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
      timeout: 3600000,
    });

    if (response.data.error) {
      throw new Error(response.data.error.message);
    }

    const videoId = response.data.data.video_id;

    let statusData;
    let attempts = 0;
    const maxAttempts = 240;
    do {
      if (attempts >= maxAttempts) {
        throw new Error("Video processing timeout");
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));

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

    const fileName = `${speaker}_${timestamp}.mp4`;
    const mp3FileName = `${speaker}_${timestamp}.mp3`;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const videosDir = path.resolve(
      __dirname,
      "../../../../../public/renders/aiAvatars"
    );
    const voicesDir = path.resolve(
      __dirname,
      "../../../../../public/renders/voices"
    );

    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
    }
    if (!fs.existsSync(voicesDir)) {
      fs.mkdirSync(voicesDir, { recursive: true });
    }

    const outputPath = path.join(videosDir, fileName);
    const voiceOutputPath = path.join(voicesDir, mp3FileName);
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

    try {
      const resultPath = await convertToMp3(outputPath, voiceOutputPath);
      console.log('MP3 file saved at:', resultPath);
    } catch (err) {
      console.error('Conversion failed:', err);
      throw new Error("Failed to convert video to MP3");
    }

    const outputWebm = path.join(videosDir, `${speaker}_${timestamp}.webm`);

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

    let abb;

    if (language === "english") {
      abb = "en"
    } else {
      abb = "ar"
    }

    const words = await getWordTimestampsFromScript(voiceOutputPath, abb);
    // const words = await transcribeWithDeepgram(localFilePath, abb);

    console.log(words);

    const wordArray = Object.keys(words)
      .sort((a, b) => Number(a) - Number(b))
      .map(key => words[key]);


    return { aiAvatarFile: `${speaker}_${timestamp}.webm`, aiAvatarVoiceFile: mp3FileName, wordArray };
  } catch (error) {
    console.error("Error:", error);
    throw new Error(`An error occurred while generating the video: ${error.message}`)
  }
};