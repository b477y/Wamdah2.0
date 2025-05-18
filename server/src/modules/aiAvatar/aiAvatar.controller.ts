import { Router } from "express";
import authentication from "../../middlewares/authentication.middleware";
import * as aiAvatarService from "./services/aiAvatar.service";

const router = Router();

router.post(
  "/generate-ai-avatar",
  authentication(),
  aiAvatarService.generateAiAvatarWithCroma
);
router.get(
  "/listing",
  authentication(),
  aiAvatarService.retrieveAiAvatars
);

export default router;
