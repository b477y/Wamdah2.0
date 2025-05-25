import axios from "axios";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const downloadDir = path.resolve(
  __dirname,
  "../../../../public/templates/advertising"
);

// Retrieve API Key and CSE ID from environment variables
const apiKey = "AIzaSyAaPc4cykhygzRHC4qA0m0_mGPh0hVawJk";
const cx = "17a45a2b0e6794aa3";

const searchImages = async (query) => {
  const url = `https://www.googleapis.com/customsearch/v1?q=${query}&searchType=image&key=${apiKey}&cx=${cx}`;

  try {
    const response = await axios.get(url);
    const images = response.data.items;

    if (!images || images.length === 0) {
      throw new Error("No images found.");
    }

    // Ensure the download directory exists
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    const downloadedUrls = new Set();
    let successfulDownloads = 0;
    let imageIndex = 0;

    // Keep trying to download images until we have 3 successful ones
    while (successfulDownloads < 3) {
      // If there are no more images to check in the response, fetch more
      if (imageIndex >= images.length) {
        console.log("Fetching more images...");
        const nextPageUrl = response.data.queries.nextPage[0].startIndex;
        const nextPageResponse = await axios.get(
          `https://www.googleapis.com/customsearch/v1?q=${query}&searchType=image&key=${apiKey}&cx=${cx}&start=${nextPageUrl}`
        );
        response.data = nextPageResponse.data;
        images.push(...response.data.items); // Add new images to the list
      }

      const imageUrl = images[imageIndex].link;

      // Skip duplicates
      if (downloadedUrls.has(imageUrl)) {
        imageIndex++;
        continue;
      }

      const imagePath = path.join(
        downloadDir,
        `image${successfulDownloads + 1}.jpg`
      );

      try {
        const imageResponse = await axios.get(imageUrl, {
          responseType: "stream",
          timeout: 5000,
        });

        // Only download JPG images
        const contentType = imageResponse.headers["content-type"];
        if (contentType && contentType.includes("image/jpeg")) {
          const writer = fs.createWriteStream(imagePath);
          await new Promise((resolve, reject) => {
            imageResponse.data.pipe(writer);
            writer.on("finish", resolve);
            writer.on("error", reject);
          });

          downloadedUrls.add(imageUrl);
          successfulDownloads++;
          console.log(
            `✅ Downloaded image ${successfulDownloads}: ${imageUrl}`
          );
        } else {
          console.warn(`⚠️ Skipping non-JPG image: ${imageUrl}`);
        }
      } catch (err) {
        if (err.code === "ECONNABORTED") {
          console.warn(
            `⚠️ Timeout for image ${imageUrl}. Skipping to next image.`
          );
        } else {
          console.warn(
            `⚠️ Failed to download ${imageUrl}: ${err.message}. Skipping to next image.`
          );
        }
      }

      // Move to the next image
      imageIndex++;
    }

    console.log(`✅ Successfully downloaded ${successfulDownloads} image(s).`);
    return Array.from(downloadedUrls);
  } catch (error) {
    console.error(
      "❌ Error fetching or downloading images:",
      error.message || error
    );
    throw new Error("Failed to fetch or download images.");
  }
};

export default searchImages;
