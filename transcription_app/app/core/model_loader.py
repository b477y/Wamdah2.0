import torch
from faster_whisper import WhisperModel

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODEL_NAME = "large-v3"

print(f"Loading faster_whisper model '{MODEL_NAME}' on device: {DEVICE}")
model = WhisperModel(MODEL_NAME, device=DEVICE, compute_type="float16" if DEVICE == "cuda" else "int8")
print("Model loaded successfully.")
