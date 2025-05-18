import axios from "axios";

export const generateScriptWithAi = async () => {
  const API_KEY = process.env.GROQ_API_KEY;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions", // Adjust URL if needed
      {
        model: "llama-3.3-70b-versatile", // High-quality AI model
        messages: [
          {
            role: "user",
            content: `
            Convert this text into a structured, fluid, and conversational script for a short advertisement or voice-over:
            - Break the content into short, easy-to-read sentences that fit within 2.5 to 3 seconds when spoken.
            - Use natural, engaging language, as if the host is speaking directly to the audience.
            - Avoid long sentences, complex phrases, or unnecessary punctuation.
            - Ensure the script flows naturally and smoothly without line breaks or section titles.
            - Output should be in plain text, using "." as the only separator for splitting.
            - End with a clear and actionable sentence that encourages engagement.
          
            Here's the text to convert:
            ${scrapedText}
          `,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content; // Returning the generated script
  } catch (error) {
    console.error("Error generating script:", error);
    throw new Error("Failed to generate script");
  }
};
