import asyncHandler from "../../../utils/response/error.response";
import axios from "axios";
import { promises as fs } from 'fs';
import msgpack5 from "msgpack5";
import successResponse from "../../../utils/response/success.response";
import { cloud } from "../../../utils/multer/cloudinary.multer";
import { fileURLToPath } from "url";
import path from "path";
import VoiceModel from "../../../db/models/Voice.model";
import VoiceActorModel from "../../../db/models/VoiceActor.model";
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

export const createVoiceOver = async ({
  req,
  scriptText,
  reference_id,
  format = "mp3",
  scriptId,
  language,
  accentOrDialect,
}) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const API_URL = "https://api.fish.audio/v1/tts";
  const API_KEY = "73245036b7b841fba6cdc80e4c13b251";
  // const API_KEY = "4d374ac32815402f8680ed87d6b262ba"; another 100 credits

  const msgpack = msgpack5();

  if (!scriptText) {
    throw new Error("Text is required");
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

    const outputDir = path.join(__dirname, "../../../../../public/renders/voices");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `${Date.now()}.${format}`;
    const outputFilePath = path.join(outputDir, filename);
    fs.writeFileSync(outputFilePath, response.data);

    console.log("Voice file path:", outputFilePath);

    // const cloudUploadResult = await cloud.uploader.upload(outputFilePath, {
    //   folder: `${process.env.APP_NAME}/${req.user._id}/${title}/voice`,
    //   resource_type: "auto",
    // });

    // fs.unlinkSync(outputFilePath);

    const { _id } = await VoiceActorModel.findOne({ referenceId: reference_id })

    const voice = await VoiceModel.create({
      createdBy: req.user._id,
      // voiceSource: cloudUploadResult,
      scriptId,
      voiceoverActorId: _id,
      language,
      accentOrDialect,
    });

    if (!voice) {
      throw new Error(
        "An error occured while saving the voice in the database"
      );
    }

    return { voice, outputFilePath };
  } catch (error) {
    console.error("Voiceover Error:", error);
    throw new Error("Failed to generate voiceover");
  }
};

export const elevenLabsVoiceOver = async ({
  req,
  scriptText,
  language,
  accentOrDialect,
  scriptId
}) => {
  const elevenlabs = new ElevenLabsClient({
    // apiKey: 'sk_50e5f6c2098fcb084f31a288ec70049b6e729407dcf14a2e',
    apiKey: 'sk_a76d1dcf9f386b63509ae47461bff6f6c0c1c28bb606c7e0',
  });
  console.log("Script text being sent to Eleven Labs:", scriptText);
  // Haytham => IES4nrmZdUBHByLBde0P (Egyptian)
  // Mark => UgBBYS2sOqTuMpoF3BR0 (American)
  // Archer => Fahco4VZzobUeiPqni1S (British)

  const voiceoverActorId = await VoiceActorModel.findOne({ language, accentOrDialect })

  const voiceId = voiceoverActorId.voiceId
  const modelId = "eleven_multilingual_v2";
  const outputFormat = "mp3_44100_128";

  const audioBuffer = await elevenlabs.textToSpeech.convert(voiceId, {
    text: scriptText,
    voiceId,
    modelId: modelId,
    outputFormat: outputFormat,
  });

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const fileExtension = outputFormat.split('_')[0];
  const filename = `${Date.now()}.${fileExtension}`;

  const outputDir = path.join(__dirname, "../../../../../public/renders/voices");
  const outputFilePath = path.join(outputDir, filename);

  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (error) {
    console.error("Error creating output directory:", error);
    throw new Error("Failed to create voiceover directory.");
  }

  try {
    await fs.writeFile(outputFilePath, audioBuffer);
    console.log("Voice file path:", outputFilePath);
  } catch (error) {
    console.error("Error writing voice file:", error);
    throw new Error("Failed to save voiceover file.");
  }

  let createdVoiceEntry;

  try {
    createdVoiceEntry = await VoiceModel.create({
      createdBy: req.user._id,
      scriptId,
      voiceoverActorId,
      language,
      accentOrDialect,
    });

    if (!createdVoiceEntry) {
      throw new Error("Failed to save the voice entry in the database.");
    }
  } catch (error) {
    console.error("Error saving voice to database:", error);
    throw new Error("An error occurred while saving the voice in the database.");
  }

  return { voice: createdVoiceEntry, voiceId: voiceId, outputFilePath: outputFilePath };
};