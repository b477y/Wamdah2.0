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
You are an expert ad copywriter. Your goal is to create compelling, easy-to-understand voice-over scripts for video ads. The script must be perfect for text-to-speech narration, sounding natural and engaging.

**Strict Scripting Guidelines:**
- Every sentence must be **very short and simple**. Aim for phrases that are clear and impactful on their own.
- Each sentence should convey **only one main idea**.
- Maintain a **natural, friendly, and enthusiastic conversational tone**. Speak directly to the audience, as if you're talking to a friend.
- Use only **one punctuation mark** at the end of each sentence (either a period "." or an exclamation mark "!"). Do not use any other punctuation.
- **Avoid complex sentence structures, clauses, or unusual phrasing.** Keep the language straightforward.
- The script should flow smoothly and naturally, making it easy for text-to-speech to deliver.
- **Focus strictly on product features and benefits.** Ignore any irrelevant details from the provided text (like "login" or "signup").
- Ensure the script has enough distinct sentences for a dynamic pace, feeling complete without being overly long.
- The entire script must be in **${accentOrDialect} ${language}**.
- Do not use headings, bullet points, numbered lists, or extra line breaks. The output must be a continuous block of text.
- Conclude with a **strong, clear, and actionable call to action**.

**Product Information for the Ad:**
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