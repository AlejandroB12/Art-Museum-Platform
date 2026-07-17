import asyncio
import os
import re
import logging
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from neo4j import GraphDatabase
from pydantic import BaseModel

load_dotenv(dotenv_path=Path(__file__).resolve().parents[3] / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("chatbot")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
GEMINI_DISPONIBLE = False

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemma-2-9b-it:free")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_DISPONIBLE = False

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = "minimax-m3:cloud"

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USER = os.getenv("NEO4J_USERNAME")
NEO4J_PASS = os.getenv("NEO4J_PASSWORD")

NEO4J_SCHEMA_DESC = (
    "Nodos:\n"
    "- :Artista {id_artista: int, nombre: str, apellido: str, nacionalidad: str}\n"
    "- :Obra {id_obra: int, nombre: str, precio: float, estado: str, fotografia: str}\n"
    "- :Genero {nombre: str}\n"
    "- :Comprador {id_usuario: int, nombre: str, apellido: str, email: str}\n"
    "- :Estilo {nombre: str}\n"
    "- :Paleta {nombre: str}\n"
    "- :Tecnica {nombre: str}\n"
    "- :Epoca {nombre: str}\n\n"
    "Relaciones:\n"
    "- (:Artista)-[:CREO]->(:Obra)\n"
    "- (:Artista)-[:TRABAJA_EN]->(:Genero)\n"
    "- (:Comprador)-[:COMPRO]->(:Obra)\n"
    "- (:Obra)-[:TIENE_ESTILO]->(:Estilo)\n"
    "- (:Obra)-[:USA_PALETA]->(:Paleta)\n"
    "- (:Obra)-[:USA_TECNICA]->(:Tecnica)\n"
    "- (:Obra)-[:PERTENECE_A_EPOCA]->(:Epoca)\n"
    "- (:Obra)-[:SIMILAR_A {score: float}]->(:Obra)\n"
)

SYSTEM_PROMPT = (
    "Eres un viejo mago medieval que trabaja como guía en el Museo de Arte Contemporáneo "
    "DoArt Magic. Conoces cada rincón del museo y das información útil y veraz.\n\n"
    "Información del museo:\n"
    "- Nombre: DoArt Magic – Museo de Arte Contemporáneo (también conocido como Museo UNEG).\n"
    "- Descripción: Museo virtual que ofrece obras de arte contemporáneo físicas y digitales.\n"
    "- Membresía: Suscripción Digital por $10 USD, válida por 30 días. Otorga acceso premium "
    "y la posibilidad de comprar obras.\n"
    "- Contacto: +58 (0286) 971-1450\n"
    "- Ubicación: Puerto Ordaz, Estado Bolívar, Venezuela.\n"
    "- Servicios: Guía virtual (yo, el mago), newsletter, catálogo de artistas y obras, "
    "compraventa de arte con membresía.\n"
    "- Tipos de obras: Pintura, escultura, fotografía, arte digital, grabado, dibujo, mixta.\n\n"
    "Reglas:\n"
    "- Habla como mago: 'os', 'vuestro', 'merced', y metáforas de magia o alquimia.\n"
    "- Máximo 4 líneas breves, separadas por salto de línea.\n"
    "- Responde con datos concretos del museo (obras, artistas, precios, membresías).\n"
    "- No uses markdown (** ni *).\n"
    "- No te presentes ni te nombres.\n"
    "- Si no sabes algo: 'Los pergaminos del museo no revelan esa respuesta, joven aprendiz'."
)

app = FastAPI(title="Chatbot - Museo (Gemini + Cypher)")


@app.on_event("startup")
async def verificar_proveedores():
    global GEMINI_DISPONIBLE, OPENROUTER_DISPONIBLE

    if OPENROUTER_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=5, http2=False) as c:
                r = await c.get(
                    f"{OPENROUTER_BASE_URL}/auth/key",
                    headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}"},
                )
            if r.is_success:
                OPENROUTER_DISPONIBLE = True
                logger.info("OpenRouter disponible con modelo %s", OPENROUTER_MODEL)
            else:
                logger.warning("OpenRouter no disponible (status=%s): %s", r.status_code, r.text[:120])
        except Exception as e:
            logger.warning("OpenRouter no disponible: %s", e)
    else:
        logger.info("OpenRouter no disponible — no hay OPENROUTER_API_KEY")

    if not GEMINI_API_KEY:
        logger.info("Gemini no disponible — no hay GEMINI_API_KEY")
        return
    try:
        async with httpx.AsyncClient(timeout=5, http2=False) as c:
            r = await c.post(
                GEMINI_API_URL,
                headers={"X-goog-api-key": GEMINI_API_KEY},
                json={"contents": [{"parts": [{"text": "ping"}]}]},
            )
        if r.is_success and r.json().get("candidates"):
            GEMINI_DISPONIBLE = True
            logger.info("Gemini disponible con modelo %s", GEMINI_MODEL)
        else:
            logger.warning("Gemini no disponible (status=%s): %s", r.status_code, r.text[:120])
    except Exception as e:
        logger.warning("Gemini no disponible: %s", e)


class ChatRequest(BaseModel):
    mensaje: str


class CypherRequest(BaseModel):
    consulta: str


class CypherResponse(BaseModel):
    consulta: str
    cypher: str
    resultados: list | None = None
    error: str | None = None


# ---------------------------------------------------------------------------
#  Gemini helper (async, REST directa)
# ---------------------------------------------------------------------------

GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"


async def _gemini_generate(prompt: str, system: str | None = None) -> str:
    contents = {"contents": [{"parts": [{"text": prompt}]}]}
    if system:
        contents["system_instruction"] = {"parts": [{"text": system}]}
    async with httpx.AsyncClient(timeout=15, http2=False) as client:
        resp = await client.post(
            GEMINI_API_URL,
            headers={"X-goog-api-key": GEMINI_API_KEY},
            json=contents,
        )
        resp.raise_for_status()
        data = resp.json()
        candidates = data.get("candidates", [])
        if not candidates:
            return ""
        return candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")


# ---------------------------------------------------------------------------
#  Ollama helper (async)
# ---------------------------------------------------------------------------

def _limpiar_respuesta(texto: str) -> str:
    texto = re.sub(r"\*\*(.*?)\*\*", r"\1", texto)
    texto = re.sub(r"\*(.*?)\*", r"\1", texto)
    texto = re.sub(r"__(.*?)__", r"\1", texto)
    texto = re.sub(r"#{1,6}\s*", "", texto)
    texto = re.sub(r"\n{3,}", "\n\n", texto)
    texto = texto.strip()
    return texto


async def _openrouter_generate(prompt: str, system: str | None = None) -> str:
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{OPENROUTER_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://github.com/Art-Museum-Platform",
                "X-Title": "DoArt Magic Museum Chatbot",
            },
            json={
                "model": OPENROUTER_MODEL,
                "messages": messages,
                "max_tokens": 500,
                "temperature": 0.7,
                "safe_prompt": False,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def _ollama_generate(prompt: str, system: str | None = None) -> str:
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{OLLAMA_HOST}/api/chat",
            json={"model": OLLAMA_MODEL, "messages": messages, "stream": False},
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("message", {}).get("content", "Sin respuesta.")


# ---------------------------------------------------------------------------
#  Neo4j helper
# ---------------------------------------------------------------------------

def _neo4j_run(cypher: str, params: dict | None = None) -> list:
    if not NEO4J_URI or not NEO4J_USER or not NEO4J_PASS:
        raise HTTPException(status_code=503, detail="Neo4j no configurado")
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))
    try:
        with driver.session() as session:
            result = session.run(cypher, params or {})
            return [record.data() for record in result]
    finally:
        driver.close()


# ---------------------------------------------------------------------------
#  Endpoints
# ---------------------------------------------------------------------------


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "chatbot",
        "openrouter": OPENROUTER_DISPONIBLE,
        "gemini": GEMINI_DISPONIBLE,
        "ollama": bool(OLLAMA_HOST),
    }


@app.post("/api/chat")
async def chat(req: ChatRequest):
    if not req.mensaje or not req.mensaje.strip():
        raise HTTPException(status_code=400, detail="El mensaje es requerido")

    errores = []

    if OPENROUTER_DISPONIBLE:
        try:
            respuesta = await _openrouter_generate(req.mensaje, system=SYSTEM_PROMPT)
            if respuesta:
                return {"respuesta": _limpiar_respuesta(respuesta)}
        except Exception as e:
            logger.warning("OpenRouter falló: %s", e)
            errores.append(f"OpenRouter: {e}")

    if GEMINI_DISPONIBLE:
        try:
            respuesta = await _gemini_generate(req.mensaje, system=SYSTEM_PROMPT)
            if respuesta:
                return {"respuesta": _limpiar_respuesta(respuesta)}
        except Exception as e:
            logger.warning("Gemini falló: %s", e)
            errores.append(f"Gemini: {e}")

    try:
        respuesta = await _ollama_generate(req.mensaje, system=SYSTEM_PROMPT)
        return {"respuesta": _limpiar_respuesta(respuesta)}
    except Exception as e:
        logger.exception("Ollama también falló")
        errores.append(f"Ollama: {e}")
        raise HTTPException(status_code=503, detail="; ".join(errores))


@app.post("/api/nl2cypher", response_model=CypherResponse)
async def nl2cypher(req: CypherRequest):
    if not req.consulta or not req.consulta.strip():
        raise HTTPException(status_code=400, detail="La consulta es requerida")

    system = (
        "Eres un traductor de lenguaje natural a Cypher para Neo4j. "
        "El grafo contiene obras de arte, artistas, géneros, compradores, estilos, paletas, técnicas y épocas.\n\n"
        f"{NEO4J_SCHEMA_DESC}\n"
        "Reglas:\n"
        "1. Responde ÚNICAMENTE con la sentencia Cypher válida, sin markdown, sin explicaciones.\n"
        "2. Usa parámetros $param cuando haya valores literales del usuario.\n"
        "3. Si la consulta no se puede traducir responde: //NO_TRADUCIBLE\n"
        "4. Prefiere MATCH sobre OPTIONAL MATCH.\n"
        "5. Usa RETURN con nombres descriptivos.\n"
        "6. Limita resultados a 25 con LIMIT 25."
    )

    prompt = f"Traduce a Cypher: \"{req.consulta}\""

    errores = []

    if OPENROUTER_DISPONIBLE:
        try:
            cypher_raw = await _openrouter_generate(prompt, system=system)
            cypher_raw = cypher_raw.strip()
            if cypher_raw.startswith("//NO_TRADUCIBLE"):
                return CypherResponse(consulta=req.consulta, cypher="", error="Consulta no traducible")
            cypher_raw = re.sub(r"^```(?:cypher)?\s*", "", cypher_raw)
            cypher_raw = re.sub(r"\s*```$", "", cypher_raw)
            cypher_raw = cypher_raw.strip()
            if cypher_raw:
                resultados = _neo4j_run(cypher_raw)
                return CypherResponse(consulta=req.consulta, cypher=cypher_raw, resultados=resultados)
        except Exception as e:
            logger.warning("OpenRouter (nl2cypher) falló: %s", e)
            errores.append(str(e))

    if GEMINI_DISPONIBLE:
        try:
            cypher_raw = await _gemini_generate(prompt, system=system)
            cypher_raw = cypher_raw.strip()
            if cypher_raw.startswith("//NO_TRADUCIBLE"):
                return CypherResponse(consulta=req.consulta, cypher="", error="Consulta no traducible")
            cypher_raw = re.sub(r"^```(?:cypher)?\s*", "", cypher_raw)
            cypher_raw = re.sub(r"\s*```$", "", cypher_raw)
            cypher_raw = cypher_raw.strip()
            if cypher_raw:
                resultados = _neo4j_run(cypher_raw)
                return CypherResponse(consulta=req.consulta, cypher=cypher_raw, resultados=resultados)
        except Exception as e:
            logger.warning("Gemini (nl2cypher) falló: %s", e)
            errores.append(str(e))

    try:
        cypher_raw = await _ollama_generate(prompt, system=system)
        cypher_raw = cypher_raw.strip()
        cypher_raw = re.sub(r"^```(?:cypher)?\s*", "", cypher_raw)
        cypher_raw = re.sub(r"\s*```$", "", cypher_raw)
        cypher_raw = cypher_raw.strip()
        if cypher_raw:
            resultados = _neo4j_run(cypher_raw)
            return CypherResponse(consulta=req.consulta, cypher=cypher_raw, resultados=resultados)
    except Exception as e:
        errores.append(str(e))

    return CypherResponse(consulta=req.consulta, cypher="", error="; ".join(errores) if errores else "No disponible")
