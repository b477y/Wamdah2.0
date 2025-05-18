import { Router } from "express";
import * as testingService from "./services/testing.service";
import authentication from "../../middlewares/authentication.middleware";

const router = Router();

router.post(
  "/revideo",
  authentication(),
  testingService.generateVideoWithRevideo
);

export default router;
