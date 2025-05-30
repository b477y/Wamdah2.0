import axios from 'axios';
import fs from 'fs'; // You'll need this to read the audio file
import path from 'path';

export async function getWordTimestampsFromScript(absolutePath: string, transcriptionLanguage: string) {
    try {
        const response = await axios.post('http://localhost:8000/transcribe', {
            path: absolutePath,
            language: transcriptionLanguage
        });

        const { ...words } = response.data;

        if (!words || words.length === 0) {
            throw new Error("No words returned from transcription server.");
        }

        return words;
    } catch (err) {
        console.error("Transcription failed:", err.response?.data || err.message);
        throw new Error("Transcription failed.");
    }
}

export const transcribeWithDeepgram = async (filePath, language) => {
    try {
        const audioBuffer = fs.readFileSync(filePath);
        const filename = path.basename(filePath);

        const response = await axios.post(
            `https://api.deepgram.com/v1/listen?model=whisper&language=${language}`,
            audioBuffer,
            {
                headers: {
                    'Authorization': 'Token 43795122e1c2a9f245e2ddfcf401c0abef78a4b1',
                    'Content-Type': `audio/${filename.split('.').pop()}`,
                },
            }
        );

        // Process the Deepgram response to match your desired output
        const deepgramResults = response.data;
        const words = deepgramResults.results?.channels?.[0]?.alternatives?.[0]?.words;

        if (!words || words.length === 0) {
            console.warn("No words returned from Deepgram transcription. This might be due to silence or very short audio.");
            return {}; // Return an empty object if no words
        }

        const formattedWords = {};
        words.forEach((wordObj, index) => {
            formattedWords[index.toString()] = {
                word: wordObj.word,
                start: wordObj.start,
                end: wordObj.end,
            };
        });

        // You can console.dir(formattedWords, { depth: null }); here if you want to see the processed output
        return formattedWords;

    } catch (error) {
        console.error('Error during Deepgram transcription:', error.response?.data || error.message);
        throw new Error(`Deepgram Transcription failed: ${error.message || String(error)}`);
    }
};