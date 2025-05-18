import { Router } from "express";
import * as authService from "./services/auth.service";
import passport from "../../utils/passport/passport";
import { decodeToken } from "../../utils/security/token.security";
import { TokenType } from "../../utils/enum/enums";
import UserModel from "../../db/models/User.model";

const router = Router();

router.get("/refresh-token", authService.refreshToken);
router.post("/signup", authService.signUp);
router.post("/signin", authService.signIn);
router.get('/google', authService.initiateGoogleOAuth);
router.get('/google/callback', authService.handleGoogleOAuthCallback);

export default router;
