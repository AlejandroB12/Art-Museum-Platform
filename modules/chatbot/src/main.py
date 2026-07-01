import os
import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Chatbot - Museo")

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
MODEL = "minimax-m3:cloud"
SYSTEM_PROMPT = (
    "Eres un asistente experto del Museo de Arte Contemporáneo llamado DoArt Magic. "
    "Ayudas a los visitantes con información sobre obras, artistas, géneros, "
    "membresías y la colección del museo. Sé amable, conciso y responde siempre en español."
)


class ChatRequest(BaseModel):
    mensaje: str


@app.get("/health")
async def health():
    return {"status": "ok", "service": "chatbot"}


@app.post("/api/chat")
async def chat(req: ChatRequest):
    if not req.mensaje or not req.mensaje.strip():
        raise HTTPException(status_code=400, detail="El mensaje es requerido")

    body = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": req.mensaje},
        ],
        "stream": False,
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(f"{OLLAMA_HOST}/api/chat", json=body)
            resp.raise_for_status()
            data = resp.json()
            return {"respuesta": data.get("message", {}).get("content", "Sin respuesta.")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar el mensaje: {str(e)}")
