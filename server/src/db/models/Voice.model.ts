import mongoose from "mongoose";
import { AccentsAndDialects, Languages } from "../../utils/enum/enums";

const VoiceSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    scriptId: { type: mongoose.Types.ObjectId, ref: "Script", required: true },
    voiceoverActorId: { type: mongoose.Types.ObjectId, ref: "Script", required: false },
    language: { type: String, lowercase: true, enum: Object.keys(Languages) },
    accentOrDialect: { type: String, lowercase: true, enum: Object.keys(AccentsAndDialects) },
  },
  { timestamps: true }
);

const VoiceModel =
  mongoose.models.Voice || mongoose.model("Voice", VoiceSchema);
export default VoiceModel;
