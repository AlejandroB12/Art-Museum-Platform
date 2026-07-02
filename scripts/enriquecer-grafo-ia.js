/**
 * Script de enriquecimiento del grafo Neo4j con IA local.
 * 
 * BLIP: descripción corta + detallada
 * CLIP: tags visuales + conceptos abstractos (enriquecidos por BLIP)
 * Embeddings: modelo multilingüe (español, inglés, 50+ idiomas)
 * 
 * Ejecutar: node scripts/enriquecer-grafo-ia.js
 *           node scripts/enriquecer-grafo-ia.js --force
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { pipeline } = require('@xenova/transformers');
const { getSession, connectNeo4j, closeNeo4j } = require('../config/neo4j');
const fs = require('fs');
const path = require('path');

const Obra = require('../models/Obra');
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URI_FALLBACK;
const FORCE = process.argv.includes('--force');

// ============================================
// MODELOS DE IA
// ============================================

let blip = null;
let clip = null;
let embedder = null;

async function cargarModelos() {
    if (!blip) {
        console.log('Cargando BLIP...');
        blip = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning');
        console.log('✓ BLIP cargado');
    }
    if (!clip) {
        console.log('Cargando CLIP...');
        clip = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
        console.log('✓ CLIP cargado');
    }
    if (!embedder) {
        console.log('Cargando embedder multilingüe...');
        embedder = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2');
        console.log('✓ Embedder multilingüe cargado\n');
    }
}

// ============================================
// FUNCIONES DE IA
// ============================================

async function describirConBLIP(rutaImagen, maxTokens = 30) {
    try {
        const resultado = await blip(rutaImagen, { max_new_tokens: maxTokens });
        return resultado[0].generated_text;
    } catch (err) {
        return null;
    }
}

function extraerPalabrasClave(frase, maxPalabras = 15) {
    if (!frase) return [];

    // Limpiar solo puntuación, mantener todas las palabras
    const palabras = frase
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 1); // Solo filtrar palabras de 1 letra

    // Tomar las primeras N palabras (BLIP pone lo importante al inicio)
    return palabras.slice(0, maxPalabras);
}

async function etiquetarConCLIP(rutaImagen, palabrasClave) {
    const conceptosBase = [
        "abstract", "geometric", "organic", "minimalist", "surreal",
        "realistic", "cubist", "impressionist", "baroque", "modern",
        "man", "woman", "child", "person", "face", "portrait", "hands",
        "building", "house", "tower", "bridge", "nature", "landscape",
        "red", "blue", "green", "yellow", "orange", "black", "white",
        "metal", "bronze", "gold", "ceramic", "wood", "stone", "glass",
        "circle", "square", "triangle", "sphere", "cube",
        "dark", "bright", "colorful", "peaceful", "chaotic",
        "sky", "water", "tree", "flower", "mountain", "river"
    ];

    const todasLasPalabras = [...new Set([...(palabrasClave || []), ...conceptosBase])];

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

async function conceptosAbstractos(rutaImagen) {
    const conceptos = [
        "minimalist art", "geometric abstraction", "contemporary art",
        "color field painting", "abstract expressionism",
        "inspired by nature", "urban landscape", "pop art",
        "emotional", "political", "spiritual", "meditative",
        "industrial", "futuristic", "ancient", "primitive",
        "elegant", "brutal", "delicate", "monumental"
    ];
    try {
        const resultado = await clip(rutaImagen, conceptos);
        return resultado
            .filter(c => c.score > 0.05)
            .slice(0, 5)
            .map(c => ({ tag: c.label, score: Math.round(c.score * 100) / 100 }));
    } catch (err) {
        return [];
    }
}

async function generarEmbedding(texto) {
    try {
        const resultado = await embedder(texto, { pooling: 'mean', normalize: true });
        return Array.from(resultado.data);
    } catch (err) {
        return null;
    }
}

// ============================================
// CLASIFICADOR
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

    const detalles = obra.genero?.detalles || {};
    if (detalles.tecnica_principal) etiquetas.tecnicas.push(detalles.tecnica_principal);
    if (detalles.material_predominante) etiquetas.tecnicas.push(detalles.material_predominante);
    if (detalles.formato_origen) etiquetas.tecnicas.push(detalles.formato_origen);
    if (detalles.metal_base_dominante) etiquetas.tecnicas.push(detalles.metal_base_dominante);
    if (etiquetas.tecnicas.length === 0 && tagsClip) {
        tagsClip.filter(t => ['bronze', 'metal', 'gold', 'ceramic', 'wood', 'stone', 'glass'].includes(t.tag))
            .forEach(t => etiquetas.tecnicas.push(t.tag));
    }
    if (etiquetas.tecnicas.length === 0) etiquetas.tecnicas.push('técnica mixta');

    if (obra.genero?.nombre) etiquetas.estilos.push(obra.genero.nombre);
    if (tagsClip) {
        tagsClip.filter(t => ['abstract', 'geometric', 'organic', 'minimalist', 'surreal', 'realistic', 'cubist', 'impressionist'].includes(t.tag))
            .forEach(t => { if (!etiquetas.estilos.includes(t.tag)) etiquetas.estilos.push(t.tag); });
    }

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
        tagsClip.filter(t => ['red', 'blue', 'green', 'yellow', 'orange', 'black', 'white', 'dark', 'bright', 'colorful'].includes(t.tag))
            .forEach(t => {
                const mapped = colores[t.tag] || t.tag;
                if (!etiquetas.paletas.includes(mapped)) etiquetas.paletas.push(mapped);
            });
    }
    if (etiquetas.paletas.length === 0) etiquetas.paletas.push('variada');

    etiquetas.rangoPrecio = calcularRangoPrecio(obra.precio || 0, todosLosPrecios);
    return etiquetas;
}

// ============================================
// FUNCIONES NEO4J
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
// PRINCIPAL
// ============================================

async function enriquecerGrafo() {
    console.log('=== ENRIQUECIENDO GRAFO CON BLIP + CLIP + EMBEDDINGS MULTILINGÜES ===\n');

    await mongoose.connect(MONGO_URI);
    console.log('✓ MongoDB conectado\n');

    await connectNeo4j();
    const session = getSession();
    console.log('✓ Neo4j conectado\n');

    await cargarModelos();

    for (const cypher of [
        'CREATE CONSTRAINT IF NOT EXISTS FOR (e:Estilo) REQUIRE e.nombre IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (p:Paleta) REQUIRE p.nombre IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (t:Tecnica) REQUIRE t.nombre IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (ep:Epoca) REQUIRE ep.nombre IS UNIQUE'
    ]) {
        try { await session.run(cypher); } catch (e) { }
    }
    console.log('✓ Constraints creados\n');

    const obras = await Obra.find().lean();
    const todosLosPrecios = obras.map(o => o.precio || 0).filter(p => p > 0).sort((a, b) => a - b);
    console.log(`${obras.length} obras en MongoDB\n`);

    let obrasPendientes;
    if (FORCE) {
        obrasPendientes = obras;
        console.log('⚠️  Modo FORCE\n');
    } else {
        const procesadas = await session.run(`MATCH (o:Obra) WHERE o.embedding IS NOT NULL RETURN o.id_obra AS idObra`);
        const idsProcesadas = new Set(procesadas.records.map(r => toNum(r.get('idObra'))));
        obrasPendientes = obras.filter(o => !idsProcesadas.has(o._id));
        console.log(`${idsProcesadas.size} ya procesadas, ${obrasPendientes.length} pendientes\n`);
    }

    if (obrasPendientes.length === 0) {
        console.log('✅ Todas las obras ya tienen embedding.');
    } else {
        let ok = 0, errores = 0;
        for (const obra of obrasPendientes) {
            try {
                ok++;
                console.log(`Obra ${ok}/${obrasPendientes.length}: "${obra.nombre}"`);

                let rutaImagen = null;
                if (obra.fotografia) {
                    const imgPath = path.join(__dirname, '..', 'assets', 'images', 'Abstract_gallery', path.basename(obra.fotografia));
                    if (fs.existsSync(imgPath)) rutaImagen = imgPath;
                }

                let descCorta = null, descDetallada = null, tagsClip = [], tagsAbstractos = [];

                if (rutaImagen) {
                    // BLIP corto
                    descCorta = await describirConBLIP(rutaImagen, 30);
                    // BLIP detallado
                    descDetallada = await describirConBLIP(rutaImagen, 80);

                    // BLIP corto → pocas palabras clave
                    const palabrasCortas = extraerPalabrasClave(descCorta, 8);

                    // BLIP detallado → más palabras clave
                    const palabrasDetalladas = extraerPalabrasClave(descDetallada, 20);

                    // Unir y deduplicar
                    const palabrasClave = [...new Set([...palabrasCortas, ...palabrasDetalladas])];

                    // CLIP: tags visuales
                    tagsClip = await etiquetarConCLIP(rutaImagen, palabrasClave);

                    // CLIP: conceptos abstractos
                    tagsAbstractos = await conceptosAbstractos(rutaImagen);

                    if (descCorta) console.log(`  BLIP: "${descCorta}"`);
                    if (tagsClip.length > 0) console.log(`  CLIP: ${tagsClip.slice(0, 5).map(t => t.tag).join(', ')}`);
                    if (tagsAbstractos.length > 0) console.log(`  Abstracto: ${tagsAbstractos.map(t => t.tag).join(', ')}`);
                }

                const descripcionBase = [
                    obra.nombre, obra.genero?.nombre || '',
                    obra.genero?.detalles?.tecnica_principal || '',
                    obra.genero?.detalles?.material_predominante || ''
                ].filter(Boolean).join('. ');

                const etiquetas = extraerEtiquetas(obra, descDetallada || descCorta, tagsClip, todosLosPrecios);

                // Embedding combinando todo
                const textoEmbedding = [
                    descripcionBase,
                    descCorta,
                    descDetallada,
                    ...tagsClip.map(t => t.tag),
                    ...tagsAbstractos.map(t => t.tag),
                    etiquetas.epocas[0],
                    etiquetas.rangoPrecio
                ].filter(Boolean).join('. ');

                const embedding = await generarEmbedding(textoEmbedding);

                await session.run(
                    `MATCH (o:Obra {id_obra: $id})
                     SET o.descripcionCorta = $corta,
                         o.descripcionDetallada = $detallada,
                         o.tagsClip = $tagsClip,
                         o.tagsAbstractos = $tagsAbs,
                         o.embedding = $emb,
                         o.tagsIA = $tagsIA,
                         o.epocaReal = $epoca,
                         o.tecnicasReales = $tec,
                         o.rangoPrecio = $rango,
                         o.fotografia = $foto`,
                    {
                        id: obra._id,
                        corta: descCorta || descripcionBase,
                        detallada: descDetallada || '',
                        tagsClip: JSON.stringify(tagsClip),
                        tagsAbs: JSON.stringify(tagsAbstractos),
                        emb: embedding || [],
                        tagsIA: [...etiquetas.estilos, ...etiquetas.paletas, ...etiquetas.tecnicas],
                        epoca: etiquetas.epocas[0],
                        tec: etiquetas.tecnicas,
                        rango: etiquetas.rangoPrecio,
                        foto: obra.fotografia || ''
                    }
                );

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

                console.log(`  ✓ Listo\n`);

            } catch (err) {
                console.error(`  ✗ Error: ${err.message}\n`);
                errores++;
            }
        }
        console.log(`✅ ${ok} procesadas, ${errores} errores\n`);
    }

    // SIMILAR_A
    console.log('Creando relaciones de similitud...');
    const result = await session.run(`MATCH (o:Obra) WHERE o.embedding IS NOT NULL RETURN o.id_obra AS idObra, o.embedding AS embedding`);
    const obrasEmb = result.records.map(r => ({ id: toNum(r.get('idObra')), embedding: r.get('embedding') }));
    console.log(`  ${obrasEmb.length} obras con embedding`);

    await session.run('MATCH ()-[r:SIMILAR_A]->() DELETE r');

    let similares = 0;
    for (const obra of obrasEmb) {
        const tops = obrasEmb.filter(o => o.id !== obra.id)
            .map(o => ({ id: o.id, score: cosineSimilarity(obra.embedding, o.embedding) }))
            .sort((a, b) => b.score - a.score).slice(0, 5);
        for (const s of tops) {
            if (s.score > 0.7) {
                await session.run(
                    `MATCH (o1:Obra {id_obra: $id1}) MATCH (o2:Obra {id_obra: $id2}) MERGE (o1)-[:SIMILAR_A {score: $score}]->(o2)`,
                    { id1: obra.id, id2: s.id, score: Math.round(s.score * 100) / 100 }
                );
                similares++;
            }
        }
    }
    console.log(`  ${similares} relaciones SIMILAR_A creadas\n`);

    console.log('=== ESTADÍSTICAS ===');
    const stats = await session.run(`MATCH (n) RETURN labels(n) AS tipo, count(n) AS cantidad ORDER BY tipo`);
    for (const r of stats.records) console.log(`  ${r.get('tipo')[0]}: ${toNum(r.get('cantidad'))} nodos`);
    const rels = await session.run(`MATCH ()-[r]->() RETURN type(r) AS tipo, count(r) AS cantidad ORDER BY tipo`);
    for (const r of rels.records) console.log(`  ${r.get('tipo')}: ${toNum(r.get('cantidad'))} relaciones`);

    console.log('\n=== GRAFO ENRIQUECIDO EXITOSAMENTE ===');
    await session.close();
    await closeNeo4j();
    await mongoose.disconnect();
}

enriquecerGrafo().then(() => process.exit(0)).catch(err => { console.error('Error fatal:', err); process.exit(1); });