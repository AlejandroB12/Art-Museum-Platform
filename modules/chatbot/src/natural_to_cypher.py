"""
Traductor de lenguaje natural a Cypher para Neo4j.

Usa Gemini para convertir preguntas en español a consultas Cypher
y las ejecuta contra la base de datos Neo4j del museo.

Uso interactivo:
    python modules/chatbot/src/natural_to_cypher.py

Consulta directa:
    python modules/chatbot/src/natural_to_cypher.py "Muéstrame obras del género Escultura"
"""

import argparse
import logging
import os
import re
import sys
from pathlib import Path

import httpx
from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv(dotenv_path=Path(__file__).resolve().parents[3] / ".env")

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger("natural_to_cypher")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemma-2-9b-it:free")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

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

if not GEMINI_API_KEY and not OPENROUTER_API_KEY:
    logger.error("No hay API key — define GEMINI_API_KEY u OPENROUTER_API_KEY en el .env")
    sys.exit(1)

if not NEO4J_URI or not NEO4J_USER or not NEO4J_PASS:
    logger.error("Neo4j no está configurado en el .env")
    sys.exit(1)


def _call_openrouter(prompt: str, system: str | None = None) -> str:
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    resp = httpx.post(
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
        timeout=60,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"]


def _call_gemini(prompt: str, system: str | None = None) -> str:
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
    cypher = candidates[0]["content"]["parts"][0]["text"] if candidates else ""
    return cypher


def traducir_a_cypher(consulta: str) -> str:
    prompt = f"Traduce a Cypher: \"{consulta}\""

    if OPENROUTER_API_KEY:
        try:
            cypher = _call_openrouter(prompt, system=SYSTEM_PROMPT)
            cypher = re.sub(r"^```(?:cypher)?\s*", "", cypher)
            cypher = re.sub(r"\s*```$", "", cypher)
            return cypher.strip()
        except Exception as e:
            logger.warning("OpenRouter falló: %s", e)

    try:
        cypher = _call_gemini(prompt, system=SYSTEM_PROMPT)
        cypher = re.sub(r"^```(?:cypher)?\s*", "", cypher)
        cypher = re.sub(r"\s*```$", "", cypher)
        return cypher.strip()
    except Exception as e:
        logger.error("Todos los proveedores fallaron: %s", e)
        return "//NO_TRADUCIBLE"


def ejecutar_cypher(cypher: str) -> list:
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))
    try:
        with driver.session() as session:
            result = session.run(cypher)
            return [record.data() for record in result]
    finally:
        driver.close()


def main():
    parser = argparse.ArgumentParser(description="Traductor lenguaje natural → Cypher")
    parser.add_argument("consulta", nargs="?", help="Consulta en lenguaje natural")
    args = parser.parse_args()

    if args.consulta:
        consultas = [args.consulta]
    else:
        print("=== Traductor Lenguaje Natural → Cypher ===")
        print("Escribe una consulta o 'salir' para terminar.\n")
        consultas = []
        while True:
            try:
                c = input("❯ ").strip()
                if c.lower() in ("salir", "exit", "q"):
                    break
                if c:
                    consultas.append(c)
            except (EOFError, KeyboardInterrupt):
                break

    for consulta in consultas:
        print(f"\nConsulta: {consulta}")
        print("-" * 60)

        cypher = traducir_a_cypher(consulta)
        if cypher.startswith("//NO_TRADUCIBLE"):
            print("✗ No se pudo traducir la consulta.")
            continue

        print(f"Cypher: {cypher}\n")

        try:
            resultados = ejecutar_cypher(cypher)
            if resultados:
                print(f"Resultados ({len(resultados)}):")
                for r in resultados[:10]:
                    print(f"  {r}")
                if len(resultados) > 10:
                    print(f"  ... y {len(resultados) - 10} más")
            else:
                print("Sin resultados.")
        except Exception as e:
            print(f"Error al ejecutar: {e}")


if __name__ == "__main__":
    main()
