const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const obraRepo = require('../repositories/obra_repository');
const autorRepo = require('../repositories/artista_repository');
const generoRepo = require('../repositories/genero_repository');
const nacionalidadRepo = require('../repositories/nacionalidad_repository');
const invoiceRepo = require('../repositories/invoice_repository');
const auditRepo = require('../repositories/audit_repository');

const generoMap = { 'Pintura': 1, 'Escultura': 2, 'Fotografía': 3, 'Orfebreria': 4, 'Ceramica': 5 };

async function listObras() {
    const results = await query("SELECT * FROM obra");
    return results;
}

async function updateObra(id, data) {
    const { nombre, precio, estado_obra } = data;
    const rows = await query("SELECT estado_obra FROM obra WHERE id_obra = $1", [id]);
    if (rows.length === 0) throw new Error('Obra no encontrada');

    const estadoAnterior = rows[0].estado_obra;
    await query("UPDATE obra SET nombre = $1, precio = $2, estado_obra = $3 WHERE id_obra = $4",
        [nombre, precio, estado_obra, id]);

    if (estadoAnterior !== estado_obra) {
        auditRepo.registrarCambioEstatus(parseInt(id), estadoAnterior, estado_obra, null,
            'Cambio manual desde panel administrador').catch(e => console.error('Error Cassandra:', e.message));
    }
}

async function deleteObra(id) {
    await query("DELETE FROM obra WHERE id_obra = $1", [id]);
}

async function listObrasReservadas() {
    const obras = await obraRepo.findReserved();
    return obras.map(o => ({ id_obra: o._id, nombre: o.nombre, precio: o.precio }));
}

async function listObrasAdmin() {
    const obras = await obraRepo.findAll({}, { _id: 1 });
    return obras.map(o => ({
        id: o._id, nombre: o.nombre,
        fecha_creacion: o.fecha_creacion ? o.fecha_creacion.toISOString().split('T')[0] : '',
        precio: o.precio, estado_obra: o.estado_obra, fotografia: o.fotografia || '',
        genero_nombre: o.genero?.nombre || '', autores_ids: o.autores || []
    }));
}

async function createObraAdmin(data) {
    const { nombre, fecha_creacion, precio, estado_obra, fotografia, genero_nombre, autores_ids, fotografia_base64, fotografia_nombre } = data;
    if (!nombre || !nombre.trim()) throw Object.assign(new Error("El nombre de la obra es requerido"), { statusCode: 400 });
    if (!precio || isNaN(precio)) throw Object.assign(new Error("El precio es requerido"), { statusCode: 400 });

    let rutaFoto = fotografia || '';
    if (fotografia_base64) {
        const matches = fotografia_base64.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
            const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            const fileName = `${Date.now()}-${fotografia_nombre || `imagen.${ext}`}`;
            const filePath = path.join(__dirname, '..', '..', 'assets', 'images', 'artworks', fileName);
            fs.writeFileSync(filePath, buffer);
            rutaFoto = `/images/artworks/${fileName}`;
        }
    }

    const maxId = await obraRepo.findMaxId();
    const newId = (maxId ? maxId._id : 0) + 1;

    await obraRepo.create({
        _id: newId, nombre: nombre.trim(), fecha_creacion: fecha_creacion || undefined,
        precio: parseFloat(precio), estado_obra: estado_obra || 'Disponible',
        fotografia: rutaFoto, genero: { nombre: genero_nombre || 'General' }, autores: autores_ids || []
    });

    const idGenero = generoMap[genero_nombre] || null;
    invoiceRepo.upsertObra(newId, nombre.trim(), fecha_creacion || null, parseFloat(precio), idGenero, rutaFoto || '').catch(() => {});

    return { id: newId };
}

async function updateObraAdmin(id, data) {
    const { nombre, precio, estado_obra } = data;
    if (!nombre || !nombre.trim()) throw Object.assign(new Error("El nombre es requerido"), { statusCode: 400 });

    const obra = await obraRepo.findById(id);
    if (!obra) throw Object.assign(new Error("Obra no encontrada"), { statusCode: 404 });

    const estadoAnterior = obra.estado_obra;
    await obraRepo.findByIdAndUpdate(id, { nombre: nombre.trim(), precio: parseFloat(precio), estado_obra: estado_obra || 'Disponible' });
    query("UPDATE obra SET nombre = $1, precio = $2, estado_obra = $3 WHERE id_obra = $4",
        [nombre.trim(), parseFloat(precio), estado_obra || 'Disponible', id]).catch(() => {});

    if (estadoAnterior !== (estado_obra || 'Disponible')) {
        auditRepo.registrarCambioEstatus(id, estadoAnterior, estado_obra || 'Disponible', 'admin', 'Actualización desde panel').catch(e => console.error('Error Cassandra:', e.message));
    }
}

async function deleteObraAdmin(id) {
    const result = await obraRepo.findByIdAndDelete(id);
    if (!result) throw Object.assign(new Error("Obra no encontrada"), { statusCode: 404 });
    query("DELETE FROM obra WHERE id_obra = $1", [id]).catch(() => {});
}

async function updateObraDetalles(id, detalles) {
    if (!detalles || typeof detalles !== 'object') throw Object.assign(new Error("Debe proporcionar un objeto de detalles válido"), { statusCode: 400 });
    const obra = await obraRepo.findById(id);
    if (!obra) throw Object.assign(new Error("Obra no encontrada"), { statusCode: 404 });
    await obraRepo.findByIdAndUpdate(id, { 'genero.detalles': detalles });
}

async function listNacionalidades() {
    const nacionalidades = await nacionalidadRepo.findAll();
    return nacionalidades.map(n => ({ id: n._id, descripcion: n.nombre }));
}

async function listGeneros() {
    const [generos, espDocs] = await Promise.all([generoRepo.findAll(), generoRepo.getEspecializaciones()]);
    const espMap = {};
    espDocs.forEach(e => { espMap[e.nombre] = e.atributos || []; });
    return generos.map(g => ({
        id: g._id, nombre: g.nombre,
        atributos: (g.atributos && g.atributos.length) ? g.atributos : (espMap[g.nombre] || [])
    }));
}

async function createGenero(data) {
    const { nombre, atributos } = data;
    if (!nombre || !nombre.trim()) throw Object.assign(new Error("El nombre del género es requerido"), { statusCode: 400 });
    const existente = await generoRepo.findOneByName(nombre.trim());
    if (existente) throw Object.assign(new Error("El género ya existe"), { statusCode: 400 });
    const maxId = await generoRepo.findMaxId();
    const newId = (maxId ? maxId._id : 0) + 1;
    await generoRepo.create({ _id: newId, nombre: nombre.trim(), atributos: Array.isArray(atributos) ? atributos : [] });
    return { id: newId };
}

async function updateGenero(id, data) {
    const { nombre, atributos } = data;
    const update = {};
    if (nombre && nombre.trim()) update.nombre = nombre.trim();
    if (atributos !== undefined) update.atributos = Array.isArray(atributos) ? atributos : [];
    const result = await generoRepo.findByIdAndUpdate(id, update);
    if (!result) throw Object.assign(new Error("Género no encontrado"), { statusCode: 404 });
}

async function deleteGenero(id) {
    const result = await generoRepo.findByIdAndDelete(id);
    if (!result) throw Object.assign(new Error("Género no encontrado"), { statusCode: 404 });
}

async function listArtistasAdmin() {
    const artistas = await autorRepo.findAll('', { _id: 1 });
    return artistas.map(a => ({
        id: a._id, nombre: a.nombre, apellido: a.apellido,
        nacionalidad: a.nacionalidad || '', biografia: a.biografia || '', fotografia: a.fotografia || ''
    }));
}

async function createArtistaAdmin(data) {
    const { nombre, apellido, nacionalidad, biografia, fotografia_base64, fotografia_nombre } = data;
    if (!nombre || !nombre.trim() || !apellido || !apellido.trim()) {
        throw Object.assign(new Error("Nombre y apellido son requeridos"), { statusCode: 400 });
    }
    let rutaFoto = '';
    if (fotografia_base64) {
        const matches = fotografia_base64.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
            const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            const fileName = `${Date.now()}-${fotografia_nombre || `imagen.${ext}`}`;
            const filePath = path.join(__dirname, '..', '..', 'assets', 'images', 'artists', fileName);
            fs.writeFileSync(filePath, buffer);
            rutaFoto = `/images/artists/${fileName}`;
        }
    }
    const maxId = await autorRepo.findMaxId();
    const newId = (maxId ? maxId._id : 0) + 1;
    await autorRepo.create({
        _id: newId, nombre: nombre.trim(), apellido: apellido.trim(),
        nacionalidad: nacionalidad ? nacionalidad.trim() : '',
        biografia: biografia ? biografia.trim() : '', fotografia: rutaFoto
    });
    return { id: newId };
}

async function deleteArtistaAdmin(id) {
    const result = await autorRepo.findByIdAndDelete(id);
    if (!result) throw Object.assign(new Error("Artista no encontrado"), { statusCode: 404 });
}

const PRECARGAS_ATRIBUTOS = {
    'Pintura': [
        { nombre: 'tecnica_principal', tipo: 'string', requerido: true },
        { nombre: 'soporte_base', tipo: 'string', requerido: true },
        { nombre: 'requiere_enmarcado', tipo: 'boolean', requerido: false }
    ],
    'Escultura': [
        { nombre: 'material_predominante', tipo: 'string', requerido: true },
        { nombre: 'requiere_pedestal', tipo: 'boolean', requerido: false },
        { nombre: 'clasificacion_espacio', tipo: 'string', requerido: false }
    ],
    'Fotografía': [
        { nombre: 'formato_origen', tipo: 'string', requerido: true },
        { nombre: 'tipo_impresion_estandar', tipo: 'string', requerido: false },
        { nombre: 'requiere_revelado_quimico', tipo: 'boolean', requerido: false }
    ],
    'Orfebreria': [
        { nombre: 'metal_base_dominante', tipo: 'string', requerido: true },
        { nombre: 'kilataje_estandar', tipo: 'string', requerido: false },
        { nombre: 'requiere_certificado_autenticidad', tipo: 'boolean', requerido: false }
    ],
    'Ceramica': [
        { nombre: 'tecnica_acabado', tipo: 'string', requerido: false },
        { nombre: 'tipo_arcilla_base', tipo: 'string', requerido: true },
        { nombre: 'temperatura_coccion_promedio_celsius', tipo: 'number', requerido: false }
    ]
};

function getPrecargasAtributos() {
    return PRECARGAS_ATRIBUTOS;
}

module.exports = {
    listObras, updateObra, deleteObra, listObrasReservadas,
    listObrasAdmin, createObraAdmin, updateObraAdmin, deleteObraAdmin, updateObraDetalles,
    listNacionalidades, listGeneros, createGenero, updateGenero, deleteGenero,
    listArtistasAdmin, createArtistaAdmin, deleteArtistaAdmin,
    getPrecargasAtributos
};
