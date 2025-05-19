import { GoogleGenerativeAI } from "@google/generative-ai";
import ScriptModel from "../../../db/models/Script.model";
import searchImages from "../../../utils/imagesCollector/imagesCollector";

const genAI = new GoogleGenerativeAI("AIzaSyCdl3I1w6YgRL3SEILwcLxfjD4aE-p9cZg");

export const generateScriptUsingGimini = async ({
  req,
  type,
  userPrompt,
  language,
}) => {
  const typePrompts = {
    motivational:
      "Create an uplifting and motivating script to inspire the audience.",
    educational:
      "Write an informative and concise script to explain a concept clearly to a general audience.",
    tech: "Create a script that simplifies a technical topic, making it engaging and easy to understand.",
  };

  const typePrompt = typePrompts[type];
  if (!typePrompt) throw new Error("Invalid video type");

  const fullPrompt = `
    ${typePrompt}
    The content for this video is: ${userPrompt}
    Please structure the script as follows:
    - Output should be plain text with sentences separated by a ".".
    - Break the content into short, easy-to-read sentences that fit within 1 second when spoken.
    - Sentences should consists of 3 words only not less than 3 words.
    - Use natural, engaging language, as if speaking directly to the audience.
    - Avoid long sentences, complex phrases, or unnecessary punctuation.
    - Ensure the script flows naturally and smoothly, without line breaks or section titles.
    - End with a clear and actionable sentence that encourages engagement.
    - All the script should be in ${language}.
  `;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
  });
  const generatedScript = result.response.text().trim();
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
  const keywordResult = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: keywordPrompt }] }],
  });
  const title = keywordResult.response.text().trim();

  if (!title) {
    throw new Error("An error occured while getting the keyword");
  }

  console.log("Extracted Title:", title);

  const script = await ScriptModel.create({
    title,
    content: generatedScript,
    createdBy: req.user._id,
  });
  if (!script) {
    throw new Error(
      "An error occured while saving the script into the database"
    );
  }
  // const images = await searchImages(title);

  return { script, formattedScript: generatedScript, title };
};
