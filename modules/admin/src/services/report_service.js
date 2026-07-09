const userRepo = require('../repositories/user_repository');
const invoiceRepo = require('../repositories/invoice_repository');
const obraRepo = require('../repositories/obra_repository');
const auditRepo = require('../repositories/audit_repository');
const billingRepo = require('../repositories/billing_repository');

const generoMap = { 'Pintura': 1, 'Escultura': 2, 'Fotografía': 3, 'Orfebreria': 4, 'Ceramica': 5 };

async function generarFactura(data, req) {
    const { id_obra, id_admin, precio_neto, porcentaje_comision, buyer_nombre, buyer_apellido, buyer_email, buyer_cedula } = data;
    const adminId = req.session?.id_usuario || id_admin;

    if (!id_obra || !adminId || !precio_neto || !porcentaje_comision) {
        throw Object.assign(new Error("Faltan datos requeridos"), { statusCode: 400 });
    }

    return new Promise((resolve, reject) => {
        const procesarFactura = (id_comp, obraNombre, buyerManual, cb) => {
            const nombre = buyerManual?.nombre || '';
            const apellido = buyerManual?.apellido || '';
            const email = buyerManual?.email || '';
            const cedula = buyerManual?.cedula || null;
            const nombreComprador = buyerManual ? `${nombre} ${apellido}`.trim() || 'No disponible' : null;
            const compradorEmail = buyerManual ? email : null;
            const compradorCedula = buyerManual ? cedula : null;

            const obtenerDatosYFacturar = (comprador) => {
                const nombreCompradorFinal = buyerManual ? nombreComprador :
                    (comprador.Nombre && comprador.Apellido ? `${comprador.Nombre} ${comprador.Apellido}` : 'No disponible');
                const emailFinal = buyerManual ? compradorEmail : (comprador.Email || 'No disponible');
                const cedulaFinal = buyerManual ? compradorCedula : (comprador.Cedula || null);
                const nombreFinal = buyerManual ? nombre : (comprador.Nombre || '');
                const apellidoFinal = buyerManual ? apellido : (comprador.Apellido || '');

                const iva = parseFloat(precio_neto) * 0.12;
                const gananciaMuseo = parseFloat(precio_neto) * (parseFloat(porcentaje_comision) / 100);
                const total = parseFloat(precio_neto) + iva;
                const ahora = new Date();
                const fechaStr = ahora.getFullYear() + '-' + String(ahora.getMonth() + 1).padStart(2, '0') + '-' + String(ahora.getDate()).padStart(2, '0') + ' ' + String(ahora.getHours()).padStart(2, '0') + ':' + String(ahora.getMinutes()).padStart(2, '0') + ':' + String(ahora.getSeconds()).padStart(2, '0');

                userRepo.queryRaw(
                    `INSERT INTO Factura (Monto_Neto, IVA, Total_Pagado, Ganancia_Museo_USD, Porcentaje_Comision, id_obra, id_comprador, id_admin, NombreComprador, EmailComprador, CedulaComprador, Fecha_Venta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [precio_neto, iva, total, gananciaMuseo, porcentaje_comision, id_obra, id_comp, adminId, nombreCompradorFinal || null, emailFinal || null, cedulaFinal || null, fechaStr]
                ).then(result => {
                    const idFactura = result.insertId;
                    invoiceRepo.updateObraStatus(id_obra, 'Vendida').catch(() => {});
                    invoiceRepo.deleteReserva(id_obra).catch(() => {});

                    const fecha = new Date();
                    const anioMes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

                    auditRepo.registrarBatch([
                        {
                            query: `INSERT INTO obras_vendidas_por_periodo (anio_mes, fecha_venta, id_factura, id_obra, nombre_obra, precio_venta, iva, total_pagado, ganancia_museo_usd, porcentaje_comision, id_comprador, comprador_nombre, comprador_apellido, comprador_email, comprador_cedula, id_admin, admin_nombre) VALUES (?, toTimestamp(now()), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            params: [anioMes, idFactura, id_obra, obraNombre, precio_neto, iva, total, gananciaMuseo, porcentaje_comision, id_comp, nombreFinal, apellidoFinal, emailFinal, cedulaFinal, adminId, 'Admin']
                        },
                        {
                            query: `INSERT INTO historial_estatus_obra (id_obra, fecha_cambio, estatus_anterior, estatus_nuevo, modificado_por, motivo) VALUES (?, toTimestamp(now()), ?, ?, ?, ?)`,
                            params: [id_obra, 'Reservado', 'Vendida', adminId, `Pago completado - Factura #${idFactura}`]
                        }
                    ]).catch(e => console.error('Error Cassandra:', e.message));

                    obraRepo.findByIdAndUpdate(id_obra, { estado_obra: 'Vendida' }).catch(e => console.error('Error MongoDB:', e.message));

                    cb(null, {
                        id_factura: idFactura, id_obra, nombreObra: obraNombre, id_comprador: id_comp,
                        nombreComprador: nombreCompradorFinal, emailComprador: emailFinal, cedulaComprador: cedulaFinal,
                        precio_neto: parseFloat(precio_neto), iva, ganancia_museo: gananciaMuseo,
                        porcentaje_comision: parseFloat(porcentaje_comision), total,
                        fecha: new Date().toLocaleDateString(), hora: new Date().toLocaleTimeString()
                    });
                }).catch(err => cb(err));
            };

            if (buyerManual) {
                obtenerDatosYFacturar({});
            } else {
                userRepo.queryRaw(
                    `SELECT u.Email, u.Nombre, u.Apellido, c.Cedula FROM Usuario u LEFT JOIN Comprador c ON u.id_usuario = c.id_usuario WHERE u.id_usuario = ?`,
                    [id_comp]
                ).then(compradorDatos => {
                    obtenerDatosYFacturar(compradorDatos[0] || {});
                }).catch(err => cb(err));
            }
        };

        const continuarFacturacion = (obraNombre) => {
            if (buyer_nombre && buyer_apellido) {
                procesarFactura(adminId, obraNombre, { nombre: buyer_nombre, apellido: buyer_apellido, email: buyer_email || '', cedula: buyer_cedula || null }, (err, data) => {
                    if (err) return reject(err);
                    resolve({ success: true, message: "Factura generada correctamente", id_factura: data.id_factura, mostrarEnvio: true, datos: data });
                });
                return;
            }

            userRepo.queryRaw("SELECT id_usuario FROM Reserva WHERE id_obra = ?", [id_obra]).then(compradorResults => {
                if (compradorResults.length === 0) {
                    resolve({ success: false, needsBuyerData: true, message: "La obra no fue reservada por un comprador. Ingrese los datos manualmente." });
                    return;
                }
                procesarFactura(compradorResults[0].id_usuario, obraNombre, null, (err, data) => {
                    if (err) return reject(err);
                    resolve({ success: true, message: "Factura generada correctamente", id_factura: data.id_factura, mostrarEnvio: true, datos: data });
                });
            }).catch(err => reject(err));
        };

        userRepo.queryRaw("ALTER TABLE Factura ADD COLUMN IF NOT EXISTS NombreComprador varchar(90) DEFAULT NULL, ADD COLUMN IF NOT EXISTS EmailComprador varchar(90) DEFAULT NULL, ADD COLUMN IF NOT EXISTS CedulaComprador varchar(45) DEFAULT NULL").catch(() => {});

        userRepo.queryRaw("SELECT Estado_obra FROM Obra WHERE id_Obra = ?", [id_obra]).then(obraResults => {
            if (obraResults.length === 0) {
                obraRepo.findById(id_obra).then(obraMongo => {
                    if (!obraMongo || obraMongo.estado_obra !== 'Reservado') {
                        return reject(Object.assign(new Error("La obra no existe o no está reservada"), { statusCode: 404 }));
                    }
                    const idGenero = generoMap[obraMongo.genero?.nombre] || null;
                    userRepo.queryRaw("SET FOREIGN_KEY_CHECKS = 0");
                    invoiceRepo.upsertObra(id_obra, obraMongo.nombre, obraMongo.fecha_creacion || null, obraMongo.precio, idGenero, obraMongo.fotografia || '').then(() => {
                        userRepo.queryRaw("SET FOREIGN_KEY_CHECKS = 1");
                        continuarFacturacion(obraMongo.nombre || '');
                    }).catch(err => reject(err));
                }).catch(() => reject(Object.assign(new Error("Error al verificar obra"), { statusCode: 500 })));
                return;
            }
            if (obraResults[0].Estado_obra !== 'Reservado') {
                return reject(Object.assign(new Error("La obra no está en estado Reservado"), { statusCode: 400 }));
            }
            userRepo.queryRaw("SELECT Nombre FROM Obra WHERE id_Obra = ?", [id_obra]).then(obraDatos => {
                continuarFacturacion(obraDatos[0]?.Nombre || '');
            }).catch(err => reject(err));
        }).catch(err => reject(err));
    });
}

async function getObrasVendidasReport(fechaInicio, fechaFin) {
    return invoiceRepo.obrasVendidasReport(fechaInicio, fechaFin);
}

async function getFacturacionResumen(fechaInicio, fechaFin) {
    return invoiceRepo.facturacionResumen(fechaInicio, fechaFin);
}

async function getMembresiasResumen(fechaInicio, fechaFin) {
    return invoiceRepo.membresiasResumen(fechaInicio, fechaFin);
}

async function getFactura(id) {
    return invoiceRepo.findById(id);
}

async function listDireccionesEnvio(idFactura) {
    const results = await userRepo.queryRaw("SELECT * FROM Envio WHERE Factura_id_Factura = ? ORDER BY id_Envio DESC LIMIT 1", [idFactura]);
    if (results.length > 0) {
        const envio = results[0];
        return {
            municipio: envio.Municipio || '',
            parroquia: envio.Parroquia || '',
            direccion: envio.Calle || ''
        };
    }
    return null;
}

async function consultarCassandraObrasVendidas(anio_mes) {
    return billingRepo.findObrasVendidasPorMes(anio_mes);
}

async function consultarCassandraObrasVendidasRango(meses) {
    const listaMeses = meses.split(',');
    const results = [];
    for (const mes of listaMeses) {
        const data = await billingRepo.findObrasVendidasPorMes(mes.trim());
        results.push(...data);
    }
    results.sort((a, b) => new Date(b.fecha_venta) - new Date(a.fecha_venta));
    return results;
}

async function consultarCassandraResumenFacturacion(anio_mes) {
    return billingRepo.findResumenFacturacion(anio_mes);
}

async function consultarCassandraBitacora(id_usuario, tipo_evento) {
    if (id_usuario && tipo_evento) return auditRepo.findLogsByUserAndType(id_usuario, tipo_evento);
    if (id_usuario) return auditRepo.findLogsByUser(id_usuario);
    throw Object.assign(new Error("id_usuario requerido"), { statusCode: 400 });
}

async function consultarLogsSeguridad() {
    const rows = await auditRepo.findAllLogs();
    const idsUnicos = [...new Set(rows.map(r => r.id_usuario))];
    const usuarios = idsUnicos.length > 0 ? await userRepo.findUserNamesByIds(idsUnicos) : [];
    const nombreMap = {};
    usuarios.forEach(u => { nombreMap[u.id_usuario] = `${u.Nombre} ${u.Apellido}`; });
    const logs = rows.map(r => ({
        id_usuario: r.id_usuario,
        nombre_usuario: nombreMap[r.id_usuario] || `Usuario #${r.id_usuario}`,
        fecha_evento: r.fecha_evento, tipo_evento: r.tipo_evento,
        descripcion: r.descripcion, ip_origen: r.ip_origen, dispositivo: r.dispositivo
    }));
    logs.sort((a, b) => new Date(b.fecha_evento) - new Date(a.fecha_evento));
    return logs;
}

async function consultarObrasConHistorial() {
    const ids = await auditRepo.findObrasConHistorial();
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    const obraRows = await userRepo.queryRaw(
        `SELECT id_Obra, Nombre, Estado_obra FROM Obra WHERE id_Obra IN (${placeholders})`, ids
    );
    const obraMap = {};
    obraRows.forEach(o => obraMap[o.id_Obra] = { nombre: o.Nombre, estado_actual: o.Estado_obra });
    return ids.map(id => ({
        id_obra: id, nombre_obra: obraMap[id]?.nombre || `Obra #${id}`,
        estado_actual: obraMap[id]?.estado_actual || 'Desconocido'
    })).sort((a, b) => a.id_obra - b.id_obra);
}

async function consultarHistorialEstatusObra(id_obra) {
    const rows = await auditRepo.findHistorialByObra(id_obra);
    return Promise.all(rows.map(async (row) => {
        let nombreObra = `Obra #${row.id_obra}`;
        try {
            const obraRows = await userRepo.queryRaw('SELECT Nombre FROM Obra WHERE id_Obra = ?', [row.id_obra]);
            if (obraRows.length > 0) nombreObra = obraRows[0].Nombre;
        } catch { }
        return {
            id_obra: row.id_obra, nombre_obra: nombreObra,
            fecha_cambio: row.fecha_cambio, estatus_anterior: row.estatus_anterior,
            estatus_nuevo: row.estatus_nuevo, modificado_por: row.modificado_por, motivo: row.motivo
        };
    }));
}

async function registrarEventoSeguridad(data, req) {
    const { id_usuario, tipo_evento, descripcion, ip_origen, dispositivo } = data;
    await auditRepo.registrarEvento(
        parseInt(id_usuario), tipo_evento, descripcion || '',
        { ip: ip_origen || req.ip, headers: { 'user-agent': dispositivo || req.headers['user-agent'] } }
    );
}

async function registrarCambioEstatusCassandra(data) {
    const { id_obra, estatus_anterior, estatus_nuevo, modificado_por, motivo } = data;
    await auditRepo.registrarCambioEstatus(
        parseInt(id_obra), estatus_anterior, estatus_nuevo,
        modificado_por ? parseInt(modificado_por) : null, motivo || ''
    );
}

module.exports = {
    generarFactura,
    getObrasVendidasReport, getFacturacionResumen, getMembresiasResumen,
    getFactura, listDireccionesEnvio,
    consultarCassandraObrasVendidas, consultarCassandraObrasVendidasRango,
    consultarCassandraResumenFacturacion, consultarCassandraBitacora,
    consultarLogsSeguridad, consultarObrasConHistorial, consultarHistorialEstatusObra,
    registrarEventoSeguridad, registrarCambioEstatusCassandra
};
