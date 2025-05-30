import {
  makeCancelSignal,
  renderMedia,
  selectComposition,
} from "@remotion/renderer";
import { randomUUID } from "node:crypto";
import path from "node:path";
import uploadToCloud from "./src/modules/video/helpers/uploadToCloud";
import VideoModel from "./src/db/models/Video.model";
import { generateAiAvatarWOCroma } from "./src/modules/aiAvatar/services/aiAvatar.service";
import os from 'node:os';
import generateAndUploadThumbnail from "./src/modules/video/helpers/generateAndUploadThumbnail.js";
import { fileURLToPath } from "url";

interface JobData {
  fontFamily: any;
  speaker: any;
  req: any;
  script: any;
  timestamp: any;
  aiAvatarFile: any;
  type: any;
  title: any;
  scriptId: any;
  language: any;
  accentOrDialect: any;
  voiceId: { voiceId: any; };
  startTime: number;
  voiceFile: any;
  words: any;
  voiceoverUrl: any;
  titleText: string;
}

type JobState =
  | {
    status: "queued";
    data: JobData;
    cancel: () => void;
  }
  | {
    status: "in-progress";
    progress: number;
    data: JobData;
    cancel: () => void;
  }
  | {
    status: "completed";
    videoUrl: string;
    data: JobData;
  }
  | {
    status: "failed";
    error: Error;
    data: JobData;
  };

const compositionId = "RenderingComponent";

export const makeRenderQueue = ({
  port,
  serveUrl,
  rendersDir,
}: {
  port: number;
  serveUrl: string;
  rendersDir: string;
}) => {
  const jobs = new Map<string, JobState>();
  let queue: Promise<unknown> = Promise.resolve();

  const processRender = async (jobId: string) => {
    const job = jobs.get(jobId);
    if (!job) {
      throw new Error(`Render job ${jobId} not found`);
    }

    const { cancel, cancelSignal } = makeCancelSignal();

    jobs.set(jobId, {
      progress: 0,
      status: "in-progress",
      cancel: cancel,
      data: job.data,
    });

    try {

      const outputLocation = path.join(rendersDir, `${jobId}.mp4`);

      let aiAvatarResponse;

      if (job.data.speaker) {
        aiAvatarResponse = await generateAiAvatarWOCroma({
          req: job.data.req,
          speaker: job.data.speaker,
          script: job.data.script,
          timestamp: job.data.timestamp,
        });
        job.data.words = aiAvatarResponse.wordArray
      }

      const assetsPath = "http://localhost:3000/public";

      const inputProps = {
        titleText: job.data.titleText,
        voiceFile: job.data.voiceFile,
        aiAvatarFile: job.data.aiAvatarFile,
        speaker: job.data.speaker,
        script: job.data.script,
        words: job.data.words,
        type: job.data.type,
        timestamp: job.data.timestamp,
        fontFamily: job.data.fontFamily,
        assetsPath: assetsPath,
      };

      const composition = await selectComposition({
        serveUrl,
        id: compositionId,
        inputProps,

      });

      await renderMedia({
        concurrency: os.cpus().length - 6,
        chromiumOptions: {
          gl: "angle"
        },
        cancelSignal,
        serveUrl,
        composition,
        inputProps,
        codec: "h264",
        onProgress: (progress) => {
          console.info(`${jobId} render progress:`, progress.progress);
          jobs.set(jobId, {
            progress: progress.progress,
            status: "in-progress",
            cancel: cancel,
            data: job.data,
          });
        },
        outputLocation,
      });

      const cloudUploadResult = await uploadToCloud({ req: job.data.req, title: job.data.title, localFilePath: outputLocation })
      console.log(`uploaded`, cloudUploadResult);

      const durationInSeconds = Math.round(cloudUploadResult.duration);
      console.log(jobId);

      const video = await VideoModel.create({
        jobId,
        createdBy: job.data.req.user._id,
        title: job.data.title,
        videoSource: cloudUploadResult,
        scriptId: job.data.scriptId,
        duration: durationInSeconds,
        // thumbnailUrl: thumbnailResult.secure_url,
        language: job.data.language,
        accentOrDialect: job.data.accentOrDialect,
        ...(job.data.voiceId && { voiceId: job.data.voiceId }),
      });

      const endTime = Date.now()

      const howLongItTookMs = endTime - job.data.startTime;
      const totalSeconds = Math.floor(howLongItTookMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      console.log(`${minutes}m ${seconds}s`);

      jobs.set(jobId, {
        status: "completed",
        videoUrl: `http://localhost:${port}/renders/${jobId}.mp4`,
        data: job.data,
      });

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      if (job.data.type == undefined) {
        job.data.type = "advertising"
      }
      console.log({ type: job.data.type });

      const imagePath = path.resolve(
        __dirname,
        `../public/templates/${job.data.type}/image1.jpg`
      );

      const thumbnailResult = await generateAndUploadThumbnail({
        req: job.data.req,
        imagePath,
        title: job.data.title
      });

      if (!thumbnailResult) {
        next(new Error("An error occured while getting the thumbnail url"));
      }

      video.thumbnailUrl = thumbnailResult.secure_url;
      await video.save()

      if (!video) {
        return next(
          new Error("An error saving the video into the database", {
            cause: 409,
          })
        );
      }

    } catch (error) {
      console.error(error);
      jobs.set(jobId, {
        status: "failed",
        error: error as Error,
        data: job.data,
      });
    }
  };

  const queueRender = async ({
    jobId,
    data,
  }: {
    jobId: string;
    data: JobData;
  }) => {
    jobs.set(jobId, {
      status: "queued",
      data,
      cancel: () => {
        jobs.delete(jobId);
      },
    });

    queue = queue.then(() => processRender(jobId));
  };

  function createJob(data: JobData) {
    const jobId = randomUUID();

    queueRender({ jobId, data });

    return jobId;
  }

  return {
    createJob,
    jobs,
  };
};
