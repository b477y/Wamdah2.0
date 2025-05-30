import dotenv from "dotenv";
import path from "path";
dotenv.config();
import express from "express";
import { bundle } from "@remotion/bundler";
import { ensureBrowser } from "@remotion/renderer";
import bootstrap from './src/app.controller'

const { PORT = 3000, REMOTION_SERVE_URL } = process.env;

const app = express();

async function main() {
  await ensureBrowser();

  const remotionBundleUrl = REMOTION_SERVE_URL
    ? REMOTION_SERVE_URL
    : await bundle({
      entryPoint: path.resolve("remotion/index.ts"),
      onProgress(progress) {
        console.info(`Bundling Remotion project: ${progress}%`);
      },
    });

  await bootstrap(app, express)

  app.listen(PORT, () => {
    console.info(`Server is running on port ${PORT}`);
  });
}

main();
