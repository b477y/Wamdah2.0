import { Router } from "express";
import * as voiceService from "./services/voiceover.service";
import authentication from "../../middlewares/authentication.middleware";

const router = Router();

router.post(
  "/create-voice-over",
  authentication(),
  voiceService.createVoiceOver
);

export default router;
