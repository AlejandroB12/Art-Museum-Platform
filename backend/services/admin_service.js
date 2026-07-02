const path = require('path');
const fs = require('fs');
const userRepo = require('../repositories/user_repository');
const invoiceRepo = require('../repositories/invoice_repository');
const membershipRepo = require('../repositories/membership_repository');
const geographyRepo = require('../repositories/geography_repository');
const obraRepo = require('../repositories/obra_repository');
const autorRepo = require('../repositories/autor_repository');
const generoRepo = require('../repositories/genero_repository');
const nacionalidadRepo = require('../repositories/nacionalidad_repository');
const auditRepo = require('../repositories/audit_repository');
const billingRepo = require('../repositories/billing_repository');
const emailUtils = require('../../utils/email');

const generoMap = { 'Pintura': 1, 'Escultura': 2, 'Fotografía': 3, 'Orfebreria': 4, 'Ceramica': 5 };

async function registerAdmin(data) {
    const { correo, password, nombre, apellido } = data;
    await userRepo.beginTransaction();
    try {
        const result = await userRepo.queryRaw(
            "INSERT INTO Usuario (Email, Contraseña, Nombre, Apellido, Estatus, Rol) VALUES (?, ?, ?, ?, 1, 'administrador')",
            [correo, password, nombre, apellido]
        );
        await userRepo.queryRaw("INSERT INTO Administrador (id_usuario) VALUES (?)", [result.insertId]);
        await userRepo.commit();
        return { success: true };
    } catch (err) {
        await userRepo.rollback().catch(() => {});
        throw err;
    }
}

async function listUsers() {
    const users = await userRepo.findAllUsers();
    for (const u of users) {
        if (u.Rol !== 'comprador') continue;
        if (u.MembresiaActiva == 0 && u.PuedeAdquirir == 1) {
            await userRepo.updatePuedeAdquirir(u.id_usuario, 0);
            u.PuedeAdquirir = 0;
        }
    }
    return users;
}

async function listPendingUsers() {
    return userRepo.findPendingUsers();
}

async function approveUser(id, req) {
    const sqlDatos = `
        SELECT u.Email, u.Nombre, u.Apellido, c.CodigoVerificacion
        FROM Usuario u LEFT JOIN Comprador c ON u.id_usuario = c.id_usuario WHERE u.id_usuario = ?
    `;
    const results = await userRepo.queryRaw(sqlDatos, [id]);
    if (results.length === 0) throw new Error("Usuario no encontrado");

    const usuario = results[0];
    await userRepo.updateEstatus(id, 1);

    const codigo = usuario.CodigoVerificacion || 'N/A';
    emailUtils.sendMail(emailUtils.createApprovalEmail(usuario, codigo)).catch(err => {
        console.error("Error al enviar correo de aprobación:", err);
    });

    const idAdmin = req.session?.id_usuario || 0;
    await auditRepo.registrarEvento(parseInt(id), 'APROBACION_USUARIO',
        `Usuario ${usuario.Nombre} ${usuario.Apellido} ha sido aceptado por el administrador (ID: ${idAdmin}) a las ${new Date().toLocaleTimeString()}`,
        req
    ).catch(e => console.error('Error Cassandra aprobacion:', e.message));
}

async function toggleUserStatus(id, estatus) {
    const result = await userRepo.updateEstatus(id, estatus);
    if (result.affectedRows === 0) throw new Error("Usuario no encontrado");
}

async function togglePuedeAdquirir(id, value) {
    const result = await userRepo.updatePuedeAdquirir(id, value);
    if (result.affectedRows === 0) throw new Error("Comprador no encontrado");
}

async function deleteUser(id) {
    await userRepo.deleteById(id);
}

async function listObras() {
    const results = await userRepo.queryRaw("SELECT * FROM Obra");
    return results;
}

async function updateObra(id, data) {
    const { Nombre, Precio, Estado_obra } = data;
    const rows = await userRepo.queryRaw("SELECT Estado_obra FROM Obra WHERE id_Obra = ?", [id]);
    if (rows.length === 0) throw new Error('Obra no encontrada');

    const estadoAnterior = rows[0].Estado_obra;
    await userRepo.queryRaw("UPDATE Obra SET Nombre = ?, Precio = ?, Estado_obra = ? WHERE id_Obra = ?",
        [Nombre, Precio, Estado_obra, id]);

    if (estadoAnterior !== Estado_obra) {
        auditRepo.registrarCambioEstatus(parseInt(id), estadoAnterior, Estado_obra, null,
            'Cambio manual desde panel administrador').catch(e => console.error('Error Cassandra:', e.message));
    }
}

async function deleteObra(id) {
    await userRepo.queryRaw("DELETE FROM Obra WHERE id_Obra = ?", [id]);
}

async function listObrasReservadas() {
    const obras = await obraRepo.findReserved();
    return obras.map(o => ({ id_Obra: o._id, Nombre: o.nombre, Precio: o.precio }));
}

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

async function listPaymentRequests() {
    return membershipRepo.findPendingPayments();
}

async function approvePayment(id_solicitud, id_usuario) {
    const result = await membershipRepo.findMaxExpiry(id_usuario);
    const vencimientoActual = result[0]?.vencimiento_actual;
    const ahora = new Date();
    const inicioEfectivo = vencimientoActual && new Date(vencimientoActual) > ahora ? vencimientoActual : ahora;

    await userRepo.beginTransaction();
    try {
        await membershipRepo.approvePayment(id_solicitud);
        await membershipRepo.insert(id_usuario, inicioEfectivo);
        await userRepo.updatePuedeAdquirir(id_usuario, 1);
        await userRepo.commit();
    } catch (err) {
        await userRepo.rollback().catch(() => {});
        throw err;
    }
}

async function registerNewPayment(id_usuario, req) {
    const result = await membershipRepo.findMaxExpiry(id_usuario);
    const vencimientoActual = result[0]?.vencimiento_actual;
    const ahora = new Date();
    const inicioEfectivo = vencimientoActual && new Date(vencimientoActual) > ahora ? vencimientoActual : ahora;
    await membershipRepo.insert(id_usuario, inicioEfectivo);
    await userRepo.updatePuedeAdquirir(id_usuario, 1);
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
            const filePath = path.join(__dirname, '..', '..', 'assets', 'images', 'art_previews', fileName);
            fs.writeFileSync(filePath, buffer);
            rutaFoto = `/images/art_previews/${fileName}`;
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
    userRepo.queryRaw("SET FOREIGN_KEY_CHECKS = 0").then(() => {
        invoiceRepo.upsertObra(newId, nombre.trim(), fecha_creacion || null, parseFloat(precio), idGenero, rutaFoto || '').then(() => {
            userRepo.queryRaw("SET FOREIGN_KEY_CHECKS = 1");
        }).catch(() => {});
    }).catch(() => {});

    return { id: newId };
}

async function updateObraAdmin(id, data) {
    const { nombre, precio, estado_obra } = data;
    if (!nombre || !nombre.trim()) throw Object.assign(new Error("El nombre es requerido"), { statusCode: 400 });

    const obra = await obraRepo.findById(id);
    if (!obra) throw Object.assign(new Error("Obra no encontrada"), { statusCode: 404 });

    const estadoAnterior = obra.estado_obra;
    await obraRepo.findByIdAndUpdate(id, { nombre: nombre.trim(), precio: parseFloat(precio), estado_obra: estado_obra || 'Disponible' });
    userRepo.queryRaw("UPDATE Obra SET Nombre = ?, Precio = ?, Estado_obra = ? WHERE id_Obra = ?",
        [nombre.trim(), parseFloat(precio), estado_obra || 'Disponible', id]).catch(() => {});

    if (estadoAnterior !== (estado_obra || 'Disponible')) {
        auditRepo.registrarCambioEstatus(id, estadoAnterior, estado_obra || 'Disponible', 'admin', 'Actualización desde panel').catch(e => console.error('Error Cassandra:', e.message));
    }
}

async function deleteObraAdmin(id) {
    const result = await obraRepo.findByIdAndDelete(id);
    if (!result) throw Object.assign(new Error("Obra no encontrada"), { statusCode: 404 });
    userRepo.queryRaw("DELETE FROM Obra WHERE id_Obra = ?", [id]).catch(() => {});
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

async function listAutoresAdmin() {
    const autores = await autorRepo.findAll('', { _id: 1 });
    return autores.map(a => ({
        id: a._id, nombre: a.nombre, apellido: a.apellido,
        nacionalidad: a.nacionalidad || '', biografia: a.biografia || '', fotografia: a.fotografia || ''
    }));
}

async function createAutorAdmin(data) {
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
            const filePath = path.join(__dirname, '..', '..', 'assets', 'images', 'authors', fileName);
            fs.writeFileSync(filePath, buffer);
            rutaFoto = `/images/authors/${fileName}`;
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

async function deleteAutorAdmin(id) {
    const result = await autorRepo.findByIdAndDelete(id);
    if (!result) throw Object.assign(new Error("Autor no encontrado"), { statusCode: 404 });
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

async function searchBuyer(email, cedula) {
    return userRepo.searchBuyer(email, cedula);
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
    registerAdmin, listUsers, listPendingUsers, approveUser,
    toggleUserStatus, togglePuedeAdquirir, deleteUser,
    listObras, updateObra, deleteObra, listObrasReservadas,
    generarFactura, listPaymentRequests, approvePayment, registerNewPayment,
    getObrasVendidasReport, getFacturacionResumen, getMembresiasResumen,
    getFactura, registerShipping, listDireccionesEnvio,
    listObrasAdmin, createObraAdmin, updateObraAdmin, deleteObraAdmin, updateObraDetalles,
    listNacionalidades, listGeneros, createGenero, updateGenero, deleteGenero,
    listAutoresAdmin, createAutorAdmin, deleteAutorAdmin,
    consultarCassandraObrasVendidas, consultarCassandraObrasVendidasRango,
    consultarCassandraResumenFacturacion, consultarCassandraBitacora,
    consultarLogsSeguridad, consultarObrasConHistorial, consultarHistorialEstatusObra,
    registrarEventoSeguridad, registrarCambioEstatusCassandra, searchBuyer,
    getPrecargasAtributos
};
