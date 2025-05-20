from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from app.services.transcription_service import handle_transcription_path
import os

router = APIRouter()

class PathRequest(BaseModel):
    path: str

@router.post("/transcribe")
async def transcribe(request: PathRequest, background_tasks: BackgroundTasks):
    path = request.path
    print("Received file path:", path)

    if not os.path.exists(path):
        return JSONResponse({"error": "File does not exist"}, status_code=400)

    try:
        # Call your transcription logic here, e.g.
        result = await handle_transcription_path(path, background_tasks)
        return result
    except Exception as e:
        print("Error during transcription:", e)
        return JSONResponse({"error": str(e)}, status_code=500)


