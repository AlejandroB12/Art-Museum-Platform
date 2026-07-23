const { query } = require('../config/database');

async function registerShipping(data) {
    let { id_factura, estado, municipio, parroquia, direccion_detallada, numero_guia } = data;
    if (!numero_guia || numero_guia.trim() === '') {
        const rand = String(Math.floor(1000 + Math.random() * 9000));
        numero_guia = `MUS-${String(id_factura).padStart(6, '0')}-${rand}`;
    }

    const facturaResults = await query("SELECT id_factura, total_pagado FROM factura WHERE id_factura = $1", [id_factura]);
    if (facturaResults.length === 0) throw Object.assign(new Error("La factura no existe"), { statusCode: 404 });

    const existing = await query("SELECT id_envio FROM envio WHERE id_factura = $1", [id_factura]);
    if (existing.length > 0) throw Object.assign(new Error("Esta factura ya tiene un envío registrado"), { statusCode: 400 });

    await query(
        "INSERT INTO envio (id_factura, monto_total, estado_entrega, municipio, parroquia, calle, numero_guia, fecha_envio) VALUES ($1, $2, 'En proceso', $3, $4, $5, $6, NOW())",
        [id_factura, facturaResults[0].total_pagado || 0, municipio, parroquia, direccion_detallada, numero_guia]
    );

    return { numero_guia };
}

module.exports = { registerShipping };
