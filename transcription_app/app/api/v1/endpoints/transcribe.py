from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from app.services.transcription_service import handle_transcription_path
import os

router = APIRouter()

class PathRequest(BaseModel):
    path: str
    language: str = "en"

@router.post("/transcribe")
async def transcribe(request: PathRequest, background_tasks: BackgroundTasks):
    path = request.path
    language = request.language
    print(f"Received file path: {path}, Language: {language}")

    if not os.path.exists(path):
        return JSONResponse({"error": "File does not exist"}, status_code=400)

    try:
        result = await handle_transcription_path(path, language, background_tasks)
        return result
    except Exception as e:
        print("Error during transcription:", e)
        return JSONResponse({"error": str(e)}, status_code=500)