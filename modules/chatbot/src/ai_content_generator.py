"""
Enriquecimiento de MongoDB con IA (Gemini).

Genera biografías de artistas y descripciones de obras mediante Prompt Engineering
usando la API de Gemini. Solo procesa documentos que carecen de estos campos.

Uso:
    python modules/chatbot/src/ai_content_generator.py
    python modules/chatbot/src/ai_content_generator.py --force   (reprocesa todos)
"""

import argparse
import logging
import os
import sys
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv
import pymongo

load_dotenv(dotenv_path=Path(__file__).resolve().parents[3] / ".env")

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger("ai_content_generator")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGO_URI_FALLBACK")
DB_NAME = "museodb"

if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY no está definida en el .env")
    sys.exit(1)

if not MONGO_URI:
    logger.error("MONGO_URI no está definida en el .env")
    sys.exit(1)


def _call_gemini(prompt: str, system: str | None = None, retries: int = 2) -> str:
    for attempt in range(retries + 1):
        try:
            contents = {"contents": [{"parts": [{"text": prompt}]}]}
            if system:
                contents["system_instruction"] = {"parts": [{"text": system}]}
            resp = httpx.post(
                GEMINI_API_URL,
                params={"key": GEMINI_API_KEY},
                json=contents,
                timeout=60,
            )
            resp.raise_for_status()
            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return ""
            return candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
        except Exception as e:
            logger.warning("Intento %d falló: %s", attempt + 1, e)
            if attempt < retries:
                time.sleep(2 ** attempt)
    return ""


# ---------------------------------------------------------------------------
#  Biografías de artistas
# ---------------------------------------------------------------------------

BIO_SYSTEM = (
    "Eres un historiador del arte experto. Genera biografías breves para artistas "
    "en español (máximo 150 palabras). Resalta su estilo, nacionalidad, época y contribución."
)

BIO_PROMPT = (
    "Escribe una biografía en español para el siguiente artista del Museo de Arte Contemporáneo.\n"
    "Datos:\n"
    "- Nombre completo: {nombre} {apellido}\n"
    "- Nacionalidad: {nacionalidad}\n"
    "- Fecha de nacimiento: {fecha}\n\n"
    "La biografía debe sonar natural, profesional y atractiva para visitantes del museo."
)


def generar_biografia(artista: dict) -> str:
    prompt = BIO_PROMPT.format(
        nombre=artista.get("nombre", ""),
        apellido=artista.get("apellido", ""),
        nacionalidad=artista.get("nacionalidad", "Desconocida"),
        fecha=artista.get("fecha_nacimiento", "No disponible"),
    )
    return _call_gemini(prompt, system=BIO_SYSTEM)


# ---------------------------------------------------------------------------
#  Descripciones de obras
# ---------------------------------------------------------------------------

DESC_SYSTEM = (
    "Eres un curador de museo. Describe obras de arte en español de forma "
    "evocadora pero concisa (máximo 100 palabras). Menciona estilo visual, "
    "materiales sugeridos y sensación que transmite."
)

DESC_PROMPT = (
    "Genera una descripción atractiva en español para esta obra del museo:\n"
    "- Título: {nombre}\n"
    "- Género: {genero}\n"
    "- Artista ID: {artista_id}\n"
    "- Año: {ano}\n\n"
    "Si el género es 'Pintura' describe colores y composición; si es 'Escultura' "
    "describe materiales y forma; si es 'Fotografía' describe la escena y luz."
)


def generar_descripcion(obra: dict) -> str:
    ano = ""
    if obra.get("fecha_creacion"):
        try:
            ano = str(obra["fecha_creacion"].year)
        except Exception:
            ano = str(obra["fecha_creacion"])[:4]
    prompt = DESC_PROMPT.format(
        nombre=obra.get("nombre", "Sin título"),
        genero=obra.get("genero", {}).get("nombre", "Desconocido"),
        artista_id=obra.get("artista", "?"),
        ano=ano,
    )
    return _call_gemini(prompt, system=DESC_SYSTEM)


# ---------------------------------------------------------------------------
#  Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Enriquecer MongoDB con IA")
    parser.add_argument("--force", action="store_true", help="Reprocesar todos los documentos")
    args = parser.parse_args()

    logger.info("Conectando a MongoDB...")
    client = pymongo.MongoClient(MONGO_URI)
    db = client[DB_NAME]
    artistas_col = db["artistas"]
    obras_col = db["obras"]

    # --- Artistas ---
    if args.force:
        filter_artistas = {}
        label_a = "artistas"
    else:
        filter_artistas = {"$or": [{"biografia": ""}, {"biografia": None}, {"biografia": {"$exists": False}}]}
        label_a = "artistas sin biografía"
        # También considerar biografías muy cortas
        filter_artistas = {
            "$or": [
                {"biografia": ""},
                {"biografia": None},
                {"biografia": {"$exists": False}},
                {"$expr": {"$lt": [{"$strLenCP": "$biografia"}, 30]}},
            ]
        }

    artistas = list(artistas_col.find(filter_artistas))
    logger.info("Procesando %d %s...", len(artistas), label_a)

    for i, art in enumerate(artistas, 1):
        bio = generar_biografia(art)
        if bio:
            artistas_col.update_one({"_id": art["_id"]}, {"$set": {"biografia": bio}})
            logger.info("  [%d/%d] Artista %s %s ✓", i, len(artistas), art.get("nombre", ""), art.get("apellido", ""))
        else:
            logger.warning("  [%d/%d] Artista %s %s – falló generación", i, len(artistas), art.get("nombre", ""), art.get("apellido", ""))
        time.sleep(0.5)

    # --- Obras ---
    if args.force:
        filter_obras = {}
        label_o = "obras"
    else:
        filter_obras = {
            "$or": [
                {"descripcion": ""},
                {"descripcion": None},
                {"descripcion": {"$exists": False}},
                {"$expr": {"$lt": [{"$strLenCP": "$descripcion"}, 30]}},
            ]
        }
        label_o = "obras sin descripción"

    obras = list(obras_col.find(filter_obras))
    logger.info("Procesando %d %s...", len(obras), label_o)

    for i, obr in enumerate(obras, 1):
        desc = generar_descripcion(obr)
        if desc:
            obras_col.update_one({"_id": obr["_id"]}, {"$set": {"descripcion": desc}})
            logger.info("  [%d/%d] Obra '%s' ✓", i, len(obras), obr.get("nombre", ""))
        else:
            logger.warning("  [%d/%d] Obra '%s' – falló generación", i, len(obras), obr.get("nombre", ""))
        time.sleep(0.5)

    client.close()
    logger.info("Enriquecimiento completado.")


if __name__ == "__main__":
    main()
