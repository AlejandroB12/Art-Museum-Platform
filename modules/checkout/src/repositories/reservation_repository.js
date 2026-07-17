const { sequelize } = require('../config/database');

async function create(idObra, idUsuario, fecha) {
    await sequelize.query(
        `INSERT INTO reserva (id_obra, id_usuario, fecha_reserva) VALUES ($1, $2, $3)`,
        { bind: [idObra, Number(idUsuario), fecha] }
    );
}

async function deleteByObra(idObra) {
    await sequelize.query(
        `DELETE FROM reserva WHERE id_obra = $1`,
        { bind: [idObra] }
    );
}

async function findByUser(idUsuario) {
    const [rows] = await sequelize.query(
        `SELECT * FROM reserva WHERE id_usuario = $1 ORDER BY fecha_reserva DESC`,
        { bind: [Number(idUsuario)] }
    );
    return rows;
}

async function findByObra(idObra) {
    const [rows] = await sequelize.query(
        `SELECT * FROM reserva WHERE id_obra = $1`,
        { bind: [idObra] }
    );
    return rows;
}

module.exports = { create, deleteByObra, findByUser, findByObra };
