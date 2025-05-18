import { exec } from "child_process";
import path from "path";

const removeGreenBackground = (inputPath, outputFileName) => {
  return new Promise((resolve, reject) => {
    const outputDir = path.dirname(inputPath);
    const outputPath = path.resolve(outputDir, outputFileName);

    // FFmpeg command to remove green screen and export with transparency
    const ffmpegCommand = `ffmpeg -i "${inputPath}" -vf "chromakey=0x00FF00:0.1:0.2" -c:v libvpx -pix_fmt yuva420p -auto-alt-ref 0 -an -y "${outputPath}"`;

    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        console.error("FFmpeg Error:", stderr);
        return reject(error);
      }
      console.log("FFmpeg Output:", stdout);
      resolve(outputPath);
    });
  });
};

export default removeGreenBackground;
