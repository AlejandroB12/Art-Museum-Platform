/**
 * Script de enriquecimiento del grafo Neo4j con IA local.
 * 
 * Combina BLIP (descripción) + CLIP (tags semánticos) + Metadatos.
 * Solo procesa obras NUEVAS o fuerza reprocesamiento con --force.
 * 
 * Ejecutar: node scripts/enriquecer-grafo-ia.js
 *           node scripts/enriquecer-grafo-ia.js --force  (reprocesa todas)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { pipeline } = require('@xenova/transformers');
const { getSession, connectNeo4j, closeNeo4j } = require('../config/database');
const fs = require('fs');
const path = require('path');

const Obra = require('../backend/models/obra_model');
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URI_FALLBACK;
const FORCE = process.argv.includes('--force');

// ============================================
// MODELOS DE IA
// ============================================

let blip = null;     // Para descripción de imágenes
let clip = null;     // Para tags semánticos
let embedder = null; // Para vectores de similitud

async function cargarModelos() {
    if (!blip) {
        console.log('Cargando BLIP (descripción de imágenes)...');
        blip = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning');
        console.log('✓ BLIP cargado');
    }
    if (!clip) {
        console.log('Cargando CLIP (tags semánticos)...');
        clip = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
        console.log('✓ CLIP cargado');
    }
    if (!embedder) {
        console.log('Cargando embedder (all-MiniLM-L6-v2)...');
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log('✓ Embedder cargado\n');
    }
}

// ============================================
// FUNCIONES DE IA
// ============================================

/**
 * BLIP: Describe la imagen con una frase
 */
async function describirConBLIP(rutaImagen) {
    try {
        const resultado = await blip(rutaImagen);
        return resultado[0].generated_text;
    } catch (err) {
        return null;
    }
}

/**
 * Extrae palabras clave de una frase (stopwords en inglés)
 */
function extraerPalabrasClave(frase) {
    if (!frase) return [];
    const stopwords = new Set([
        'a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'with',
        'and', 'or', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'can', 'shall', 'that',
        'this', 'these', 'those', 'it', 'its', 'very', 'just', 'some',
        'photo', 'image', 'picture', 'painting', 'sculpture', 'photograph'
    ]);

    return frase
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopwords.has(w));
}

/**
 * CLIP: Evalúa las palabras clave contra la imagen y da scores reales
 */
async function etiquetarConCLIP(rutaImagen, palabrasClave) {
    if (!palabrasClave || palabrasClave.length === 0) return [];

    // Añadir conceptos base + palabras de BLIP
    const conceptosBase = [
        "abstract", "geometric", "organic", "minimalist", "surreal",
        "realistic", "cubist", "impressionist", "baroque", "modern",
        "man", "woman", "child", "person", "face", "portrait", "hands",
        "building", "house", "tower", "bridge", "nature", "landscape",
        "red", "blue", "green", "yellow", "orange", "black", "white",
        "metal", "bronze", "gold", "ceramic", "wood", "stone", "glass",
        "circle", "square", "triangle", "sphere", "cube",
        "dark", "bright", "colorful", "peaceful", "chaotic"
    ];

    const todasLasPalabras = [...new Set([...palabrasClave, ...conceptosBase])];

    try {
        const resultado = await clip(rutaImagen, todasLasPalabras);
        return resultado
            .filter(c => c.score > 0.03)
            .sort((a, b) => b.score - a.score)
            .slice(0, 15)
            .map(c => ({ tag: c.label, score: Math.round(c.score * 100) / 100 }));
    } catch (err) {
        return [];
    }
}

/**
 * Genera embedding de un texto combinado
 */
async function generarEmbedding(texto) {
    try {
        const resultado = await embedder(texto, { pooling: 'mean', normalize: true });
        return Array.from(resultado.data);
    } catch (err) {
        return null;
    }
}

// ============================================
// CLASIFICADOR CON PERCENTILES REALES
// ============================================

function calcularRangoPrecio(precio, todosLosPrecios) {
    if (!todosLosPrecios || todosLosPrecios.length === 0) return 'medio';
    const ordenados = [...todosLosPrecios].sort((a, b) => a - b);
    const n = ordenados.length;
    const p20 = ordenados[Math.floor(n * 0.2)];
    const p50 = ordenados[Math.floor(n * 0.5)];
    const p80 = ordenados[Math.floor(n * 0.8)];
    if (precio < p20) return 'económico';
    if (precio < p50) return 'accesible';
    if (precio < p80) return 'medio-alto';
    return 'premium';
}

function extraerEtiquetas(obra, descripcionBLIP, tagsClip, todosLosPrecios) {
    const etiquetas = { estilos: [], paletas: [], tecnicas: [], epocas: [], rangoPrecio: '' };

    // ÉPOCA desde fecha_creacion
    if (obra.fecha_creacion) {
        const año = new Date(obra.fecha_creacion).getFullYear();
        if (año < 1800) etiquetas.epocas.push('clásico');
        else if (año < 1900) etiquetas.epocas.push('siglo XIX');
        else if (año < 1950) etiquetas.epocas.push('moderno temprano');
        else if (año < 2000) etiquetas.epocas.push('contemporáneo');
        else etiquetas.epocas.push('siglo XXI');
    } else {
        etiquetas.epocas.push('contemporáneo');
    }

    // TÉCNICA desde detalles reales + CLIP
    const detalles = obra.genero?.detalles || {};
    if (detalles.tecnica_principal) etiquetas.tecnicas.push(detalles.tecnica_principal);
    if (detalles.material_predominante) etiquetas.tecnicas.push(detalles.material_predominante);
    if (detalles.formato_origen) etiquetas.tecnicas.push(detalles.formato_origen);
    if (detalles.metal_base_dominante) etiquetas.tecnicas.push(detalles.metal_base_dominante);
    if (etiquetas.tecnicas.length === 0 && tagsClip) {
        const tagsTecnica = tagsClip.filter(t => ['bronze', 'metal', 'gold', 'ceramic', 'wood', 'stone', 'glass'].includes(t.tag));
        tagsTecnica.forEach(t => etiquetas.tecnicas.push(t.tag));
    }
    if (etiquetas.tecnicas.length === 0) etiquetas.tecnicas.push('técnica mixta');

    // ESTILO desde género + CLIP
    if (obra.genero?.nombre) etiquetas.estilos.push(obra.genero.nombre);
    if (tagsClip) {
        const tagsEstilo = tagsClip.filter(t =>
            ['abstract', 'geometric', 'organic', 'minimalist', 'surreal', 'realistic', 'cubist', 'impressionist'].includes(t.tag)
        );
        tagsEstilo.forEach(t => { if (!etiquetas.estilos.includes(t.tag)) etiquetas.estilos.push(t.tag); });
    }

    // PALETA desde descripción BLIP + CLIP
    const texto = (descripcionBLIP || '').toLowerCase();
    const colores = {
        'black': 'oscura', 'dark': 'oscura', 'white': 'clara', 'bright': 'brillante',
        'red': 'cálida', 'yellow': 'cálida', 'orange': 'cálida', 'blue': 'fría', 'green': 'natural',
        'purple': 'vibrante', 'colorful': 'multicolor', 'monochrome': 'monocromática',
        'gold': 'dorada', 'silver': 'plateada', 'brown': 'terrosa', 'grey': 'neutra', 'gray': 'neutra'
    };
    for (const [key, value] of Object.entries(colores)) {
        if (texto.includes(key) && !etiquetas.paletas.includes(value)) etiquetas.paletas.push(value);
    }
    if (tagsClip) {
        const tagsColor = tagsClip.filter(t => ['red', 'blue', 'green', 'yellow', 'orange', 'black', 'white', 'dark', 'bright', 'colorful'].includes(t.tag));
        tagsColor.forEach(t => {
            const mapped = colores[t.tag] || t.tag;
            if (!etiquetas.paletas.includes(mapped)) etiquetas.paletas.push(mapped);
        });
    }
    if (etiquetas.paletas.length === 0) etiquetas.paletas.push('variada');

    // RANGO DE PRECIO por percentil real
    etiquetas.rangoPrecio = calcularRangoPrecio(obra.precio || 0, todosLosPrecios);

    return etiquetas;
}

// ============================================
// FUNCIONES DE NEO4J
// ============================================

function toNum(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'object' && val.toNumber) return val.toNumber();
    return Number(val);
}

async function crearNodoUnico(session, label, propiedad, valor) {
    await session.run(`MERGE (n:${label} {${propiedad}: $valor})`, { valor });
}

async function crearRelacion(session, idObra, labelNodo, propiedadNodo, valorNodo, tipoRelacion) {
    await session.run(
        `MATCH (o:Obra {id_obra: $idObra})
         MERGE (n:${labelNodo} {${propiedadNodo}: $valorNodo})
         MERGE (o)-[:${tipoRelacion}]->(n)`,
        { idObra, valorNodo }
    );
}

function cosineSimilarity(a, b) {
    if (!a || !b || a.length === 0 || b.length === 0) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function enriquecerGrafo() {
    console.log('=== ENRIQUECIENDO GRAFO NEO4J CON BLIP + CLIP + METADATOS ===\n');

    // 1. Conexiones
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✓ MongoDB conectado\n');

    console.log('Conectando a Neo4j...');
    await connectNeo4j();
    const session = getSession();
    console.log('✓ Neo4j conectado\n');

    // 2. Cargar modelos
    await cargarModelos();

    // 3. Constraints
    console.log('Creando constraints...');
    for (const cypher of [
        'CREATE CONSTRAINT IF NOT EXISTS FOR (e:Estilo) REQUIRE e.nombre IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (p:Paleta) REQUIRE p.nombre IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (t:Tecnica) REQUIRE t.nombre IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (ep:Epoca) REQUIRE ep.nombre IS UNIQUE'
    ]) {
        try { await session.run(cypher); } catch (e) { }
    }
    console.log('✓ Constraints creados\n');

    // 4. Obtener obras de MongoDB
    console.log('Obteniendo obras de MongoDB...');
    const obras = await Obra.find().lean();
    const todosLosPrecios = obras.map(o => o.precio || 0).filter(p => p > 0).sort((a, b) => a - b);
    console.log(`  ${obras.length} obras en MongoDB\n`);

    // 5. Verificar obras ya procesadas
    let obrasPendientes;
    if (FORCE) {
        obrasPendientes = obras;
        console.log('⚠️  Modo FORCE: reprocesando TODAS las obras\n');
    } else {
        const procesadas = await session.run(
            `MATCH (o:Obra) WHERE o.embedding IS NOT NULL RETURN o.id_obra AS idObra`
        );
        const idsProcesadas = new Set(procesadas.records.map(r => toNum(r.get('idObra'))));
        obrasPendientes = obras.filter(o => !idsProcesadas.has(o._id));
        console.log(`  ${idsProcesadas.size} ya procesadas, ${obrasPendientes.length} pendientes\n`);
    }

    if (obrasPendientes.length === 0) {
        console.log('✅ Todas las obras ya tienen embedding.');
    } else {
        let ok = 0, errores = 0;
        for (const obra of obrasPendientes) {
            try {
                ok++;
                console.log(`Obra ${ok}/${obrasPendientes.length}: "${obra.nombre}"`);

                // Buscar imagen
                let rutaImagen = null;
                if (obra.fotografia) {
                    const imgPath = path.join(__dirname, '..', 'assets', 'images', 'Abstract_gallery', path.basename(obra.fotografia));
                    if (fs.existsSync(imgPath)) rutaImagen = imgPath;
                }

                let descripcionBLIP = null;
                let tagsClip = [];
                let descripcionCLIP = null;

                if (rutaImagen) {
                    // BLIP: describir imagen
                    descripcionBLIP = await describirConBLIP(rutaImagen);
                    if (descripcionBLIP) console.log(`  BLIP: "${descripcionBLIP}"`);

                    // Extraer palabras clave de BLIP
                    const palabrasClave = extraerPalabrasClave(descripcionBLIP);

                    // CLIP: validar palabras clave contra la imagen
                    tagsClip = await etiquetarConCLIP(rutaImagen, palabrasClave);
                    if (tagsClip.length > 0) {
                        console.log(`  CLIP: ${tagsClip.slice(0, 5).map(t => t.tag + ':' + t.score).join(', ')}`);
                        descripcionCLIP = tagsClip.slice(0, 5).map(t => t.tag).join(' ');
                    }
                }

                // Metadatos base
                const descripcionBase = [
                    obra.nombre,
                    obra.genero?.nombre || '',
                    obra.genero?.detalles?.tecnica_principal || '',
                    obra.genero?.detalles?.material_predominante || ''
                ].filter(Boolean).join('. ');

                // Etiquetas con metadatos reales
                const etiquetas = extraerEtiquetas(obra, descripcionBLIP, tagsClip, todosLosPrecios);

                // Descripción combinada para embedding
                const descripcionFinal = [
                    descripcionBase,
                    descripcionBLIP,
                    descripcionCLIP,
                    etiquetas.epocas[0],
                    etiquetas.rangoPrecio
                ].filter(Boolean).join('. ');

                // Generar embedding
                const embedding = await generarEmbedding(descripcionFinal);

                // Guardar en Neo4j
                await session.run(
                    `MATCH (o:Obra {id_obra: $id})
                     SET o.descripcionIA = $descBLIP,
                         o.descripcionCLIP = $descCLIP,
                         o.tagsClip = $tagsClip,
                         o.embedding = $emb,
                         o.tagsIA = $tagsIA,
                         o.epocaReal = $epoca,
                         o.tecnicasReales = $tec,
                         o.rangoPrecio = $rango,
                         o.fotografia = $foto`,
                    {
                        id: obra._id,
                        descBLIP: descripcionBLIP || descripcionBase,
                        descCLIP: descripcionCLIP || '',
                        tagsClip: JSON.stringify(tagsClip),
                        emb: embedding || [],
                        tagsIA: [...etiquetas.estilos, ...etiquetas.paletas, ...etiquetas.tecnicas],
                        epoca: etiquetas.epocas[0],
                        tec: etiquetas.tecnicas,
                        rango: etiquetas.rangoPrecio,
                        foto: obra.fotografia || ''
                    }
                );

                // Crear nodos y relaciones de etiquetas
                for (const estilo of [...new Set(etiquetas.estilos)]) {
                    await crearNodoUnico(session, 'Estilo', 'nombre', estilo);
                    await crearRelacion(session, obra._id, 'Estilo', 'nombre', estilo, 'TIENE_ESTILO');
                }
                for (const paleta of [...new Set(etiquetas.paletas)]) {
                    await crearNodoUnico(session, 'Paleta', 'nombre', paleta);
                    await crearRelacion(session, obra._id, 'Paleta', 'nombre', paleta, 'USA_PALETA');
                }
                for (const tecnica of [...new Set(etiquetas.tecnicas)]) {
                    await crearNodoUnico(session, 'Tecnica', 'nombre', tecnica);
                    await crearRelacion(session, obra._id, 'Tecnica', 'nombre', tecnica, 'USA_TECNICA');
                }
                for (const epoca of [...new Set(etiquetas.epocas)]) {
                    await crearNodoUnico(session, 'Epoca', 'nombre', epoca);
                    await crearRelacion(session, obra._id, 'Epoca', 'nombre', epoca, 'PERTENECE_A_EPOCA');
                }

                console.log(`  ✓ Listo (${etiquetas.epocas[0]}, ${etiquetas.rangoPrecio})\n`);

            } catch (err) {
                console.error(`  ✗ Error: ${err.message}\n`);
                errores++;
            }
        }
        console.log(`✅ ${ok} procesadas, ${errores} errores\n`);
    }

    // 6. Crear relaciones SIMILAR_A
    console.log('Creando relaciones de similitud...');
    const result = await session.run(
        `MATCH (o:Obra) WHERE o.embedding IS NOT NULL
         RETURN o.id_obra AS idObra, o.embedding AS embedding`
    );

    const obrasEmb = result.records.map(r => ({
        id: toNum(r.get('idObra')),
        embedding: r.get('embedding')
    }));
    console.log(`  ${obrasEmb.length} obras con embedding`);

    await session.run('MATCH ()-[r:SIMILAR_A]->() DELETE r');

    let similares = 0;
    for (const obra of obrasEmb) {
        const tops = obrasEmb
            .filter(o => o.id !== obra.id)
            .map(o => ({ id: o.id, score: cosineSimilarity(obra.embedding, o.embedding) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        for (const s of tops) {
            if (s.score > 0.7) {
                await session.run(
                    `MATCH (o1:Obra {id_obra: $id1}) MATCH (o2:Obra {id_obra: $id2})
                     MERGE (o1)-[:SIMILAR_A {score: $score}]->(o2)`,
                    { id1: obra.id, id2: s.id, score: Math.round(s.score * 100) / 100 }
                );
                similares++;
            }
        }
    }
    console.log(`  ${similares} relaciones SIMILAR_A creadas\n`);

    // 7. Estadísticas
    console.log('=== ESTADÍSTICAS FINALES ===');
    const stats = await session.run(`MATCH (n) RETURN labels(n) AS tipo, count(n) AS cantidad ORDER BY tipo`);
    for (const r of stats.records) console.log(`  ${r.get('tipo')[0]}: ${toNum(r.get('cantidad'))} nodos`);
    const rels = await session.run(`MATCH ()-[r]->() RETURN type(r) AS tipo, count(r) AS cantidad ORDER BY tipo`);
    for (const r of rels.records) console.log(`  ${r.get('tipo')}: ${toNum(r.get('cantidad'))} relaciones`);

    console.log('\n=== GRAFO ENRIQUECIDO EXITOSAMENTE ===');

    await session.close();
    await closeNeo4j();
    await mongoose.disconnect();
}

enriquecerGrafo().then(() => process.exit(0)).catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
});