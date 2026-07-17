const { sequelize } = require('../config/database');

const generoMap = { 'Pintura': 1, 'Escultura': 2, 'Fotografía': 3, 'Orfebreria': 4, 'Ceramica': 5 };

async function upsertObra(idObra, nombre, fecha, precio, generoNombre, fotografia) {
    const idGenero = generoMap[generoNombre] || 1;
    await sequelize.query(
        `INSERT INTO obra (id_obra, nombre, fecha_creacion, precio, estado_obra, id_genero, fotografia)
         VALUES ($1, $2, $3, $4, 'Reservado', $5, $6)
         ON CONFLICT (id_obra) DO UPDATE SET
           nombre = EXCLUDED.nombre,
           precio = EXCLUDED.precio,
           estado_obra = EXCLUDED.estado_obra`,
        { bind: [String(idObra), nombre, fecha || new Date(), precio, idGenero, fotografia || ''] }
    );
}

async function updateObraStatus(idObra, estado) {
    await sequelize.query(
        `UPDATE obra SET estado_obra = $1 WHERE id_obra = $2`,
        { bind: [estado, String(idObra)] }
    );
}

async function findObraById(idObra) {
    const [rows] = await sequelize.query(
        `SELECT * FROM obra WHERE id_obra = $1`,
        { bind: [String(idObra)] }
    );
    return rows.length > 0 ? rows[0] : null;
}

module.exports = { upsertObra, updateObraStatus, findObraById };
