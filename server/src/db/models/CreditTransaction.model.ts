import mongoose from "mongoose";

const CreditTransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    credits: { type: Number, required: true },
    egpAmount: { type: String, required: true },
    paymentProvider: { type: String, default: "Vodafone Cash" },
    paymentReference: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Success", "Failed"], default: "Pending" }
  }, { timestamps: true }
);

const CreditTransactionModel =
  mongoose.models.CreditTransaction ||
  mongoose.model("CreditTransaction", CreditTransactionSchema);
export default CreditTransactionModel;
