import axios from 'axios';

const DEEPGRAM_API_KEY = "b447b0339a744cb1b747dbfe68d36d398ee75850";

if (!DEEPGRAM_API_KEY) {
    throw new Error("Missing Deepgram API key in environment variables.");
}

export async function getWordTimestampsFromScript(voiceoverUrl: string) {
    try {
        const response = await axios.post(
            'https://api.deepgram.com/v1/listen?model=whisper&language=ar',
            {
                url: voiceoverUrl, // Or your own Arabic voiceover URL
            },
            {
                headers: {
                    Authorization: `Token ${DEEPGRAM_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const words = response.data?.results?.channels?.[0]?.alternatives?.[0]?.words;

        if (!words || words.length === 0) {
            console.warn("Deepgram returned no words:", response.data);
            throw new Error("No words found in transcription result.");
        }

        return words; // array of { word, start, end, punctuated_word }
    } catch (err) {
        console.error("Transcription failed:", err);
        throw new Error("Deepgram transcription failed.");
    }
}
