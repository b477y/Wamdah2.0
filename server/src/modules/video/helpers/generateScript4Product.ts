import { GoogleGenerativeAI } from "@google/generative-ai";
import ScriptModel from "../../../db/models/Script.model";
import { scrapeText } from "./scraper";
import { generateScriptWithAi } from "./scriptGenerator";
import searchImages from "../../../utils/imagesCollector/imagesCollector";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateScript4Product = async ({ req, url, language }) => {
  if (!req || !url || !language) {
    throw new Error("Invalid parameters");
  }
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const scrapedText = await scrapeText(url);
  if (!scrapedText) {
    throw new Error("An error occured while scraping the text");
  }
  const generatedScript = await generateScriptWithAi(scrapedText, language);
  if (!generatedScript) {
    throw new Error("An error occured while generating the script");
  }

  const keywordPrompt = `
The following is a video script:

"${generatedScript}"

Task:
1. If the script is in Arabic, translate it to English.
2. Identify one single keyword (or at most 2 words) that best represents the central topic of the script.
3. Return ONLY that keyword, without any explanation or punctuation.
`;

  if (!keywordPrompt) {
    throw new Error("An error occured while getting the keyword prompt");
  }

  // Use Gemini Flash for keyword extraction
  const result = await model.generateContent(keywordPrompt);

  const keyword = result.response.text().trim().replace(/[".]/g, "");

  if (!keyword) {
    throw new Error("An error occured while getting the keyword");
  }

  const script = await ScriptModel.create({
    title: keyword,
    content: generatedScript,
    createdBy: req.user._id,
  });

  if (!script) {
    throw new Error("An error occured while saving the script into the database");
  }

  await searchImages(keyword);

  return { script: generatedScript, scriptId: script._id, title: keyword };
};

export default generateScript4Product;
