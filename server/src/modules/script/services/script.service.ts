import { GoogleGenerativeAI } from "@google/generative-ai";
import ScriptModel from "../../../db/models/Script.model";
import asyncHandler from "../../../utils/response/error.response";
import successResponse from "../../../utils/response/success.response";
import { scrapeText } from "../../video/helpers/scraper";
import { generateScriptWithAi } from "../../video/helpers/scriptGenerator";
import searchImages from "../../../utils/imagesCollector/imagesCollector";
import searchImagesByUnsplash from "../../../utils/imagesCollector/unsplashImageCollector";

const genAI = new GoogleGenerativeAI("AIzaSyCdl3I1w6YgRL3SEILwcLxfjD4aE-p9cZg");

export const generateScript4Product = asyncHandler(async (req, res, next) => {
  const { url, language, accentOrDialect } = req.body;
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const type = "advertising"

  const scrapedText = await scrapeText(url);

  const generatedScript = await generateScriptWithAi(scrapedText, language, accentOrDialect);

  const keywordPrompt = `
The following is a video script:

"${generatedScript}"

Task:
1. If the script is in Arabic, translate it to English.
2. Identify one single keyword (or at most 2 words) that best represents the central topic of the script.
3. Return ONLY that keyword, without any explanation or punctuation.
`;

  const result = await model.generateContent(keywordPrompt);
  const keyword = result.response.text().trim().replace(/[".]/g, "");

  console.log("Extracted Title:", keyword);

  // Use keyword to fetch related images
  // await searchImages(keyword);
  await searchImagesByUnsplash(keyword, type)

  return successResponse({
    res,
    status: 201,
    message: "Script generated successfully",
    data: { generatedScript, title: keyword },
  });
});

export const generateScriptUsingGimini = asyncHandler(async (req, res, next) => {
  const { type, userPrompt, language, accentOrDialect } = req.body;
  // Refined typePrompts for conciseness and video focus
  const typePrompts = {
    motivational: `Craft a powerful motivational video script designed to inspire immediate action or a significant shift in perspective. The script should focus on one core message, using compelling language to evoke emotion and encourage a positive change. Consider including a clear call to action.`,
    educational: `Develop a concise and clear educational video script that explains a specific topic simply and effectively. The goal is for the viewer to grasp one key takeaway by the end. The script should break down complex information, use relatable examples, and maintain an engaging tone throughout.`,
    tech: `Create a dynamic and easy-to-understand tech video script that simplifies a complex technological concept or product. The script should make the idea easily digestible, intriguing, and relevant to a broad audience. Focus on demonstrating a practical benefit or solving a common problem.`,
    nutrition: `Write an engaging and informative nutrition video script that offers practical advice or debunks a common myth. The script should simplify nutritional information, making it accessible and actionable for viewers. Focus on one clear, actionable tip or insight that promotes healthier eating habits.`,
    tourism: `Develop an inviting and captivating video script designed to showcase a specific location and boost its tourism. The script should highlight the unique attractions, cultural experiences, and natural beauty of the place. Aim to evoke a strong sense of wanderlust and make viewers feel a personal connection to the destination, encouraging them to plan a visit.`
  };

  const typeInstruction = typePrompts[type];
  if (!typeInstruction) return next(new Error("Invalid video type"));

  // Updated fullPrompt emphasizing specific length constraints for a short video
  const fullPrompt = `
Generate a concise video script.

Type: ${typeInstruction}
Topic: "${userPrompt}"
Language: ${language}${accentOrDialect ? ` (${accentOrDialect})` : ""}.

Script Requirements:
- Script length must be between 250 and 300 characters the script should be more than 250 character. This is critical.
- Natural, spoken style for a short online video.
- Conversational and friendly tone.
- Avoid jargon.
- No formatting (plain text only).
- End with a strong, memorable final sentence (e.g., call to action, key thought, or summary).
- Output only the script text.
`;
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
  });
  const generatedScript = result.response.text().trim();

  // Keyword extraction
  const keywordPrompt = `
Given the following video script:

"${generatedScript}"

Your task:
1. If the script is in Arabic, first translate it to English.
2. Identify the most relevant keyword or phrase (1–2 words max) that captures the core topic.
3. Return ONLY that keyword—no explanation, no extra words, and no punctuation.
`;

  const keywordResult = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: keywordPrompt }] }],
  });
  const title = keywordResult.response.text().trim();

  console.log("Extracted Title:", title);

  // await searchImages(title);
  await searchImagesByUnsplash(title, type)

  return successResponse({
    res,
    status: 200,
    message: "Script generated and images fetched successfully",
    data: { generatedScript, title },
  });
});
