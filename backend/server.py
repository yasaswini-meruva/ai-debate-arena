from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from debate_logic import run_debate
from rag_engine import process_pdf
import shutil
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class DebateRequest(BaseModel):
    topic: str
    num_rounds: int = 3
    use_rag: bool = False

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    # Save uploaded file
    upload_path = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    
    with open(upload_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Process PDF into ChromaDB
    chunk_count = process_pdf(upload_path)
    
    return {
        "message": f"PDF processed successfully!",
        "filename": file.filename,
        "chunks": chunk_count
    }

@app.post("/debate")
def debate(request: DebateRequest):
    result = run_debate(request.topic, request.num_rounds, request.use_rag)
    return result

from gtts import gTTS
import base64
from io import BytesIO

@app.post("/speak")
async def speak(request: dict):
    text = request.get("text", "")
    lang = "en"
    
    tts = gTTS(text=text, lang=lang, slow=False)
    audio_buffer = BytesIO()
    tts.write_to_fp(audio_buffer)
    audio_buffer.seek(0)
    
    audio_base64 = base64.b64encode(audio_buffer.read()).decode("utf-8")
    return {"audio": audio_base64}

@app.get("/")
def home():
    return {"status": "AI Debate Arena API Running!"}