import mongoose from "mongoose";

const ScriptSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

const ScriptModel =
  mongoose.models.Script || mongoose.model("Script", ScriptSchema);
export default ScriptModel;
