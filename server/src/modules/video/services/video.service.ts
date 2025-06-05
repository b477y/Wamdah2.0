import asyncHandler from "../../../utils/response/error.response";
import { fileURLToPath } from "url";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import VideoModel from "../../../db/models/Video.model";
import { createVoiceOver, elevenLabsVoiceOver } from "../helpers/voiceover";
import VoiceActorModel from "../../../db/models/VoiceActor.model";
import { getFontLoader } from "../helpers/getfontLoader";
import { makeRenderQueue } from "../../../../render-queue";
import { getWordTimestampsFromScript, transcribeWithDeepgram } from "../helpers/transcription";
import ScriptModel from "../../../db/models/Script.model";
import successResponse from "../../../utils/response/success.response";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const remotionBundleUrl = await bundle({
  entryPoint: path.resolve("remotion/index.ts"),
  onProgress(progress) {
    console.info(`Bundling Remotion project: ${progress}%`);
  },
});

const rendersDir = path.resolve(__dirname, "../../../../../renders");

export const queue = makeRenderQueue({
  port: Number(3000),
  serveUrl: remotionBundleUrl,
  rendersDir,
});

// Get video by job id
export const getVideoByJobId = asyncHandler(async (req, res, next) => {
  const { jobId } = req.body;

  const video = await VideoModel.findOne({ jobId }).select('-thumbnailUrl')

  if (!video) {
    return res.status(200).json({ message: "Try again" })
  }

  return successResponse({ res, status: 200, message: "Video retrieved successfully", data: video })

})

// Instant video
export const generateVideo = asyncHandler(async (req, res, next) => {
  const startTime = Date.now()
  const { title, generatedScript, customScript, language, accentOrDialect, type } = req.body;

  let generatedByAi = false;
  let content = "";

  if (generatedScript) {
    content = generatedScript;
    generatedByAi = true;
  } else if (customScript) {
    content = customScript;
  } else {
    return res.status(400).json({ error: "No script content provided." });
  }

  const script = await ScriptModel.create({
    title, content, createdBy: req.user._id, generatedByAi
  });

  const scriptId = script._id || "";

  const voiceResponse = await elevenLabsVoiceOver({
    req, scriptText: content, language, accentOrDialect, scriptId
  });

  const voiceId = voiceResponse.voice._id;

  if (!voiceResponse.outputFilePath) {
    next(new Error("Failed to generate voiceover correctly and upload it correctly"));
  }

  const localFilePath = voiceResponse.outputFilePath || null;

  const voiceFile = path.basename(voiceResponse.outputFilePath);

  let abb;

  if (language === "english") { abb = "en" } else { abb = "ar" }

  const words = await getWordTimestampsFromScript(localFilePath, abb); // Loaded locally
  // const words = await transcribeWithDeepgram(localFilePath, abb); => Hosted

  const wordArray = Object.keys(words)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => words[key]);

  const fontFamily = "Lalezar";
  const fontLoader = getFontLoader(fontFamily);
  const { fontFamily: selectedFont } = await fontLoader();

  const jobId = queue.createJob({
    titleText: req.body.titleText, words: wordArray, voiceFile,
    title, localFilePath, req,
    voiceResponse, scriptId, voiceId,
    type, startTime, fontFamily
  });

  res.status(200).json({ jobId });
});

// AI Spoke person
export const generateAiAvatarVideo = asyncHandler(async (req, res, next) => {
  const startTime = Date.now()
  const { title, generatedScript, customScript, type, language, accentOrDialect, speaker } = req.body;

  let generatedByAi = false;
  let content = "";

  if (generatedScript) {
    content = generatedScript;
    generatedByAi = true;
  } else if (customScript) {
    content = customScript;
  } else {
    return res.status(400).json({ error: "No script content provided." });
  }

  const script = await ScriptModel.create({ title, content, createdBy: req.user._id, generatedByAi, });

  const timestamp = Date.now();
  const aiAvatarVoiceFile = `${speaker}_${timestamp}.mp3`;
  const aiAvatarFile = `${speaker}_${timestamp}.webm`;

  const jobId = queue.createJob({
    req, title, scriptId: script._id, script: script.content, speaker,
    language, accentOrDialect, timestamp, titleText: req.body.titleText, aiAvatarFile,
    voiceFile: aiAvatarVoiceFile, type, words: ["words"], startTime
  });

  res.status(200).json({ jobId });
});

// Ad video
export const generateAdVideo = asyncHandler(async (req, res, next) => {
  const startTime = Date.now()
  const { title, url, customScript, generatedScript, language, accentOrDialect } = req.body;
  const type = "advertising"
  let generatedByAi = false;
  let content = "";
  if (generatedScript) {
    content = generatedScript;
    generatedByAi = true;
  } else if (customScript) {
    content = customScript;
  } else {
    return res.status(400).json({ error: "No script content provided." });
  }
  const script = await ScriptModel.create({ title, content, createdBy: req.user._id, generatedByAi });
  const { referenceId } = await VoiceActorModel.findOne({ language, accentOrDialect });
  if (!referenceId) {
    next(new Error("Failed to find voiceover actor with selected options"));
  }
  const scriptId = script._id || "";
  const voiceResponse = await elevenLabsVoiceOver({
    req, scriptText: content, language, accentOrDialect, scriptId
  });
  const voiceId = voiceResponse.voice._id;
  if (!voiceResponse.outputFilePath) {
    next(new Error("Failed to generate voiceover correctly and upload it correctly"));
  }
  const localFilePath = voiceResponse.outputFilePath || null;
  const voiceFile = path.basename(voiceResponse.outputFilePath);
  let abb;
  if (language === "english") { abb = "en" } else { abb = "ar" }

  const words = await getWordTimestampsFromScript(localFilePath, abb);
  // const words = await transcribeWithDeepgram(localFilePath, abb);

  const wordArray = Object.keys(words)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => words[key]);

  const fontFamily = "Lalezar";
  const fontLoader = getFontLoader(fontFamily);
  const { fontFamily: selectedFont } = await fontLoader();

  const jobId = queue.createJob({
    titleText: req.body.titleText, type: "advertising", words: wordArray, voiceFile,
    title, localFilePath, req, voiceResponse, scriptId, voiceId, startTime, fontFamily
  });

  res.status(200).json({ jobId });
});
