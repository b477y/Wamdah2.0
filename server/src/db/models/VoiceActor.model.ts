import mongoose from "mongoose";
import { AccentsAndDialects, Languages } from "../../utils/enum/enums";

const VoiceActorSchema = new mongoose.Schema(
  {
    actorName: { type: String, required: true, unique: true },
    voiceId: { type: String, required: true, unique: true },
    referenceId: { type: String, required: true, unique: true },
    language: { type: String, enum: Object.keys(Languages) },
    accentOrDialect: { type: String, lowercase: true, enum: Object.keys(AccentsAndDialects) },
  },
  { timestamps: true }
);

const VoiceActorModel =
  mongoose.models.VoiceActor || mongoose.model("VoiceActor", VoiceActorSchema);
export default VoiceActorModel;
