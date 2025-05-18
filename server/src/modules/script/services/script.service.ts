import { GoogleGenerativeAI } from "@google/generative-ai";
import ScriptModel from "../../../db/models/Script.model";
import asyncHandler from "../../../utils/response/error.response";
import successResponse from "../../../utils/response/success.response";
import { scrapeText } from "../../video/helpers/scraper";
import { generateScriptWithAi } from "../../video/helpers/scriptGenerator";
import searchImages from "../../../utils/imagesCollector/imagesCollector";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateScript4Product = asyncHandler(async (req, res, next) => {
  const { url, language } = req.body;
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const scrapedText = await scrapeText(url);

  const generatedScript = await generateScriptWithAi(scrapedText, language);

  const keywordPrompt = `
The following is a video script:

"${generatedScript}"

Task:
1. If the script is in Arabic, translate it to English.
2. Identify one single keyword (or at most 2 words) that best represents the central topic of the script.
3. Return ONLY that keyword, without any explanation or punctuation.
`;

  // Use Gemini Flash for keyword extraction
  const result = await model.generateContent(keywordPrompt);
  const keyword = result.response.text().trim().replace(/[".]/g, "");

  console.log("Extracted Title:", keyword);

  // Save script
  const script = await ScriptModel.create({
    title: keyword,
    content: generatedScript,
    createdBy: req.user._id,
    generatedByAi: true,
  });

  // Use keyword to fetch related images
  await searchImages(keyword);

  // Send response
  return successResponse({
    res,
    status: 201,
    message: "Script generated successfully",
    data: { script: generatedScript, scriptId: script._id, title: keyword },
  });
});

export const generateScriptUsingGimini = asyncHandler(async (req, res, next) => {
  const { type, userPrompt, language, accentOrDialect } = req.body;

  const typePrompts = {
    motivational:
      "Create an uplifting and motivating script to inspire the audience.",
    advertisement:
      "Create a persuasive advertisement script highlighting the benefits of a product or service.",
    script:
      "Write a general-purpose, engaging script that can work for various video types.",
  };

  const typePrompt = typePrompts[type];
  if (!typePrompt) return next(new Error("Invalid video type"));

  const fullPrompt = `
    ${typePrompt}
    The content for this video is: ${userPrompt}
    Please structure the script as follows:
    - Break the content into short, easy-to-read sentences that fit within 3 seconds when spoken.
    - Use natural, engaging language, as if speaking directly to the audience.
    - Avoid long sentences, complex phrases, or unnecessary punctuation.
    - Ensure the script flows naturally and smoothly, without line breaks or section titles.
    - Output should be plain text with sentences separated by a ".".
    - End with a clear and actionable sentence that encourages engagement.
    - All the script should be in ${language}.
  `;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
  });
  const generatedScript = result.response.text().trim();

  // Keyword extraction
  const keywordPrompt = `
    The following is a video script:

    "${generatedScript}"

    Task:
    1. If the script is in Arabic, translate it to English.
    2. Identify one single keyword (or at most 2 words) that best represents the central topic of the script.
    3. Return ONLY that keyword, without any explanation or punctuation.
  `;

  const keywordResult = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: keywordPrompt }] }],
  });
  const title = keywordResult.response.text().trim();
  console.log("Extracted Title:", title);

  const script = await ScriptModel.create({
    title,
    content: generatedScript,
    createdBy: req.user._id,
    generatedByAi: true,
  });

  await searchImages(title);

  return successResponse({
    res,
    status: 200,
    message: "Script generated and images fetched successfully",
    data: { script, formattedScript: generatedScript, title },
  });
});
