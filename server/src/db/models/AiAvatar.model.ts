import mongoose from "mongoose";

const AiAvatarSchema = new mongoose.Schema(
  {
    avatarName: { type: String, required: true },
    avatarId: { type: String, required: true },
    avatarImage: { type: String, required: true },
    voiceId: { type: String, required: true },
  },
  { timestamps: true }
);

const AiAvatarModel =
  mongoose.models.AiAvatar || mongoose.model("AiAvatar", AiAvatarSchema);
export default AiAvatarModel;
