const { getSession } = require('../config/database');

async function createCompraRelation(idUsuario, idObra) {
    const session = getSession();
    try {
        await session.run(
            `MATCH (u:Usuario {id_usuario: $idUsuario})
             MATCH (o:Obra {id_obra: $idObra})
             MERGE (u)-[r:COMPRO]->(o)
             ON CREATE SET r.fecha = datetime()`,
            { idUsuario: parseInt(idUsuario), idObra: parseInt(idObra) }
        );
    } finally {
        await session.close();
    }
}

module.exports = { createCompraRelation };
