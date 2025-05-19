import path from "node:path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.resolve("./src/config/.env") });
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: "dlt1zyqli",
  api_key: "747424945431247",
  api_secret: "nMcxMV3UfxLGch7pB4ZFPc-rkD4",
  secure: true,
});

export const cloud = cloudinary.v2;
