import { Router } from "express";
import * as scriptService from "./services/script.service";
import authentication from "../../middlewares/authentication.middleware";

const router = Router();

router.post(
  "/generate-ad-script",
  authentication(),
  scriptService.generateScript4Product
);
router.post("/generate", authentication(), scriptService.generateScriptUsingGimini);

export default router;
