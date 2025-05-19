import asyncHandler from "../../../utils/response/error.response";
import successResponse from "../../../utils/response/success.response";
import { fileURLToPath } from "url";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, getCompositions } from "@remotion/renderer";
import { cloud } from "../../../utils/multer/cloudinary.multer";
import VideoModel from "../../../db/models/Video.model";
import { generateScriptUsingGimini } from "../helpers/generateScriptUsingGimini";
import { createVoiceOver } from "../helpers/voiceover";
import splitText from "../helpers/splitText";
import { generateAiAvatarWithCroma } from "../../aiAvatar/services/aiAvatar.service";
import generateScript4Product from "../helpers/generateScript4Product";
import VoiceActorModel from "../../../db/models/VoiceActor.model";
import { getFontLoader } from "../helpers/getfontLoader";
import calculateFrames from "../helpers/calculateFrames";
import uploadToCloud from "../helpers/uploadToCloud";
import { generateAndUploadThumbnail } from "../helpers/generateAndUploadThumbnail.js";
import { makeRenderQueue } from "../../../../render-queue";
import { getWordTimestampsFromScript } from "../helpers/transcription";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const indexPath = path.resolve(
  __dirname,
  "../../../../../remotion/src/index.jsx"
);

const remotionBundleUrl = await bundle({
  entryPoint: path.resolve("remotion/index.ts"),
  onProgress(progress) {
    console.info(`Bundling Remotion project: ${progress}%`);
  },
});

const rendersDir = path.resolve("renders");
const queue = makeRenderQueue({
  port: Number(3000),
  serveUrl: remotionBundleUrl,
  rendersDir,
});

// Instant video
export const generateVideo = asyncHandler(async (req, res, next) => {
  console.log(req.user);




  /////////////////////////////////////////////
  // const startTime = Date.now();
  const { userPrompt, type, language, accentOrDialect } = req.body;
  // const framesPerSentence = calculateFrames(accentOrDialect);
  const voiceActor = await VoiceActorModel.findOne({ language, accentOrDialect });
  const referenceId = voiceActor.referenceId;
  if (!referenceId) { next(new Error("Failed to find voiceover actor with selected options")); }

  // try {
  console.log("Generating Script...");

  const scriptResponse = await generateScriptUsingGimini({ req, type, userPrompt, language });

  console.log(scriptResponse);

  if (!scriptResponse.script || !scriptResponse.formattedScript || !scriptResponse.title) {
    throw new Error("Failed to generate script correctly.");
  }

  const script = scriptResponse.formattedScript || "";
  const scriptId = scriptResponse.script._id || "";
  const title = scriptResponse.title || "";

  console.log("Formatted script:", script);

  // try {
  console.log("Generating Voiceover...");
  const voiceResponse = await createVoiceOver({
    req,
    title,
    scriptText: script,
    reference_id: referenceId,
    scriptId,
    language,
    accentOrDialect,
  });

  if (!voiceResponse.voice.voiceSource.secure_url) {
    next(new Error("Failed to generate voiceover correctly and upload it correctly"));
  }

  const voiceoverUrl = voiceResponse.voice.voiceSource.secure_url || null;

  console.log("Voiceover URL:", voiceoverUrl);

  const words = await getWordTimestampsFromScript(voiceoverUrl)
  console.log(words);

  const sentences = splitText(script);

  console.log("Sentences to render:", sentences);

  // const totalFrames = sentences.length * framesPerSentence;
  // const fontSize = req.body.fontSize || 80;
  // const color = req.body.color || "white";
  // const fontFamily = req.body.fontFamily || "Cairo";
  // const fontLoader = getFontLoader(fontFamily);
  // const { fontFamily: selectedFont } = await fontLoader();

  // const bundled = await bundle(indexPath);
  // const compositions = await getCompositions(bundled, {
  //   inputProps: { sentences, fontSize, color, fontFamily, voiceoverUrl, videoDuration: totalFrames, framesPerSentence }
  // });

  // const composition = compositions.find((c) => c.id === "MyVideo");
  // if (!composition) { next(new Error("Composition 'MyVideo' not found!")) }

  //     console.log("Composition found. Rendering video...");

  //     const outputLocation = `./output/video-${Date.now()}.mp4`;

  //     await renderMedia({
  //       concurrency: "4",
  //       chromiumOptions: {
  //         args: ['--disable-web-security', '--disable-gpu'],
  //       },
  //       timeoutInMilliseconds: 300000,
  //       composition: { ...composition, durationInFrames: totalFrames },
  //       serveUrl: bundled,
  //       codec: "h264",
  //       outputLocation,
  //       inputProps: { sentences, fontSize, color, fontFamily, voiceoverUrl, videoDuration: totalFrames, framesPerSentence }
  //     });


  const jobId = queue.createJob({
    titleText: req.body.titleText, words, voiceoverUrl
  });

  res.status(200).json({ jobId });

  //     const cloudUploadResult = await uploadToCloud({ req, title, outputLocation })
  //     const endTime = Date.now();
  //     const renderingTimeInSeconds = ((endTime - startTime) / 1000).toFixed(2);
  //     console.log(`Video rendering completed! Time taken: ${renderingTimeInSeconds} seconds`);
  //     const durationInSeconds = Math.round(cloudUploadResult.duration);

  //     const imagePath = path.resolve(
  //       __dirname,
  //       "../../../../../remotion/public/images/image1.jpg"
  //     );

  //     const thumbnailResult = await generateAndUploadThumbnail({
  //       req,
  //       imagePath,
  //       title
  //     });


  //     if (!thumbnailResult) {
  //       next(new Error("An error occured while getting the thumbnail url"));
  //     }

  //     const video = await VideoModel.create({
  //       createdBy: req.user._id,
  //       title,
  //       videoSource: cloudUploadResult,
  //       scriptId,
  //       duration: durationInSeconds,
  //       thumbnailUrl: thumbnailResult.secure_url,
  //       language,
  //       accentOrDialect,
  //       voiceId: voiceResponse.voice._id,
  //     });

  //     if (!video) {
  //       return next(
  //         new Error("An error saving the video into the database", {
  //           cause: 409,
  //         })
  //       );
  //     }

  //     console.log("Video data saved in the database!");

  //     return successResponse({
  //       res,
  //       status: 201,
  //       message: "Video created successfully",
  //       data: { video },
  //     });
  // } catch (error) {
  // console.error("Error generating video:", error);
  // res.status(500).json({ error: "Video generation failed." });
  // }
  // } catch (error) {
  // console.error("Error generating voiceover:", error);
  // res.status(500).json({ error: "Voiceover generation failed." });
  // }
  // res.status(500).json({ error: "Video generation failed." });
});

// AI Spoke person
export const generateAiAvatarVideo = asyncHandler(async (req, res, next) => {
  const { userPrompt, type, language, accentOrDialect, speaker } = req.body;
  const framesPerSentence = calculateFrames(accentOrDialect);

  try {
    console.log("Generating Script...");

    const scriptResponse = await generateScriptUsingGimini({ req, type, userPrompt, language });

    console.log(scriptResponse);

    if (!scriptResponse.script || !scriptResponse.formattedScript || !scriptResponse.title) {
      throw new Error("Failed to generate script correctly.");
    }

    const script = scriptResponse.formattedScript || "";
    const scriptId = scriptResponse.script._id || "";
    const title = scriptResponse.title || "";

    console.log("Formatted script:", script);

    try {
      const aiAvatarResponse = await generateAiAvatarWithCroma({ req, speaker, script })

      console.log(aiAvatarResponse.videoSource.secure_url);
      console.log(aiAvatarResponse.videoSource.fileName);

      const sentences = splitText(script);

      console.log("Sentences to render:", sentences);

      const totalFrames = sentences.length * framesPerSentence;

      const fontSize = req.body.fontSize || 80;
      const color = req.body.color || "white";
      const fontFamily = req.body.fontFamily || "Cairo";

      const fontLoader = getFontLoader(fontFamily);
      const { fontFamily: selectedFont } = await fontLoader();

      console.log(`Bundling project from: ${indexPath}`);
      const bundled = await bundle(indexPath);

      const compositions = await getCompositions(bundled, {
        inputProps: {
          // sentences,
          fontSize,
          color,
          fontFamily,
          fileName: aiAvatarResponse.videoSource.fileName,
          framesPerSentence
        },
      });

      const composition = compositions.find((c) => c.id === "MyVideo");

      if (!composition) {
        throw new Error("Composition 'MyVideo' not found!");
      }

      console.log("Composition found. Rendering video...");

      const outputLocation = `./output/video-${Date.now()}.mp4`;

      await renderMedia({
        concurrency: 1,
        timeoutInMilliseconds: 60000,
        composition: {
          ...composition,
          durationInFrames: totalFrames,
        },
        serveUrl: bundled,
        codec: "h264",
        outputLocation,
        inputProps: {
          // sentences,
          fontSize,
          color,
          fontFamily,
          fileName: aiAvatarResponse.videoSource.fileName,
          framesPerSentence
        },
      });

      console.log("Video rendering completed!");
      const cloudUploadResult = await uploadToCloud({ req, title, outputLocation })
      const durationInSeconds = Math.round(cloudUploadResult.duration);

      console.log("Video uploading completed!");

      const imagePath = path.resolve(
        __dirname,
        "../../../../../remotion/public/images/image1.jpg"
      );

      const thumbnailResult = await generateAndUploadThumbnail({
        req,
        imagePath,
        title
      });


      if (!thumbnailResult) {
        next(new Error("An error occured while getting the thumbnail url"));
      }

      const video = await VideoModel.create({
        createdBy: req.user._id,
        title,
        videoSource: cloudUploadResult,
        thumbnailUrl: thumbnailResult.secure_url,
        scriptId,
        language,
        accentOrDialect,
        duration: durationInSeconds,
      });

      console.log("Video data saved in the database!");

      return successResponse({
        res,
        status: 201,
        message: "Video created successfully",
        data: { video },
      });
    } catch (error) {
      console.error("Error generating video:", error);
      res.status(500).json({ error: "Video generation failed." });
    }
  } catch (error) {
    console.error("Error generating voiceover:", error);
    res.status(500).json({ error: "Voiceover generation failed." });
  }
  res.status(500).json({ error: "Video generation failed." });
});

// Ad video
export const generateAdVideo = asyncHandler(async (req, res, next) => {
  const { url, language, accentOrDialect } = req.body;
  const framesPerSentence = calculateFrames(accentOrDialect);
  const { referenceId } = await VoiceActorModel.findOne({ language, accentOrDialect })
  if (!referenceId) { next(new Error("Failed to find voiceover actor with selected options")); }

  try {
    console.log("Generating Script...");

    const scriptResponse = await generateScript4Product({ req, url, language });
    if (
      !scriptResponse.script ||
      !scriptResponse.scriptId ||
      !scriptResponse.title
    ) {
      throw new Error(
        "Failed to generate script. API returned invalid response."
      );
    }

    const script = scriptResponse.script || "";
    const scriptId = scriptResponse.scriptId || "";
    const title = scriptResponse.title || "";

    console.log("Formatted script:", script);

    try {
      console.log("Generating Voiceover...");

      const voiceResponse = await createVoiceOver({
        req,
        title,
        scriptText: script,
        scriptId,
        language,
        accentOrDialect,
        reference_id: referenceId
      });

      if (!voiceResponse.voice.voiceSource.secure_url) {
        next(new Error("Failed to generate voiceover correctly and upload it correctly"));
      }

      const voiceoverUrl = voiceResponse.voice.voiceSource.secure_url || null;

      const sentences = splitText(script);

      console.log("Sentences to render:", sentences);

      const totalFrames = sentences.length * framesPerSentence;

      const fontSize = req.body.fontSize || 80;
      const color = req.body.color || "white";
      const fontFamily = req.body.fontFamily || "Cairo";

      console.log(fontFamily);

      const fontLoader = getFontLoader(fontFamily);
      const { fontFamily: selectedFont } = await fontLoader();
      console.log(selectedFont);

      console.log(`Bundling project from: ${indexPath}`);
      const bundled = await bundle(indexPath);

      const compositions = await getCompositions(bundled, {
        inputProps: {
          sentences,
          fontSize,
          color,
          fontFamily,
          voiceoverUrl,
          framesPerSentence
        },
      });

      const composition = compositions.find((c) => c.id === "MyVideo");

      if (!composition) {
        next(new Error("Composition 'MyVideo' not found!"));
      }

      console.log("Composition found. Rendering video...");

      const outputLocation = `./output/video-${Date.now()}.mp4`;

      await renderMedia({
        concurrency: 1,
        timeoutInMilliseconds: 60000, // set to 1 minute
        composition: {
          ...composition,
          durationInFrames: totalFrames,
        },
        serveUrl: bundled,
        codec: "h264",
        outputLocation,
        inputProps: {
          sentences,
          fontSize,
          color,
          fontFamily,
          voiceoverUrl,
          framesPerSentence
        },
      });

      console.log("Video rendering completed!");

      const cloudUploadResult = await uploadToCloud({ req, title, outputLocation })
      const durationInSeconds = Math.round(cloudUploadResult.duration);

      console.log("Video uploading completed!");

      const imagePath = path.resolve(
        __dirname,
        "../../../../../remotion/public/images/image1.jpg"
      );

      const thumbnailResult = await generateAndUploadThumbnail({
        req,
        imagePath,
        title
      });


      if (!thumbnailResult) {
        next(new Error("An error occured while getting the thumbnail url"));
      }

      const video = await VideoModel.create({
        createdBy: req.user._id,
        title,
        videoSource: cloudUploadResult,
        scriptId,
        duration: durationInSeconds,
        thumbnailUrl: thumbnailResult.secure_url,
        language,
        accentOrDialect,
        voiceId: voiceResponse.voice._id,
      });

      console.log("Video data saved in the database!");

      return successResponse({
        res,
        status: 201,
        message: "Video created successfully",
        data: { video },
      });
    } catch (error) {
      console.error("Error generating video:", error);
      res.status(500).json({ error: "Video generation failed." });
    }
  } catch (error) {
    console.error("Error generating voiceover:", error);
    res.status(500).json({ error: "Voiceover generation failed." });
  }
  res.status(500).json({ error: "Video generation failed." });
});
