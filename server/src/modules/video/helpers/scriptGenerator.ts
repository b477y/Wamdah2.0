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
You are a plain-language product describer. Your goal is to provide a very simple, general overview of the product, avoiding all jargon. Focus on what the product is or does in an easy-to-understand way.

**Strict Output Guidelines:**
- Every statement must be **extremely simple and easy to grasp**.
- Maintain a **neutral, clear, and very straightforward tone**. Avoid any technical terms, marketing hype, or emotional language.
- Do not use complex sentences or clauses. Keep it basic, like explaining to a child.
- The output should be a smooth, continuous block of text.
- Focus only on the product's main purpose or general function. Ignore specific features, benefits, calls to action, or any detailed specifications (like "login" or "signup").
- The entire output must be in **${accentOrDialect} ${language}**.
- Do not use headings, bullet points, numbered lists, or extra line breaks.
- **The entire generated script must be between 250 and 300 characters, aiming for close to 275 characters.**

**Product Information (for general understanding):**
${scrapedText}
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