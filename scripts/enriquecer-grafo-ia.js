/**
 * Script de enriquecimiento del grafo Neo4j con IA local.
 * 
 * Analiza las imágenes de las obras y genera:
 * - Descripciones textuales (BLIP)
 * - Vectores de embedding (all-MiniLM-L6-v2)
 * - Nuevos nodos: Estilo, Paleta, Tecnica, Epoca
 * - Nuevas relaciones: TIENE_ESTILO, USA_PALETA, USA_TECNICA, PERTENECE_A_EPOCA, SIMILAR_A
 * - Metadatos reales: epocaReal, tecnicasReales, rangoPrecio
 * 
 * Solo procesa obras NUEVAS (sin embedding en Neo4j).
 * Ejecutar: node scripts/enriquecer-grafo-ia.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { pipeline } = require('@xenova/transformers');
const { getSession, connectNeo4j, closeNeo4j } = require('../config/neo4j');
const fs = require('fs');
const path = require('path');

const Obra = require('../models/Obra');
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URI_FALLBACK;

// Función auxiliar para manejar números de Neo4j
function toNum(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'object' && val.toNumber) return val.toNumber();
    return Number(val);
}

// ============================================
// FUNCIONES DE IA
// ============================================

let captioner = null;
let embedder = null;

async function cargarModelos() {
    if (!captioner) {
        console.log('Cargando modelo BLIP (descripción de imágenes)...');
        captioner = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning');
        console.log('✓ BLIP cargado');
    }
    if (!embedder) {
        console.log('Cargando modelo all-MiniLM-L6-v2 (embeddings)...');
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log('✓ Embedder cargado\n');
    }
}

async function describirImagen(rutaImagen) {
    try {
        const buffer = fs.readFileSync(rutaImagen);
        const resultado = await captioner(buffer);
        return resultado[0].generated_text;
    } catch (err) {
        return null;
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
// CLASIFICADOR (usa metadatos reales + IA)
// ============================================

function extraerEtiquetas(obra, descripcionIA, todosLosPrecios) {
    const etiquetas = {
        estilos: [],
        paletas: [],
        tecnicas: [],
        epocas: [],
        rangoPrecio: ''
    };

    // 1. ÉPOCA: desde fecha_creacion (dato REAL de MongoDB)
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

    // 2. TÉCNICA: desde detalles del género (dato REAL de MongoDB)
    if (obra.genero?.detalles?.tecnica_principal) {
        etiquetas.tecnicas.push(obra.genero.detalles.tecnica_principal);
    }
    if (obra.genero?.detalles?.material_predominante) {
        etiquetas.tecnicas.push(obra.genero.detalles.material_predominante);
    }
    if (obra.genero?.detalles?.formato_origen) {
        etiquetas.tecnicas.push(obra.genero.detalles.formato_origen);
    }
    if (obra.genero?.detalles?.metal_base_dominante) {
        etiquetas.tecnicas.push(obra.genero.detalles.metal_base_dominante);
    }
    if (obra.genero?.detalles?.tipo_arcilla_base) {
        etiquetas.tecnicas.push(obra.genero.detalles.tipo_arcilla_base);
    }
    if (etiquetas.tecnicas.length === 0 && descripcionIA) {
        // Fallback: inferir de la descripción IA
        const texto = descripcionIA.toLowerCase();
        if (texto.includes('oil painting')) etiquetas.tecnicas.push('óleo');
        else if (texto.includes('sculpture')) etiquetas.tecnicas.push('escultura');
        else if (texto.includes('photograph')) etiquetas.tecnicas.push('fotografía');
        else if (texto.includes('ceramic')) etiquetas.tecnicas.push('cerámica');
        else etiquetas.tecnicas.push('técnica mixta');
    }

    // 3. ESTILO: desde el género (dato REAL) + inferencia IA
    if (obra.genero?.nombre) {
        etiquetas.estilos.push(obra.genero.nombre);
    }
    if (descripcionIA) {
        const texto = descripcionIA.toLowerCase();
        const estilosIA = {
            'abstract': 'abstracto', 'cubist': 'cubista', 'surreal': 'surrealista',
            'impressionist': 'impresionista', 'minimalist': 'minimalista',
            'realistic': 'realista', 'expressionist': 'expresionista',
            'pop art': 'pop art', 'modern': 'moderno', 'contemporary': 'contemporáneo'
        };
        for (const [key, value] of Object.entries(estilosIA)) {
            if (texto.includes(key) && !etiquetas.estilos.includes(value)) {
                etiquetas.estilos.push(value);
            }
        }
    }

    // 4. PALETA: desde descripción IA
    if (descripcionIA) {
        const texto = descripcionIA.toLowerCase();
        const colores = {
            'black': 'oscura', 'dark': 'oscura', 'white': 'clara', 'bright': 'brillante',
            'red': 'cálida', 'yellow': 'cálida', 'orange': 'cálida',
            'blue': 'fría', 'green': 'natural', 'purple': 'vibrante',
            'colorful': 'multicolor', 'monochrome': 'monocromática',
            'gold': 'dorada', 'silver': 'plateada', 'brown': 'terrosa',
            'grey': 'neutra', 'gray': 'neutra', 'pink': 'pastel'
        };
        for (const [key, value] of Object.entries(colores)) {
            if (texto.includes(key) && !etiquetas.paletas.includes(value)) {
                etiquetas.paletas.push(value);
            }
        }
    }
    if (etiquetas.paletas.length === 0) etiquetas.paletas.push('variada');

    // 5. RANGO DE PRECIO - Percentil real dentro de la colección
    etiquetas.rangoPrecio = calcularRangoPrecio(obra.precio || 0, todosLosPrecios);

    return etiquetas;
}

// 5. RANGO DE PRECIO - Basado en percentiles de la colección real
// Esta función usa los precios de TODAS las obras para calcular rangos relativos
function calcularRangoPrecio(precio, todosLosPrecios) {
    if (!todosLosPrecios || todosLosPrecios.length === 0) return 'medio';

    // Ordenar precios para calcular percentiles
    const ordenados = [...todosLosPrecios].sort((a, b) => a - b);
    const n = ordenados.length;

    // Encontrar posición percentil de este precio
    let posicion = 0;
    for (let i = 0; i < n; i++) {
        if (precio <= ordenados[i]) {
            posicion = i;
            break;
        }
    }
    if (precio > ordenados[n - 1]) posicion = n - 1;

    const percentil = (posicion / n) * 100;

    if (percentil < 20) return 'económico';      // 20% más barato
    if (percentil < 50) return 'accesible';       // 20-50%
    if (percentil < 80) return 'medio-alto';      // 50-80%
    return 'premium';                              // 20% más caro
}

// ============================================
// FUNCIONES DE NEO4J
// ============================================

async function crearNodoUnico(session, label, propiedad, valor) {
    await session.run(
        `MERGE (n:${label} {${propiedad}: $valor})`,
        { valor }
    );
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
    console.log('=== ENRIQUECIENDO GRAFO NEO4J CON IA LOCAL ===\n');

    // 1. Conectar a MongoDB
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✓ MongoDB conectado\n');

    // 2. Conectar a Neo4j
    console.log('Conectando a Neo4j...');
    await connectNeo4j();
    const session = getSession();
    console.log('✓ Neo4j conectado\n');

    // 3. Cargar modelos de IA
    await cargarModelos();

    // 4. Crear constraints
    console.log('Creando constraints para nuevos tipos de nodos...');
    const newConstraints = [
        'CREATE CONSTRAINT IF NOT EXISTS FOR (e:Estilo) REQUIRE e.nombre IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (p:Paleta) REQUIRE p.nombre IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (t:Tecnica) REQUIRE t.nombre IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (ep:Epoca) REQUIRE ep.nombre IS UNIQUE'
    ];
    for (const cypher of newConstraints) {
        try { await session.run(cypher); } catch (e) { /* ignorar */ }
    }
    console.log('✓ Constraints creados\n');

    // 5. Obtener obras de MongoDB
    console.log('Obteniendo obras de MongoDB...');
    const obras = await Obra.find().lean();
    // Extraer todos los precios para calcular percentiles
    const todosLosPrecios = obras.map(o => o.precio || 0).filter(p => p > 0);
    console.log(`  Precios: min=$${Math.min(...todosLosPrecios)}, max=$${Math.max(...todosLosPrecios)}, mediana=$${todosLosPrecios.sort((a, b) => a - b)[Math.floor(todosLosPrecios.length / 2)]}\n`);
    console.log(`  ${obras.length} obras en MongoDB`);

    // 6. Verificar obras ya procesadas en Neo4j
    console.log('Verificando obras ya procesadas...');
    const procesadas = await session.run(
        `MATCH (o:Obra) WHERE o.embedding IS NOT NULL 
         RETURN o.id_obra AS idObra`
    );
    const idsProcesadas = new Set(procesadas.records.map(r => toNum(r.get('idObra'))));
    const obrasPendientes = obras.filter(o => !idsProcesadas.has(o._id));
    console.log(`  ${idsProcesadas.size} ya procesadas`);
    console.log(`  ${obrasPendientes.length} pendientes\n`);

    if (obrasPendientes.length === 0) {
        console.log('✅ Todas las obras ya tienen embedding. Nada que procesar.');
        await session.close();
        await closeNeo4j();
        await mongoose.disconnect();
        return;
    }

    // 7. Procesar obras pendientes
    let procesadasCount = 0;
    let errores = 0;

    for (const obra of obrasPendientes) {
        try {
            console.log(`Obra ${++procesadasCount}/${obrasPendientes.length}: "${obra.nombre}"`);

            // Descripción base desde metadatos
            const descripcionBase = [
                obra.nombre,
                obra.genero?.nombre || '',
                obra.genero?.detalles?.tecnica_principal || '',
                obra.genero?.detalles?.material_predominante || '',
                obra.genero?.detalles?.clasificacion_espacio || ''
            ].filter(Boolean).join('. ');

            // Describir imagen con IA
            let descripcionIA = null;
            if (obra.fotografia) {
                const rutaImagen = path.join(__dirname, '..', 'assets', 'images', 'art_previews', path.basename(obra.fotografia));
                if (fs.existsSync(rutaImagen)) {
                    descripcionIA = await describirImagen(rutaImagen);
                    if (descripcionIA) console.log(`  IA: "${descripcionIA}"`);
                }
            }

            const descripcionFinal = [descripcionBase, descripcionIA].filter(Boolean).join('. ');

            // Generar embedding
            const embedding = await generarEmbedding(descripcionFinal);

            // Extraer etiquetas mejoradas
            const etiquetas = extraerEtiquetas(obra, descripcionIA, todosLosPrecios);
            console.log(`  Época: ${etiquetas.epocas[0]} | Precio: ${etiquetas.rangoPrecio}`);

            // Guardar en Neo4j
            await session.run(
                `MATCH (o:Obra {id_obra: $idObra})
                 SET o.descripcionIA = $descripcionIA,
                     o.embedding = $embedding,
                     o.tagsIA = $tagsIA,
                     o.epocaReal = $epocaReal,
                     o.tecnicasReales = $tecnicasReales,
                     o.rangoPrecio = $rangoPrecio,
                     o.fotografia = $foto`,
                {
                    idObra: obra._id,
                    descripcionIA: descripcionIA || descripcionBase,
                    embedding: embedding || [],
                    tagsIA: [...etiquetas.estilos, ...etiquetas.paletas, ...etiquetas.tecnicas],
                    epocaReal: etiquetas.epocas[0] || 'contemporáneo',
                    tecnicasReales: etiquetas.tecnicas,
                    rangoPrecio: etiquetas.rangoPrecio,
                    foto: obra.fotografia || ''
                }
            );

            // Crear nodos y relaciones
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

            console.log(`  ✓ Procesada\n`);

        } catch (err) {
            console.error(`  ✗ Error: ${err.message}\n`);
            errores++;
        }
    }

    // 8. Crear relaciones SIMILAR_A basadas en embeddings
    console.log('Creando relaciones de similitud entre obras...');
    const result = await session.run(
        `MATCH (o:Obra) WHERE o.embedding IS NOT NULL
         RETURN o.id_obra AS idObra, o.embedding AS embedding`
    );
    const obrasConEmbedding = result.records.map(r => ({
        id: toNum(r.get('idObra')),
        embedding: r.get('embedding')
    }));
    console.log(`  ${obrasConEmbedding.length} obras con embedding`);

    let similares = 0;
    for (const obra of obrasConEmbedding) {
        const similares_ = obrasConEmbedding
            .filter(o => o.id !== obra.id)
            .map(o => ({ id: o.id, score: cosineSimilarity(obra.embedding, o.embedding) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        for (const s of similares_) {
            if (s.score > 0.7) {
                await session.run(
                    `MATCH (o1:Obra {id_obra: $id1})
                     MATCH (o2:Obra {id_obra: $id2})
                     MERGE (o1)-[:SIMILAR_A {score: $score}]->(o2)`,
                    { id1: obra.id, id2: s.id, score: s.score }
                );
                similares++;
            }
        }
    }
    console.log(`  ${similares} relaciones SIMILAR_A creadas\n`);

    // 9. Estadísticas finales
    console.log('=== ESTADÍSTICAS DEL GRAFO ===');
    const stats = await session.run(`MATCH (n) RETURN labels(n) AS tipo, count(n) AS cantidad ORDER BY tipo`);
    for (const record of stats.records) {
        console.log(`  ${record.get('tipo')[0]}: ${toNum(record.get('cantidad'))} nodos`);
    }
    const relStats = await session.run(`MATCH ()-[r]->() RETURN type(r) AS tipo, count(r) AS cantidad ORDER BY tipo`);
    for (const record of relStats.records) {
        console.log(`  ${record.get('tipo')}: ${record.get('cantidad').toNumber()} relaciones`);
    }

    console.log(`\n✅ ${procesadasCount} obras procesadas, ${errores} errores`);
    console.log('=== GRAFO ENRIQUECIDO EXITOSAMENTE ===');

    await session.close();
    await closeNeo4j();
    await mongoose.disconnect();
}

enriquecerGrafo().then(() => process.exit(0)).catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
});