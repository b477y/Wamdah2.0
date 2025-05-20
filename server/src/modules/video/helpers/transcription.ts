import axios from 'axios';

/**
 * Send absolute audio path to FastAPI server on the same machine.
 */
export async function getWordTimestampsFromScript(absolutePath: string) {
    try {
        const response = await axios.post('http://localhost:8000/transcribe', {
            path: absolutePath
        });

        const { ...words } = response.data;

        if (!words || words.length === 0) {
            throw new Error("No words returned from transcription server.");
        }

        return words ;
    } catch (err) {
        console.error("Transcription failed:", err.response?.data || err.message);
        throw new Error("Transcription failed.");
    }
}
