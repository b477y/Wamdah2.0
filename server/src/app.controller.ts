import connect2db from "./db/connection";
import errorHandlingMiddleware from "./middlewares/errorHandling.middleware";
import cors from "cors";
import videoController from "./modules/video/video.controller";
import voiceController from "./modules/voiceover/voiceover.controller";
import scriptController from "./modules/script/script.controller";
import authController from "./modules/auth/auth.controller";
import aiAvatarController from "./modules/aiAvatar/aiAvatar.controller";
import userController from "./modules/user/user.controller";
import testingController from "./modules/testing/testing.controller";
import path from "node:path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import session from "express-session";
import passport from "./utils/passport/passport";
import { makeRenderQueue } from "../render-queue";
import { queue } from "./modules/video/services/video.service";
import VideoModel from "./db/models/Video.model";
import { promises as fsPromises } from 'node:fs';
import * as fs from 'node:fs';

const bootstrap = (app, express, remotionBundleUrl: string) => {

  const rendersDir = path.resolve("renders");
  // const queue = makeRenderQueue({
  //   port: Number(3000),
  //   serveUrl: remotionBundleUrl,
  //   rendersDir,
  // });

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Host renders on /renders
  app.use("/renders", express.static(rendersDir));
  app.use('/public', express.static(path.join(__dirname, '../../public')));

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "mySuperSecretKey123",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(express.json());
  app.use(cors({ origin: "*" }));
  app.use(morgan("dev"));
  app.use(cookieParser());
  // Serve the videos directory

  // const { PORT = 3000, REMOTION_SERVE_URL } = process.env;

  // const rendersDir = path.resolve("renders");

  // const remotionBundleUrl = REMOTION_SERVE_URL
  //   ? REMOTION_SERVE_URL
  //   : await bundle({
  //     entryPoint: path.resolve("remotion/index.ts"),
  //     onProgress(progress) {
  //       console.info(`Bundling Remotion project: ${progress}%`);
  //     },
  //   });

  // const queue = makeRenderQueue({
  //   port: Number(PORT),
  //   serveUrl: remotionBundleUrl,
  //   rendersDir,
  // });

  // Endpoint to create a new job
  app.post("/renders", async (req, res) => {
    const titleText = req.body?.titleText || "Hello, world!";

    if (typeof titleText !== "string") {
      res.status(400).json({ message: "titleText must be a string" });
      return;
    }

    const jobId = queue.createJob({ titleText });

    res.json({ jobId });
  });

  // Endpoint to get a job status
  app.get("/renders/:jobId", async (req, res) => {
    const jobId = req.params.jobId;
    const job = queue.jobs.get(jobId);

    if (!job) {
      return res.status(404).json({ error: "Invalid JobId" });
    }

    let video;

    if (job.status === "completed") {
      console.log("completed");
      video = await VideoModel.findOne({ jobId }).select("-thumbnailUrl")
    }

    res.json({
      status: job.status,
      progress: job.progress,
      video
    });
  });

  // app.get("/renders/:jobId", async (req, res) => {
  //   const jobId = req.params.jobId;
  //   const job = queue.jobs.get(jobId); // Access your queue instance from app.locals

  //   if (!job) {
  //     return res.status(404).json({ error: "Invalid JobId" });
  //   }

  //   if (job.status === "completed") {
  //     console.log(`Job ${jobId} status is 'completed'. Attempting to stream video.`);
  //     const filePath = path.join(rendersDir, `${jobId}.mp4`);

  //     try {
  //       // Check if the file actually exists on disk using fsPromises.access
  //       await fsPromises.access(filePath); // <-- FIX: Use fsPromises.access here

  //       // Set headers for video streaming
  //       res.setHeader('Content-Type', 'video/mp4'); // Crucial for video players
  //       res.setHeader('Accept-Ranges', 'bytes');    // Enables seeking/scrubbing in video players
  //       // res.setHeader('Content-Disposition', 'inline'); // Optional: suggests displaying inline

  //       // Stream the file directly to the client using fs.createReadStream
  //       const fileStream = fs.createReadStream(filePath); // <-- FIX: Use fs.createReadStream here
  //       fileStream.pipe(res);

  //       fileStream.on('error', (streamErr) => {
  //         console.error(`Error streaming file ${filePath} for job ${jobId}:`, streamErr);
  //         if (!res.headersSent) { // Prevent setting headers if already sent
  //           res.status(500).send('Error streaming video.');
  //         }
  //       });

  //       console.log(`Streaming video for job ${jobId} from ${filePath}`);

  //     } catch (error) {
  //       console.error(`Video file not found or streaming error for job ${jobId}:`, error);
  //       // If the file is not found (e.g., deleted after cloud upload), or a streaming error occurs,
  //       // return a JSON error status.
  //       if (!res.headersSent) {
  //         res.status(404).json({
  //           status: "failed", // Or a more specific status like 'video_unavailable'
  //           error: "Video file not found or an error occurred during streaming.",
  //           jobId: jobId, // Include jobId for context
  //         });
  //       }
  //     }
  //   } else {
  //     // If the job is not 'completed' (i.e., 'queued' or 'in-progress'),
  //     // return JSON status with progress.

  //     // Filter out 'req' from job.data to avoid sending sensitive info to the client
  //     // const { req: _, ...dataForClient } = job.data;

  //     // Construct and provide the videoUrl here
  //     const host = req.headers.host;
  //     const protocol = req.protocol;
  //     const videoUrl = `${protocol}://${host}/renders/${jobId}`; // This endpoint IS the video URL

  //     res.json({
  //       status: job.status,
  //       progress: job.status === "in-progress" ? job.progress : undefined, // Only send progress if applicable
  //       videoUrl: videoUrl, // Now the video URL is correctly provided
  //       // data: dataForClient, // Include cleaned job data
  //     });
  //     console.log(`Job ${jobId} status is '${job.status}'. Returning JSON status with future video URL.`);
  //   }
  // });


  app.use("/videos", express.static(path.join(__dirname, "../videos")));

  app.use("/api/auth", authController);
  app.use("/api/videos", videoController);
  app.use("/api/voices", voiceController);
  app.use("/api/scripts", scriptController);
  app.use("/api/aiAvatar", aiAvatarController);
  app.use("/api/user", userController);
  app.use("/api/testing", testingController);

  // app.get("", (req, res) => {
  //   return res.status(200).json({ message: `${process.env.APP_NAME}` });
  // });

  // app.all("*", (req, res) => {
  //   return res.status(404).json({ message: "Invalid routing" });
  // });

  app.use(errorHandlingMiddleware);

  connect2db();
};

export default bootstrap;
