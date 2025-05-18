import { Router } from "express";
import * as userService from "./services/user.service";

import authentication from "../../middlewares/authentication.middleware";

const router = Router();

router.post("/subscribe-newsletter", userService.subscribeToNewsLetter);
router.post("/publish", authentication(), userService.publishOnYoutube);
router.get("/videos", authentication(), userService.getUserVideos);
router.patch("/rename-video-title", authentication(), userService.renameVideoTitle);
router.post("/download-video", authentication(), userService.downloadVideo);
router.get("/data", authentication(), userService.getUserDashboard);
router.get("/profile", authentication(), userService.getUserProfile);
router.patch("/change-password", authentication(), userService.changePassword);
router.post("/purchase-credits", authentication(), userService.purchaseCredits);

export default router;
