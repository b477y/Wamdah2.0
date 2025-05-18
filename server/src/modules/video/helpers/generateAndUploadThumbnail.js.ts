import { createCanvas, loadImage, registerFont } from "canvas";
import { cloud } from "../../../utils/multer/cloudinary.multer";
import path from "path";
import { fileURLToPath } from "url";
import stream from "stream";
import { promisify } from "util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register font once
const fontPath = path.join(__dirname, "./fonts/Lalezar-Regular.ttf");
registerFont(fontPath, {
  family: "Lalezar",
  weight: "400",
  style: "normal",
});

export async function generateAndUploadThumbnail({
  req,
  imagePath,
  title = "Your Video Title",
}) {
  const width = 1280;
  const height = 720;
  const fontSize = 150;
  const maxWidth = width * 0.9;
  const lineHeight = fontSize * 1.2;

  // Load image and prepare canvas
  const baseImage = await loadImage(imagePath);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Center crop logic
  const aspectRatio = baseImage.width / baseImage.height;
  const targetRatio = width / height;
  let sx, sy, sw, sh;

  if (aspectRatio > targetRatio) {
    sh = baseImage.height;
    sw = sh * targetRatio;
    sx = (baseImage.width - sw) / 2;
    sy = 0;
  } else {
    sw = baseImage.width;
    sh = sw / targetRatio;
    sx = 0;
    sy = (baseImage.height - sh) / 2;
  }

  ctx.drawImage(baseImage, sx, sy, sw, sh, 0, 0, width, height);

  // Overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, width, height);

  // Text setup
  ctx.font = `${fontSize}px "Lalezar"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const x = width / 2;
  const y = height / 2;

  // Wrap text function
  const wrapText = (text) => {
    const words = text.split(" ");
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + " " + words[i];
      if (ctx.measureText(testLine).width < maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const lines = wrapText(title);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, i) => {
    const currentY = startY + i * lineHeight;
    ctx.fillStyle = "black";
    ctx.globalAlpha = 0.7;
    for (let offset = 1; offset <= 5; offset++) {
      ctx.fillText(line, x + offset, currentY + offset);
    }
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(line, x, currentY);
  });

  // Upload to Cloudinary
  const buffer = canvas.toBuffer("image/png");
  const uploadStream = cloud.uploader.upload_stream({
    folder: `${process.env.APP_NAME}/${req.user._id}/thumbnails`,
    resource_type: "image",
  });

  const streamifier = await import("streamifier");
  const finishedUpload = promisify(stream.finished);

  const result = await new Promise((resolve, reject) => {
    const stream = cloud.uploader.upload_stream(
      {
        folder: `${process.env.APP_NAME}/${req.user._id}/thumbnails`,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.default.createReadStream(buffer).pipe(stream);
  });

  return result;
}

export default generateAndUploadThumbnail;
