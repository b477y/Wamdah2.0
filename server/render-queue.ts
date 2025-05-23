import {
  makeCancelSignal,
  renderMedia,
  selectComposition,
} from "@remotion/renderer";
import { randomUUID } from "node:crypto";
import path from "node:path";
import uploadToCloud from "./src/modules/video/helpers/uploadToCloud";
import VideoModel from "./src/db/models/Video.model";

interface JobData {
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
      const inputProps = {
        titleText: job.data.titleText,
        voiceFile: job.data.voiceFile,
        words: job.data.words
      };

      const composition = await selectComposition({
        serveUrl,
        id: compositionId,
        inputProps,
      });


      const outputLocation = path.join(rendersDir, `${jobId}.mp4`);

      // Update job.data.localFilePath
      job.data.localFilePath = outputLocation;

      await renderMedia({
        cancelSignal,
        serveUrl,
        composition,
        concurrency: 28,
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

      jobs.set(jobId, {
        status: "completed",
        videoUrl: `http://localhost:${port}/renders/${jobId}.mp4`,
        data: job.data,
      });

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
        voiceId: job.data.voiceResponse.voice._id,
      });

      // if (!video) {
      //   return next(
      //     new Error("An error saving the video into the database", {
      //       cause: 409,
      //     })
      //   );
      // }

      // console.log("Video data saved in the database!");

      // const imagePath = path.resolve(
      //   __dirname,
      //   "../../../../../remotion/public/images/image1.jpg"
      // );

      // const thumbnailResult = await generateAndUploadThumbnail({
      //   req,
      //   imagePath,
      //   title
      // });


      // if (!thumbnailResult) {
      //   next(new Error("An error occured while getting the thumbnail url"));
      // }
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
