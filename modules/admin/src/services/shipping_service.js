const userRepo = require('../repositories/user_repository');

async function registerShipping(data) {
    let { id_factura, estado, municipio, parroquia, direccion_detallada, numero_guia } = data;
    if (!numero_guia || numero_guia.trim() === '') {
        const rand = String(Math.floor(1000 + Math.random() * 9000));
        numero_guia = `MUS-${String(id_factura).padStart(6, '0')}-${rand}`;
    }

    const facturaResults = await userRepo.queryRaw("SELECT id_factura, Total_Pagado FROM Factura WHERE id_factura = ?", [id_factura]);
    if (facturaResults.length === 0) throw Object.assign(new Error("La factura no existe"), { statusCode: 404 });

    const existing = await userRepo.queryRaw("SELECT id_Envio FROM Envio WHERE Factura_id_Factura = ?", [id_factura]);
    if (existing.length > 0) throw Object.assign(new Error("Esta factura ya tiene un envío registrado"), { statusCode: 400 });

    await userRepo.queryRaw(
        "INSERT INTO Envio (Factura_id_Factura, Monto_total, Estado_entrega, Municipio, Parroquia, Calle, numero_guia, fecha_envio) VALUES (?, ?, 'En proceso', ?, ?, ?, ?, NOW())",
        [id_factura, facturaResults[0].Total_Pagado || 0, municipio, parroquia, direccion_detallada, numero_guia]
    );

    return { numero_guia };
}

module.exports = { registerShipping };
