import { Router } from "express";
import authentication from "../../middlewares/authentication.middleware";
import * as videoService from "./services/video.service";
import checkCredits from "../../middlewares/checkCredits.middleware";

const router = Router();

// Instant Ai Video
router.post(
  "/generate",
  authentication(),
  checkCredits,
  videoService.generateVideo
);

// AI Spoke person
router.post(
  "/generate-avatar",
  authentication(),
  checkCredits,
  videoService.generateAiAvatarVideo
);

// Ad video
router.post(
  "/generate-ad",
  authentication(),
  checkCredits,
  videoService.generateAdVideo
);

export default router;
