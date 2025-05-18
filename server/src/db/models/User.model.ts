import mongoose from "mongoose";
import { generateHash } from "../../utils/security/hash.security";
import { UserRole } from "../../utils/enum/enums";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: {
      secure_url: { type: String },
      public_id: { type: String },
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    googleTokens: {
      access_token: { type: String },
      refresh_token: { type: String },
    },
    aiCredits: { type: Number, default: 25 },
    deletedAt: Date,
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await generateHash({ plaintext: this.password });
  }

  next();
});

UserSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  if (update.password) {
    update.password = await generateHash({ plaintext: update.password });
  }
  next();
});

const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
export default UserModel;
