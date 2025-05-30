import VideoModel from "../../../db/models/Video.model";
import asyncHandler from "../../../utils/response/error.response";
import successResponse from "../../../utils/response/success.response";
import { cloud } from "../../../utils/multer/cloudinary.multer";
import UserModel from "../../../db/models/User.model";
import { emailEvent } from "../../../utils/events/email.event";
import CreditTransactionModel from "../../../db/models/CreditTransaction.model";
import { compareHash } from "../../../utils/security/hash.security";
import { generateTokens } from "../../../utils/security/token.security";
import { TokenType } from "../../../utils/enum/enums";
import { google } from "googleapis";
import axios from "axios";

export const getUserVideos = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 9;

  const skip = (page - 1) * limit;

  try {
    const videos = await VideoModel.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (!videos.length && page === 1) {
      return next(new Error("No videos to display.", { cause: 404 }));
    }

    const totalVideos = await VideoModel.countDocuments({ createdBy: req.user._id });
    const totalPages = Math.ceil(totalVideos / limit);

    return successResponse({
      res,
      status: 200,
      message: "User's videos retrieved successfully.",
      data: {
        videos,
        currentPage: page,
        totalPages,
        totalItems: totalVideos,
      },
    });
  } catch (error) {
    // Catch any database errors
    next(new Error(`Failed to get videos: ${error.message}`, { cause: 500 }));
  }
});

export const renameVideoTitle = asyncHandler(async (req, res, next) => {
  const { videoId, newTitle } = req.body;
  const video = await VideoModel.findById(videoId);
  if (!video) { return next(new Error("Video not found")); }
  const oldPublicId = video.videoSource.public_id;
  const folderPath = oldPublicId.split("/").slice(0, -1).join("/");
  const newPublicId = `${folderPath}/${newTitle}`;
  const result = await cloud.uploader.rename(oldPublicId, newPublicId, { resource_type: "video", overwrite: true, });
  video.videoSource.public_id = result.public_id;
  video.videoSource.secure_url = result.secure_url;
  video.title = newTitle;
  await video.save();
  return successResponse({ res, status: 200, message: "Video renamed successfully", data: { video }, });
});

export const getUserDashboard = asyncHandler(async (req, res, next) => {
  const { name } = await UserModel.findById(req.user._id).select("name");
  const videos = await VideoModel.find({ createdBy: req.user._id }).sort({ createdAt: -1 }).limit(3);
  const aiCredits = await UserModel.findById(req.user._id).select("aiCredits");
  const videosCount = await VideoModel.find({ createdBy: req.user._id }).countDocuments();
  successResponse({
    res, status: 200, message: "User's data retrieved successfully", data: { name, aiCredits, videosCount, videos },
  });
});

export const downloadVideo = asyncHandler(async (req, res, next) => {
  const { videoId } = req.body;
  const video = await VideoModel.findById(videoId);
  if (!video) { return next(new Error("Video not found")); }
  const videoUrl = video.videoSource.secure_url;
  res.setHeader("Content-Disposition", `attachment; filename="${video.title}.mp4"`);
  res.redirect(videoUrl);
});

export const getUserProfile = asyncHandler(async (req, res, next) => {
  const user = await UserModel.findById(req.user._id).select(
    "name email aiCredits"
  );
  const payments = await CreditTransactionModel.find({ userId: user._id }).select(
    "credits egpAmount paymentProvider paymentReference status createdAt -_id"
  );
  return successResponse({
    res,
    status: 200,
    message: "User's profile retrieved successfully",
    data: { user, payments },
  });
});

export const purchaseCredits = asyncHandler(async (req, res, next) => {
  const { credits } = req.body;
  if (typeof credits !== 'number' || credits <= 0) { return next(new Error('Credits must be a positive number.')); }
  const egpAmount = credits * 2;
  const user = await UserModel.findByIdAndUpdate(req.user._id, { $inc: { aiCredits: credits } }, { new: true });
  const paymentReference = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  await CreditTransactionModel.create({ userId: req.user._id, credits, egpAmount, paymentReference, status: "Success" })
  emailEvent.emit("sendPurchaseConfirmation", { email: user.email, name: user.name, credits });
  return successResponse({ res, status: 200, message: "AI credits added successfully" });
});

export const changePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmPassword) {
    return next(new Error("Please provide all required fields"));
  }

  const user = await UserModel.findById(req.user._id);

  if (!user) {
    return next(new Error("User not found"));
  }

  const isCorrect = await compareHash({ encryptedText: user.password, plaintext: oldPassword });

  if (!isCorrect) {
    return next(new Error("The old password is incorrect"));
  }

  if (newPassword !== confirmPassword) {
    return next(new Error("The new password and confirm password do not match"));
  }

  await UserModel.findByIdAndUpdate(req.user._id, { password: newPassword });

  const accessTokenSK = process.env.ACCESS_TOKEN_SK;
  const refreshTokenSK = process.env.REFRESH_TOKEN_SK;

  const tokens = await generateTokens({
    payload: { _id: req.user._id, role: req.user.role },
    accessTokenSK,
    refreshTokenSK,
    tokenType: [TokenType.ACCESS, TokenType.REFRESH],
  });

  return successResponse({
    res,
    status: 200,
    message: "Password updated successfully",
    data: { tokens },
  });
});

export const subscribeToNewsLetter = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  emailEvent.emit("subscribe", { email });

  return successResponse({
    res,
    status: 200,
    message: "Subscribed successfully",
  });
});

export const publishOnYoutube = asyncHandler(async (req, res) => {
  try {

    const GOOGLE_CLIENT_ID = "146654726525-69kq31dpk5ihb67hcvf87cjmne0d6p13.apps.googleusercontent.com";
    const GOOGLE_CLIENT_SECRET = "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";
    const GOOGLE_REDIRECT_URI = "http://localhost:3000/auth/google/callback";

    const { videoId } = req.body

    if (!videoId) {
      return res.status(400).send("Missing videoId");
    }

    const user = await UserModel.findById(req.user._id);

    const { googleTokens } = user;

    if (!googleTokens || !googleTokens.access_token || !googleTokens.refresh_token) {
      return res.status(400).send("Missing Google access token. Please connect your Google account properly to publish videos.");
    }

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: googleTokens.access_token,
      refresh_token: googleTokens.refresh_token,
    });

    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.refresh_token) {
        user.googleTokens.refresh_token = tokens.refresh_token;
        console.log("DEBUG: New refresh token issued. Saving to DB.");
      }
      user.googleTokens.access_token = tokens.access_token;
      console.log("DEBUG: Access token refreshed. Saving to DB.");
      await user.save();
    });

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    const video = await VideoModel.findById(videoId)

    const { videoSource } = video;

    const videoUrl = videoSource.secure_url

    const videoStream = await axios({
      method: "get",
      url: videoUrl,
      responseType: "stream",
    });

    const response = await youtube.videos.insert({
      part: "snippet,status",
      requestBody: {
        snippet: {
          title: `${video.title}`,
          // description: "",
          // tags: [""],
        },
        status: {
          privacyStatus: "public",
        },
      },
      media: {
        body: videoStream.data,
      },
    });

    res.status(200).send({
      message: "Video published successfully",
      videoId: response.data.id,
    });
  } catch (error) {
    console.error("Error publishing video:", error);
    if (error.response && error.response.data && error.response.data.error) {
      console.error("Google API Error:", error.response.data.error);
      if (error.response.data.error === 'invalid_grant' || error.response.status === 401) {
        const user = await UserModel.findById(req.user._id);
        if (user) {
          user.googleTokens = {};
          await user.save();
        }
        return res.status(401).send("Your Google account link has expired or been revoked. Please re-link your Google account.");
      }
    }
    res.status(500).send("Error publishing video");
  }
});
