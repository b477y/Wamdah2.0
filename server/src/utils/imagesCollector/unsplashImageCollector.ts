import axios from "axios";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";

// Unsplash API Credentials
const unsplashAccessKey = "j_5f_w65WuKLLk2D0dLRi_8hjCswUBo1P56HJxHzkOg";

const searchImagesByUnsplash = async (query, type) => {
  // Get the current directory for dynamic path resolution
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const downloadDir = path.resolve(
    __dirname,
    `../../../../public/templates/${type}`
  );

  const url = `https://api.unsplash.com/search/photos?query=${query}&per_page=30&client_id=${unsplashAccessKey}`;

  try {
    const response = await axios.get(url);
    const images = response.data.results;

    if (!images || images.length === 0) {
      throw new Error("No images found on Unsplash for the given query.");
    }

    // Ensure the download directory exists
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    const downloadedUrls = new Set();
    let successfulDownloads = 0;
    let imageIndex = 0;

    // Define target dimensions for the images
    const targetWidth = 1080;
    const targetHeight = 1920;

    // Keep trying to download images until we have 3 successful ones
    while (successfulDownloads < 3 && imageIndex < images.length) {
      const imageUrl = images[imageIndex].urls.raw;

      // Construct the URL to get a JPG image with the desired dimensions and cropping
      const finalImageUrl = `${imageUrl}&fm=jpg&w=${targetWidth}&h=${targetHeight}&fit=crop`;

      // Skip duplicates if the same image URL is encountered (less likely with specific dimensions)
      if (downloadedUrls.has(finalImageUrl)) {
        imageIndex++;
        continue;
      }

      const imagePath = path.join(
        downloadDir,
        `image${successfulDownloads + 1}.jpg`
      );

      try {
        const imageResponse = await axios.get(finalImageUrl, {
          responseType: "stream",
          timeout: 15000, // Increased timeout for potentially larger high-resolution images
        });

        // Verify content type to ensure it's a JPEG
        const contentType = imageResponse.headers["content-type"];
        if (contentType && contentType.includes("image/jpeg")) {
          const writer = fs.createWriteStream(imagePath);
          await new Promise((resolve, reject) => {
            imageResponse.data.pipe(writer);
            writer.on("finish", resolve);
            writer.on("error", reject);
          });

          downloadedUrls.add(finalImageUrl);
          successfulDownloads++;
          console.log(
            `✅ Downloaded image ${successfulDownloads}: ${finalImageUrl}`
          );
        } else {
          console.warn(
            `⚠️ Skipping non-JPG image from Unsplash (Content-Type: ${contentType}): ${finalImageUrl}`
          );
        }
      } catch (err) {
        if (axios.isCancel(err)) {
          console.warn(`⚠️ Download for ${finalImageUrl} was cancelled.`);
        } else if (err.code === "ECONNABORTED") {
          console.warn(
            `⚠️ Timeout for image ${finalImageUrl}. Skipping to next image.`
          );
        } else {
          console.warn(
            `⚠️ Failed to download ${finalImageUrl}: ${err.message
            }. Skipping to next image.`
          );
        }
      }

      // Move to the next image in the Unsplash results
      imageIndex++;
    }

    if (successfulDownloads === 0) {
      throw new Error("Could not download any JPG images from Unsplash with the specified dimensions.");
    }

    console.log(`✅ Successfully downloaded ${successfulDownloads} image(s).`);
    return Array.from(downloadedUrls);
  } catch (error) {
    console.error(
      "❌ Error fetching or downloading images from Unsplash:",
      error.message || error
    );
    throw new Error("Failed to fetch or download images from Unsplash.");
  }
};

export default searchImagesByUnsplash;