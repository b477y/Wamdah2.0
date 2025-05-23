import mongoose from "mongoose";
import { AccentsAndDialects, Languages } from "../../utils/enum/enums";
import UserModel from "./User.model";

const VideoSchema = new mongoose.Schema(
  {
    jobId: String,
    createdBy: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    videoSource: { secure_url: { type: String, required: true }, public_id: { type: String, required: true }, },
    thumbnailUrl: { type: String },
    scriptId: { type: mongoose.Types.ObjectId, ref: "Script", required: true },
    voiceId: { type: mongoose.Types.ObjectId, ref: "Voice", required: false, default: undefined, },
    avatarId: { type: mongoose.Types.ObjectId, ref: "AiAvatar", required: false, default: undefined, },
    language: { type: String, lowercase: true, enum: Object.keys(Languages) },
    accentOrDialect: { type: String, lowercase: true, enum: Object.keys(AccentsAndDialects) },
    duration: { type: Number },
  }, { timestamps: true });

VideoSchema.post("save", async function (doc, next) {
  try {
    await UserModel.findByIdAndUpdate(doc.createdBy, { $inc: { aiCredits: -5 } });
    next();
  } catch (err) { next(err); }
});

const VideoModel = mongoose.models.Video || mongoose.model("Video", VideoSchema);
export default VideoModel;
