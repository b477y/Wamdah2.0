import asyncHandler from "../../../utils/response/error.response";
import axios from "axios";
import fs from "fs";
import msgpack5 from "msgpack5";
import successResponse from "../../../utils/response/success.response";
import { cloud } from "../../../utils/multer/cloudinary.multer";
import { fileURLToPath } from "url";
import path from "path";
import VoiceModel from "../../../db/models/Voice.model";

export const createVoiceOver = asyncHandler(async (req, res, next) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const API_URL = process.env.VOICE_API_URL;
  const API_KEY = process.env.VOICE_API_KEY;

  const msgpack = msgpack5();
  const {
    title,
    scriptText,
    reference_id,
    format = "mp3",
    scriptId,
    language,
    accentOrDialect,
  } = req.body;

  if (!scriptText) {
    return next(new Error("Text is required", { cause: 400 }));
  }

  const requestData = {
    text: scriptText,
    reference_id,
    format,
  };

  const encodedData = msgpack.encode(requestData);

  try {
    const response = await axios.post(API_URL, encodedData, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/msgpack",
      },
      responseType: "arraybuffer",
    });

    const outputDir = path.join(__dirname, "../../../../output/voices");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `${Date.now()}.${format}`;
    const outputFilePath = path.join(outputDir, filename);
    fs.writeFileSync(outputFilePath, response.data);

    console.log("Voice file path:", outputFilePath);

    const cloudUploadResult = await cloud.uploader.upload(outputFilePath, {
      folder: `${process.env.APP_NAME}/${req.user._id}/${title}/voice`,
      resource_type: "auto",
    });

    fs.unlinkSync(outputFilePath);

    const voice = await VoiceModel.create({
      createdBy: req.user._id,
      voiceSource: cloudUploadResult,
      scriptId,
      voiceoverActorId: reference_id,
      language,
      accentOrDialect,
    });

    return successResponse({
      res,
      status: 201,
      message: "Voiceover created successfully",
      data: voice,
    });
  } catch (error) {
    console.error("Voiceover Error:", error);
    return next(new Error("Failed to generate voiceover", { cause: 500 }));
  }
});
