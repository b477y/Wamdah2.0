from fastapi import FastAPI
from app.api.v1.endpoints import transcribe

app = FastAPI(title="Transcription Server")

app.include_router(transcribe.router)
