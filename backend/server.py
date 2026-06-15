from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from debate_logic import run_debate

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

@app.post("/debate")
def debate(request: DebateRequest):
    result = run_debate(request.topic, request.num_rounds)
    return result