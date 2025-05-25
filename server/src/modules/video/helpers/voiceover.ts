import asyncHandler from "../../../utils/response/error.response";
import axios from "axios";
import fs from "fs";
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


import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import path from "path";
import fs from "fs/promises"; // Use fs.promises for async file operations
import { fileURLToPath } from "url";
// import VoiceModel from "path/to/your/VoiceModel"; // <--- IMPORTANT: Import your Mongoose model here

// For local testing, keep dotenv/config if you want to swap later,
// or just ensure you hardcode the key in a testing-only environment.
// import "dotenv/config";

export const elevenLabsVoiceOver = async ({
  req,
  scriptText,
  language = "arabic",
  // If these come from the outside, pass them as arguments
  // scriptId,
  // voiceoverActorId
}) => {
  // Hardcoded API key - ONLY for local testing, never for production or public code!
  // Move this to process.env.ELEVENLABS_API_KEY for deployment.
  const elevenlabs = new ElevenLabsClient({
    apiKey: 'sk_572bf51a2c2e6a0f4f83b9591934fc269954b28f0908fc15',
  });

  const voiceId = "IES4nrmZdUBHByLBde0P"; // Define the voice ID
  const modelId = "eleven_multilingual_v2";
  const outputFormat = "mp3_44100_128";

  // --- 1. Generate Audio from Eleven Labs ---
  // The .convert method typically returns a Buffer for common formats like mp3
  const audioBuffer = await elevenlabs.textToSpeech.convert(voiceId, {
    text: scriptText,
    voiceId: voiceId,
    modelId: modelId,
    outputFormat: outputFormat,
  });

  // --- 2. Define File Paths and Ensure Directory Exists ---
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const fileExtension = outputFormat.split('_')[0]; // Extracts "mp3"
  const filename = `${Date.now()}.${fileExtension}`;

  const outputDir = path.join(__dirname, "../../../../../public/renders/voices");
  const outputFilePath = path.join(outputDir, filename);

  try {
    // Ensure the directory exists. recursive: true will create parents and not error if it exists.
    await fs.mkdir(outputDir, { recursive: true });
  } catch (error) {
    console.error("Error creating output directory:", error);
    throw new Error("Failed to create voiceover directory.");
  }

  // --- 3. Save Audio to File ---
  try {
    await fs.writeFile(outputFilePath, audioBuffer); // Write the Buffer directly to the file
    console.log("Voice file path:", outputFilePath);
  } catch (error) {
    console.error("Error writing voice file:", error);
    throw new Error("Failed to save voiceover file.");
  }

  // --- 4. Database Interaction (Assuming VoiceModel is a Mongoose model) ---
  let createdVoiceEntry; // Declare variable to hold the created DB entry

  try {
    // If you plan to upload this file to a cloud storage (like Cloudinary)
    // you would do that here and get `cloudUploadResult`
    // const cloudUploadResult = await uploadToCloudStorage(outputFilePath); // Example call

    createdVoiceEntry = await VoiceModel.create({
      // createdBy: req.user?._id, // Conditionally access user ID
      // voiceSource: cloudUploadResult || outputFilePath, // Use cloud path or local path
      // scriptId, // Needs to be passed as an argument if used
      // voiceoverActorId, // Needs to be passed as an argument if used
      language: language,
      // accentOrDialect, // Needs to be passed or determined
    });

    if (!createdVoiceEntry) {
      throw new Error("Failed to save the voice entry in the database.");
    }
  } catch (error) {
    console.error("Error saving voice to database:", error);
    throw new Error("An error occurred while saving the voice in the database.");
  }

  // --- 5. Return Results ---
  // Return the created database entry, voiceId, and file path
  return { voice: createdVoiceEntry, voiceId: voiceId, outputFilePath: outputFilePath };
};