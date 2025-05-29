import axios from 'axios';

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
