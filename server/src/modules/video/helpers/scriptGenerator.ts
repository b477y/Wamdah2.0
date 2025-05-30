import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyCdl3I1w6YgRL3SEILwcLxfjD4aE-p9cZg");

export const generateScriptWithAi = async (
  scrapedText,
  language = "English",
  accentOrDialect
) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
  Generate a short, impactful advertising video script for a product.

  Product Information:
  ${scrapedText}

  Language: ${language}${accentOrDialect ? ` (${accentOrDialect})` : ""}.

  Script Requirements:
  - Length: Strictly between 250 and 300 characters.
  - Focus: Highlight the product's benefits or unique selling points.
  - Tone: Engaging, persuasive, and positive.
  - Style: Natural, conversational, and suitable for a quick online ad.
  - Format: Plain text only, no formatting or additional explanations.
  - Ending: Conclude with a strong, memorable call to action or a compelling statement about the product.
  - Output only the script text.
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    return text;
  } catch (error) {
    console.error("Error generating script with Gemini:", error);
    throw new Error("Failed to generate script");
  }
};