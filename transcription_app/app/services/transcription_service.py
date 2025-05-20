import os
from fastapi import BackgroundTasks
from fastapi.responses import JSONResponse
from app.core.model_loader import model

async def handle_transcription_path(path: str, background_tasks: BackgroundTasks):
    # This function uses the path directly without UploadFile
    try:
        print("Starting transcription on:", path)
        segments_generator, info = model.transcribe(path, beam_size=5, language="ar", word_timestamps=True)
        print("Transcription completed.")

        words = []
        for segment in segments_generator:
            if hasattr(segment, 'words') and segment.words:
                for word in segment.words:
                    words.append({
                        "word": word.word,
                        "start": word.start,
                        "end": word.end
                    })

        return JSONResponse(words)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

