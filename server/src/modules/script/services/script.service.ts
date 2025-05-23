import { GoogleGenerativeAI } from "@google/generative-ai";
import ScriptModel from "../../../db/models/Script.model";
import asyncHandler from "../../../utils/response/error.response";
import successResponse from "../../../utils/response/success.response";
import { scrapeText } from "../../video/helpers/scraper";
import { generateScriptWithAi } from "../../video/helpers/scriptGenerator";
import searchImages from "../../../utils/imagesCollector/imagesCollector";

const genAI = new GoogleGenerativeAI("AIzaSyCdl3I1w6YgRL3SEILwcLxfjD4aE-p9cZg");

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
  // const script = await ScriptModel.create({
  //   title: keyword,
  //   content: generatedScript,
  //   createdBy: req.user._id,
  //   generatedByAi: true,
  // });

  // Use keyword to fetch related images
  // await searchImages(keyword);

  // Send response
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
    motivational: `Create a short, powerful motivational video script. Inspire action or a shift in perspective. Focus on a core message.`,
    educational: `Create a short, clear educational video script. Explain the main topic simply. Focus on one key takeaway.`,
    tech: `Create a short, engaging tech video script. Simplify a complex tech idea. Make it easily understandable and intriguing.`,
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
- Script length must be between 300 and 400 characters. This is critical.
- Natural, spoken style for a short online video.
- Conversational and friendly tone.
- Very short, impactful sentences.
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


  // const script = await ScriptModel.create({
  //   title,
  //   content: generatedScript,
  //   createdBy: req.user._id,
  //   generatedByAi: true,
  // });

  // await searchImages(title);

  return successResponse({
    res,
    status: 200,
    message: "Script generated and images fetched successfully",
    data: { generatedScript, title },
  });
});
