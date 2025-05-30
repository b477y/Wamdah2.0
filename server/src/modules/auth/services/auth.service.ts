import asyncHandler from "../../../utils/response/error.response";
import UserModel from "../../../db/models/User.model";
import successResponse from "../../../utils/response/success.response";
import { TokenType } from "../../../utils/enum/enums";
import { compareHash } from "../../../utils/security/hash.security";
import {
  generateTokens,
  decodeToken,
} from "../../../utils/security/token.security";
import { emailEvent } from "../../../utils/events/email.event";
import passport from "../../../utils/passport/passport";

export const signUp = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) { return next(new Error("All inputs are required to signup", { cause: 409 })); }

  const user = await UserModel.findOne({ email, deletedAt: { $exists: false } });
  if (user) { return next(new Error("Email already exists", { cause: 409 })); }

  const accessTokenSK = process.env.ACCESS_TOKEN_SK;
  const refreshTokenSK = process.env.REFRESH_TOKEN_SK;

  const newUser = await UserModel.create({ name, email, password });

  emailEvent.emit("sendWelcome", { email, name });

  const tokens = await generateTokens({
    payload: { _id: newUser._id, role: newUser.role },
    accessTokenSK,
    refreshTokenSK,
    tokenType: [TokenType.ACCESS, TokenType.REFRESH],
  });

  return successResponse({ res, status: 201, message: "Account created successfully.", data: { tokens }, });
});

export const signIn = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await UserModel.findOne({ email, deletedAt: { $exists: false } });
  if (!user) { return next(new Error("User not found", { cause: 404 })); }

  const isMatch = await compareHash({ plaintext: password, encryptedText: user.password, });
  if (!isMatch) { return next(new Error("Invalid credentials", { cause: 400 })); }

  const accessTokenSK = process.env.ACCESS_TOKEN_SK;
  const refreshTokenSK = process.env.REFRESH_TOKEN_SK;

  const tokens = await generateTokens({
    payload: { _id: user._id, role: user.role },
    accessTokenSK,
    refreshTokenSK,
    tokenType: [TokenType.ACCESS, TokenType.REFRESH],
  });

  return successResponse({ res, status: 200, message: "Logged in successfully", data: { tokens }, });
});

export const refreshToken = asyncHandler(async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) { return next(new Error("Authorization header is required", { cause: 401 })); }

  const user = await decodeToken({ authorization, tokenType: TokenType.REFRESH });

  if (!user || !user._id || !user.role) { return next(new Error("Invalid or expired refresh token", { cause: 401 })); }

  let accessTokenSK = process.env.ACCESS_TOKEN_SK;
  let refreshTokenSK = process.env.REFRESH_TOKEN_SK;

  const tokens = await generateTokens({
    payload: { _id: user._id, role: user.role },
    accessTokenSK,
    refreshTokenSK,
    tokenType: [TokenType.ACCESS, TokenType.REFRESH],
  });

  return successResponse({ res, status: 200, message: "Tokens refreshed successfully", data: { tokens } });
});

export const initiateGoogleOAuth = [
  asyncHandler(async (req, res, next) => {
    const platformAccessToken = req.query.platform_access_token;
    if (!platformAccessToken) {
      return next(new Error("Platform access token is required", { cause: 400 }));
    }

    try {
      const decoded = await decodeToken({
        authorization: platformAccessToken,
        tokenType: TokenType.ACCESS,
      });

      if (!decoded?._id) {
        return next(new Error("Invalid platform access token", { cause: 401 }));
      }

      req.platformUserId = decoded._id;
      next();
    } catch (error) {
      return next(new Error("Invalid platform access token", { cause: 401 }));
    }
  }),

  (req, res, next) => {
    passport.authenticate('google', {
      scope: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube',
      ],
      accessType: 'offline',
      prompt: 'consent',
      state: req.platformUserId,
    })(req, res, next);
  }
];

export const handleGoogleOAuthCallback = asyncHandler(async (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, googleUser, info) => {
    const FRONTEND_URL = "http://127.0.0.1:4200"
    try {
      if (err || !googleUser) {
        console.error('Google OAuth error:', err || 'No user returned');
        return res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
      }

      const userId = req.query.state;
      if (!userId) {
        return res.redirect(`${FRONTEND_URL}/login?error=invalid_state`);
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.redirect(`${FRONTEND_URL}/login?error=user_not_found`);
      }

      user.googleTokens = {
        access_token: googleUser.accessToken,
        refresh_token: googleUser.refreshToken,
      };
      await user.save();

      res.redirect(`${FRONTEND_URL}/dashboard?google_auth=success`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${FRONTEND_URL}/login?error=server_error`);
    }
  })(req, res, next);
});
