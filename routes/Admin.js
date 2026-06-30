const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const db = require('../config/database');
const path = require('path');

require('dotenv').config();
const mongoose = require('mongoose');

const Genero = require('../models/Genero');
const Autor = require('../models/Autor');
const Obra = require('../models/Obra');

const Nacionalidad = require('../models/Nacionalidad');

const { client } = require('../config/cassandra');

// Migración al arrancar: asegurar columna Fecha_Venta y corregir NULLs
db.query("ALTER TABLE Factura MODIFY COLUMN Fecha_Venta timestamp NULL DEFAULT CURRENT_TIMESTAMP", (errMod) => {
    if (errMod) {
        db.query("ALTER TABLE Factura ADD COLUMN Fecha_Venta timestamp NULL DEFAULT CURRENT_TIMESTAMP", (errAdd) => {
            if (errAdd) console.error('Error creando Fecha_Venta:', errAdd.message);
        });
    }
});
db.query("UPDATE Factura SET Fecha_Venta = NOW() WHERE Fecha_Venta IS NULL OR Fecha_Venta = '0000-00-00 00:00:00'", (errUpd) => {
    if (errUpd) console.error('Error actualizando Fecha_Venta NULL:', errUpd.message);
    else console.log('Facturas actualizadas con Fecha_Venta');
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ==========================================
// 1. AUTENTICACIÓN Y REGISTRO DE ADMIN
// ==========================================
router.post('/registrar-admin', (req, res) => {
    const { correo, password, nombre, apellido } = req.body;

    db.beginTransaction((err) => {
        if (err) throw err;

        // 1. Insertamos en la tabla Padre (Usuario) que ahora tiene los nombres
        const sqlUser = "INSERT INTO Usuario (Email, Contraseña, Nombre, Apellido, Estatus, Rol) VALUES (?, ?, ?, ?, 1, 'administrador')";
        
        db.query(sqlUser, [correo, password, nombre, apellido], (err, result) => {
            if (err) return db.rollback(() => res.status(500).send("Error en Usuario: " + err.message));
            
            const idUsuario = result.insertId;
            
            // 2. Insertamos en la tabla Subtipo (Administrador)
            // Ya NO incluimos nombre ni apellido aquí porque no existen en esta tabla
            const sqlAdmin = "INSERT INTO Administrador (id_usuario) VALUES (?)";
            
            db.query(sqlAdmin, [idUsuario], (err) => {
                if (err) return db.rollback(() => res.status(500).send("Error en tabla Administrador: " + err.message));
                
                db.commit((err) => {
                    if (err) return db.rollback(() => res.status(500).send("Error al confirmar registro"));
                    res.redirect('/public/login.html');
                });
            });
        });
    });
});


// ==========================================
// 2. GESTIÓN DE USUARIOS (CRUD Y APROBACIÓN)
// ==========================================

router.get('/api/todos-los-usuarios', (req, res) => {
    const sql = `
        SELECT u.id_usuario, u.Email, u.Rol, u.Estatus,
               c.PuedeAdquirir,
               CASE
                   WHEN EXISTS (
                       SELECT 1 FROM Membresia m
                       WHERE m.id_usuario = u.id_usuario
                       AND NOW() <= DATE_ADD(m.FechaPago, INTERVAL (m.MontoPagado / 10 * 30) DAY)
                   ) THEN 1
                   ELSE 0
               END AS MembresiaActiva
        FROM Usuario u
        LEFT JOIN Comprador c ON u.id_usuario = c.id_usuario
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json([]);
        // Auto-desactivar si la membresía venció (respeta toggle manual del admin para activar)
        for (const u of results) {
            if (u.Rol !== 'comprador') continue;
            if (u.MembresiaActiva == 0 && u.PuedeAdquirir == 1) {
                db.query("UPDATE Comprador SET PuedeAdquirir = 0 WHERE id_usuario = ?", [u.id_usuario]);
                u.PuedeAdquirir = 0;
            }
        }
        res.json(results);
    });
});

router.get('/api/usuarios-pendientes', (req, res) => {
    const sql = `
        SELECT u.id_usuario, u.Email, u.Rol, u.Estatus, c.CodigoVerificacion
        FROM Usuario u
        LEFT JOIN Comprador c ON u.id_usuario = c.id_usuario
        WHERE u.Estatus = 0 AND u.Rol != 'administrador'
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json([]);
        res.json(results);
    });
});

router.patch('/aprobar-usuario/:id', (req, res) => {
    const { id } = req.params;

    const sqlDatos = `
        SELECT u.Email, u.Nombre, u.Apellido, c.CodigoVerificacion
        FROM Usuario u
        LEFT JOIN Comprador c ON u.id_usuario = c.id_usuario
        WHERE u.id_usuario = ?
    `;

    db.query(sqlDatos, [id], (err, results) => {
        if (err) return res.status(500).send("Error al obtener datos del usuario: " + err.message);
        if (results.length === 0) return res.status(404).send("Usuario no encontrado.");

        const usuario = results[0];

        const sqlAprobar = "UPDATE Usuario SET Estatus = 1 WHERE id_usuario = ?";
        db.query(sqlAprobar, [id], (err, result) => {
            if (err) return res.status(500).send("Error al aprobar usuario: " + err.message);
            if (result.affectedRows === 0) return res.status(404).send("Usuario no encontrado.");

            const codigo = usuario.CodigoVerificacion || 'N/A';

            const mailOptions = {
                from: '"Museo de Arte Contemporáneo" <fg57179@gmail.com>',
                to: usuario.Email,
                subject: 'Tu cuenta ha sido aprobada',
                html: `
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="margin:0; padding:0; background-color:#121212; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#121212; padding:40px 20px;">
                        <tr>
                            <td align="center">
                                <table width="560" cellpadding="0" cellspacing="0" style="background:#1e1e1e; border:1px solid #00ff00; border-radius:12px; box-shadow:0 10px 40px rgba(0,255,0,0.1); max-width:100%;">
                                    <tr>
                                        <td style="padding:40px 35px; text-align:center;">
                                            <div style="font-size:48px; margin-bottom:15px;">&#10003;</div>
                                            <h1 style="color:#00ff00; font-size:28px; font-weight:800; text-transform:uppercase; letter-spacing:-1px; margin:0 0 8px;">¡Bienvenido!</h1>
                                            <p style="color:#ffffff; font-size:18px; font-weight:600; margin:0 0 15px;">Tu registro ha sido aprobado</p>
                                            <p style="color:#888; font-size:14px; line-height:1.7; margin:0 0 10px;">Hola <strong style="color:#00ff00;">${usuario.Nombre} ${usuario.Apellido}</strong>,</p>
                                            <p style="color:#888; font-size:14px; line-height:1.7; margin:0 0 25px;">Tu cuenta en el Museo de Arte Contemporáneo ha sido verificada y activada por nuestro equipo administrativo.</p>
                                            <div style="background:rgba(0,255,0,0.05); border-left:4px solid #00ff00; border-radius:6px; padding:20px; margin-bottom:25px;">
                                                <p style="color:#999; font-size:12px; text-transform:uppercase; letter-spacing:1px; margin:0 0 8px;">Tu código de verificación</p>
                                                <p style="color:#00ff00; font-size:32px; font-weight:900; letter-spacing:6px; margin:0; text-shadow:0 0 20px rgba(0,255,0,0.4);">${codigo}</p>
                                            </div>
                                            <p style="color:#888; font-size:13px; line-height:1.6; margin:0 0 5px;">Utiliza este código en tu panel de usuario para completar la verificación de tu cuenta.</p>
                                            <p style="color:#555; font-size:12px; line-height:1.6; margin:0 0 30px;">Ya puedes iniciar sesión y acceder a todas las funciones del museo.</p>
                                            <table cellpadding="0" cellspacing="0" align="center">
                                                <tr>
                                                    <td align="center" style="background:#00ff00; border-radius:5px; padding:14px 40px;">
                                                        <a href="http://localhost:3000/public/login.html" style="color:#121212; font-size:14px; font-weight:700; text-decoration:none; text-transform:uppercase; letter-spacing:1.5px; display:inline-block;">Iniciar Sesión</a>
                                                    </td>
                                                </tr>
                                            </table>
                                            <p style="color:#555; font-size:11px; margin-top:30px; margin-bottom:0;">Museo de Arte Contemporáneo &mdash; Tu Estilo, Tu Obra</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                `
            };

            transporter.sendMail(mailOptions, (error) => {
                if (error) console.error("Error al enviar correo de aprobación:", error);
            });

            try {
                const { client } = require('../config/cassandra');
                const idAdmin = req.session?.id_usuario || 0;
                client.execute(
                    `INSERT INTO bitacora_seguridad (id_usuario, fecha_evento, tipo_evento, descripcion, ip_origen, dispositivo)
                     VALUES (?, toTimestamp(now()), ?, ?, ?, ?)`,
                    [parseInt(id), 'APROBACION_USUARIO',
                     `Usuario ${usuario.Nombre} ${usuario.Apellido} ha sido aceptado por el administrador (ID: ${idAdmin}) a las ${new Date().toLocaleTimeString()}`,
                     req.ip || '', req.headers['user-agent'] || ''],
                    { prepare: true }
                ).catch(e => console.error('Error registrando aprobacion:', e.message));
            } catch (e) {
                console.error('Error Cassandra aprobacion:', e.message);
            }

            res.send("<h2>Usuario aprobado y activo. Correo enviado.</h2>");
        });
    });
});

router.put('/api/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const { Estatus } = req.body;
    
    if (Estatus === undefined || (Estatus != 0 && Estatus != 1)) {
        return res.status(400).json({ 
            success: false, 
            message: "Estatus inválido. Debe ser 0 (inactivo) o 1 (activo)" 
        });
    }
    
    const sql = "UPDATE Usuario SET Estatus = ? WHERE id_usuario = ?";
    
    db.query(sql, [Estatus, id], (err, result) => {
        if (err) {
            console.error('Error actualizando usuario:', err);
            return res.status(500).json({ 
                success: false, 
                message: "Error al actualizar usuario: " + err.message 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Usuario no encontrado" 
            });
        }
        
        res.json({ 
            success: true, 
            message: `Usuario ${Estatus == 1 ? 'activado' : 'desactivado'} correctamente` 
        });
    });
});

router.put('/api/usuarios/:id/toggle-adquirir', (req, res) => {
    const { id } = req.params;
    const { PuedeAdquirir } = req.body;

    if (PuedeAdquirir === undefined || (PuedeAdquirir != 0 && PuedeAdquirir != 1)) {
        return res.status(400).json({
            success: false,
            message: "Valor inválido. Debe ser 0 o 1"
        });
    }

    const sql = "UPDATE Comprador SET PuedeAdquirir = ? WHERE id_usuario = ?";
    db.query(sql, [PuedeAdquirir, id], (err, result) => {
        if (err) {
            console.error('Error actualizando PuedeAdquirir:', err);
            return res.status(500).json({
                success: false,
                message: "Error al actualizar: " + err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Comprador no encontrado"
            });
        }

        const estado = PuedeAdquirir == 1 ? 'habilitada' : 'deshabilitada';
        res.json({
            success: true,
            message: `Compra ${estado} para este usuario`
        });
    });
});

router.delete('/api/usuarios/:id', (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM Usuario WHERE id_usuario = ?", [id], (err) => {
        if (err) return res.status(500).send(err.message);
        res.send("Usuario eliminado");
    });
});

// ==========================================
// 3. GESTIÓN DE OBRAS (CRUD)
// ==========================================

router.get('/api/obras', (req, res) => {
    db.query("SELECT * FROM Obra", (err, results) => {
        if (err) return res.status(500).json([]);
        res.json(results);
    });
});

router.put('/api/obras/:id', (req, res) => {
    const { id } = req.params;
    const { Nombre, Precio, Estado_obra } = req.body;

    db.query("SELECT Estado_obra FROM Obra WHERE id_Obra = ?", [id], (err, rows) => {
        if (err) return res.status(500).send(err.message);
        if (rows.length === 0) return res.status(404).send('Obra no encontrada');

        const estadoAnterior = rows[0].Estado_obra;
        const sql = "UPDATE Obra SET Nombre = ?, Precio = ?, Estado_obra = ? WHERE id_Obra = ?";
        db.query(sql, [Nombre, Precio, Estado_obra, id], (err) => {
            if (err) return res.status(500).send(err.message);

            if (estadoAnterior !== Estado_obra) {
                client.execute(
                    `INSERT INTO historial_estatus_obra
                     (id_obra, fecha_cambio, estatus_anterior, estatus_nuevo, modificado_por, motivo)
                     VALUES (?, toTimestamp(now()), ?, ?, ?, ?)`,
                    [parseInt(id), estadoAnterior, Estado_obra, null, 'Cambio manual desde panel administrador'],
                    { prepare: true }
                ).catch(e => console.error('Error registrando cambio estatus en Cassandra:', e.message));
            }

            res.send("Obra actualizada");
        });
    });
});

router.delete('/api/obras/:id', (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM Obra WHERE id_Obra = ?", [id], (err) => {
        if (err) return res.status(500).send(err.message);
        res.send("Obra eliminada");
    });
});

// ==========================================
// 4. RUTAS SIMPLIFICADAS PARA FACTURACIÓN
// ==========================================

router.get('/api/obras-reservadas', async (req, res) => {
    try {
        const obras = await Obra.find({ estado_obra: 'Reservado' }).select('_id nombre precio').lean();
        const mapped = obras.map(o => ({
            id_Obra: o._id,
            Nombre: o.nombre,
            Precio: o.precio
        }));
        res.json(mapped);
    } catch (err) {
        console.error('Error obteniendo obras reservadas:', err);
        res.status(500).json([]);
    }
});

router.post('/generar-factura', (req, res) => {
    const { id_obra, id_admin, precio_neto, porcentaje_comision, buyer_nombre, buyer_apellido, buyer_email, buyer_cedula } = req.body;
    const adminId = req.session?.id_usuario || id_admin;
    
    if (!id_obra || !adminId || !precio_neto || !porcentaje_comision) {
        return res.status(400).json({ 
            success: false, 
            message: "Faltan datos requeridos (ID de administrador no disponible)" 
        });
    }

    const procesarFactura = (id_comp, obraNombre, buyerManual, cb) => {
        const nombre = buyerManual?.nombre || '';
        const apellido = buyerManual?.apellido || '';
        const email = buyerManual?.email || '';
        const cedula = buyerManual?.cedula || null;
        const nombreComprador = buyerManual ? `${nombre} ${apellido}`.trim() || 'No disponible' : null;
        const compradorEmail = buyerManual ? email : null;
        const compradorCedula = buyerManual ? cedula : null;

        const obtenerDatosYFacturar = (comprador) => {
            const nombreCompradorFinal = buyerManual
                ? nombreComprador
                : (comprador.Nombre && comprador.Apellido ? `${comprador.Nombre} ${comprador.Apellido}` : 'No disponible');
            const emailFinal = buyerManual ? compradorEmail : (comprador.Email || 'No disponible');
            const cedulaFinal = buyerManual ? compradorCedula : (comprador.Cedula || null);
            const nombreFinal = buyerManual ? nombre : (comprador.Nombre || '');
            const apellidoFinal = buyerManual ? apellido : (comprador.Apellido || '');

            const iva = parseFloat(precio_neto) * 0.12;
            const gananciaMuseo = parseFloat(precio_neto) * (parseFloat(porcentaje_comision) / 100);
            const total = parseFloat(precio_neto) + iva;
            const ahora = new Date();
            const fechaStr = ahora.getFullYear()+'-'+String(ahora.getMonth()+1).padStart(2,'0')+'-'+String(ahora.getDate()).padStart(2,'0')+' '+String(ahora.getHours()).padStart(2,'0')+':'+String(ahora.getMinutes()).padStart(2,'0')+':'+String(ahora.getSeconds()).padStart(2,'0');
            const sqlFactura = `INSERT INTO Factura (Monto_Neto, IVA, Total_Pagado, Ganancia_Museo_USD, Porcentaje_Comision, id_obra, id_comprador, id_admin, NombreComprador, EmailComprador, CedulaComprador, Fecha_Venta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            db.query(sqlFactura, [precio_neto, iva, total, gananciaMuseo, porcentaje_comision, id_obra, id_comp, adminId, nombreCompradorFinal || null, emailFinal || null, cedulaFinal || null, fechaStr], (err, result) => {
                if (err) return cb(err);
                const idFactura = result.insertId;
                console.log('Factura creada ID:', idFactura, 'Fecha:', fechaStr);
                db.query("UPDATE Obra SET Estado_obra = 'Vendida' WHERE id_Obra = ?", [id_obra], (err) => {
                    if (err) return cb(err);
                    db.query("DELETE FROM Reserva WHERE id_obra = ?", [id_obra], () => {});
                    db.commit(async (err) => {
                        if (err) return cb(err);
                        try {
                            const fecha = new Date();
                            const anioMes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                            await client.batch([
                                { query: `INSERT INTO obras_vendidas_por_periodo (anio_mes, fecha_venta, id_factura, id_obra, nombre_obra, precio_venta, iva, total_pagado, ganancia_museo_usd, porcentaje_comision, id_comprador, comprador_nombre, comprador_apellido, comprador_email, comprador_cedula, id_admin, admin_nombre) VALUES (?, toTimestamp(now()), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                  params: [anioMes, idFactura, id_obra, obraNombre, precio_neto, iva, total, gananciaMuseo, porcentaje_comision, id_comp, nombreFinal, apellidoFinal, emailFinal, cedulaFinal, adminId, 'Admin'] },
                                { query: `INSERT INTO historial_estatus_obra (id_obra, fecha_cambio, estatus_anterior, estatus_nuevo, modificado_por, motivo) VALUES (?, toTimestamp(now()), ?, ?, ?, ?)`,
                                  params: [id_obra, 'Reservado', 'Vendida', adminId, `Pago completado - Factura #${idFactura}`] }
                            ], { prepare: true });
                        } catch (cassErr) { console.error('Error Cassandra:', cassErr.message); }
                        try { await Obra.findByIdAndUpdate(id_obra, { estado_obra: 'Vendida' }); } catch (mongoErr) { console.error('Error MongoDB:', mongoErr.message); }
                        cb(null, { id_factura: idFactura, id_obra, nombreObra: obraNombre, id_comprador: id_comp, nombreComprador: nombreCompradorFinal, emailComprador: emailFinal, cedulaComprador: cedulaFinal, precio_neto: parseFloat(precio_neto), iva, ganancia_museo: gananciaMuseo, porcentaje_comision: parseFloat(porcentaje_comision), total, fecha: new Date().toLocaleDateString(), hora: new Date().toLocaleTimeString() });
                    });
                });
            });
        };

        if (buyerManual) {
            obtenerDatosYFacturar({});
        } else {
            const sqlDatosComprador = `SELECT u.Email, u.Nombre, u.Apellido, c.Cedula FROM Usuario u LEFT JOIN Comprador c ON u.id_usuario = c.id_usuario WHERE u.id_usuario = ?`;
            db.query(sqlDatosComprador, [id_comp], (err, compradorDatos) => {
                if (err) return cb(err);
                obtenerDatosYFacturar(compradorDatos[0] || {});
            });
        }
    };

    const continuarFacturacion = (obraNombre) => {
        if (buyer_nombre && buyer_apellido) {
            procesarFactura(adminId, obraNombre, { nombre: buyer_nombre, apellido: buyer_apellido, email: buyer_email || '', cedula: buyer_cedula || null }, (err, data) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: err.message }));
                res.json({ success: true, message: "Factura generada correctamente", id_factura: data.id_factura, mostrarEnvio: true, datos: data });
            });
            return;
        }

        const sqlComprador = "SELECT id_usuario FROM Reserva WHERE id_obra = ?";
        db.query(sqlComprador, [id_obra], (err, compradorResults) => {
            if (err) return db.rollback(() => res.status(500).json({ success: false, message: "Error obteniendo datos del comprador" }));
            if (compradorResults.length === 0) {
                return db.rollback(() => res.json({ success: false, needsBuyerData: true, message: "La obra no fue reservada por un comprador. Ingrese los datos manualmente." }));
            }
            procesarFactura(compradorResults[0].id_usuario, obraNombre, null, (err, data) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: err.message }));
                res.json({ success: true, message: "Factura generada correctamente", id_factura: data.id_factura, mostrarEnvio: true, datos: data });
            });
        });
    };

    // Asegurar columnas de comprador en Factura (Fecha_Venta se maneja al arrancar)
    db.query("ALTER TABLE Factura ADD COLUMN NombreComprador varchar(90) DEFAULT NULL, ADD COLUMN EmailComprador varchar(90) DEFAULT NULL, ADD COLUMN CedulaComprador varchar(45) DEFAULT NULL", (errCol) => {
        if (errCol && !errCol.message.includes('Duplicate column')) {
            console.error('Error agregando columnas a Factura:', errCol.message);
        }
    });

    db.beginTransaction((err) => {
        if (err) return res.status(500).json({ success: false, message: "Error al iniciar transacción" });
        
        const sqlVerificarObra = "SELECT Estado_obra FROM Obra WHERE id_Obra = ?";
        db.query(sqlVerificarObra, [id_obra], (err, obraResults) => {
            if (err) return db.rollback(() => res.status(500).json({ success: false, message: "Error verificando obra" }));
            
            if (obraResults.length === 0) {
                Obra.findById(id_obra).lean().then(obraMongo => {
                    if (!obraMongo || obraMongo.estado_obra !== 'Reservado') {
                        return db.rollback(() => res.status(404).json({ success: false, message: "La obra no existe o no está reservada" }));
                    }
                    const generoMap = { 'Pintura': 1, 'Escultura': 2, 'Fotografía': 3, 'Orfebreria': 4, 'Ceramica': 5 };
                    const idGenero = generoMap[obraMongo.genero?.nombre] || null;
                    db.query("SET FOREIGN_KEY_CHECKS = 0", (errFK) => {
                        if (errFK) return db.rollback(() => res.status(500).json({ success: false, message: "Error al deshabilitar FK" }));
                        db.query(
                            "INSERT INTO Obra (id_Obra, Nombre, Fecha_creacion, Precio, Estado_obra, id_Genero, Fotografia) VALUES (?, ?, ?, ?, 'Reservado', ?, ?) ON DUPLICATE KEY UPDATE Nombre = VALUES(Nombre), Precio = VALUES(Precio), Estado_obra = VALUES(Estado_obra)",
                            [id_obra, obraMongo.nombre, obraMongo.fecha_creacion || null, obraMongo.precio, idGenero, obraMongo.fotografia || ''],
                            (err) => {
                                db.query("SET FOREIGN_KEY_CHECKS = 1");
                                if (err) return db.rollback(() => res.status(500).json({ success: false, message: "Error al sincronizar obra" }));
                                continuarFacturacion(obraMongo.nombre || '');
                            }
                        );
                    });
                }).catch(() => db.rollback(() => res.status(500).json({ success: false, message: "Error al verificar obra" })));
                return;
            }
            
            if (obraResults[0].Estado_obra !== 'Reservado') {
                return db.rollback(() => res.status(400).json({ success: false, message: "La obra no está en estado Reservado" }));
            }
            
            db.query("SELECT Nombre FROM Obra WHERE id_Obra = ?", [id_obra], (err, obraDatos) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: "Error obteniendo datos de la obra" }));
                continuarFacturacion(obraDatos[0]?.Nombre || '');
            });
        });
    });
});

// ==========================================
// 5. MEMBRESÍAS Y PAGOS
// ==========================================

router.get('/api/solicitudes-pago', (req, res) => {
    const sql = `
        SELECT s.*, u.Email 
        FROM SolicitudPago s 
        JOIN Usuario u ON s.id_usuario = u.id_usuario 
        WHERE s.Estatus = 'Pendiente'
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send("Error consultando pagos");
        res.json(results);
    });
});

router.post('/aprobar-pago', (req, res) => {
    const { id_solicitud, id_usuario } = req.body;

    const sqlExpiry = `
        SELECT MAX(DATE_ADD(FechaPago, INTERVAL (MontoPagado / 10 * 30) DAY)) AS vencimiento_actual
        FROM Membresia WHERE id_usuario = ?
    `;

    db.query(sqlExpiry, [id_usuario], (err, result) => {
        if (err) return res.status(500).send("Error al consultar vencimiento");

        const vencimientoActual = result[0]?.vencimiento_actual;
        const ahora = new Date();
        const inicioEfectivo = vencimientoActual && new Date(vencimientoActual) > ahora
            ? vencimientoActual
            : ahora;

        db.beginTransaction((err) => {
            if (err) return res.status(500).send("Error");

            const sqlSolicitud = "UPDATE SolicitudPago SET Estatus = 'Aprobado' WHERE id_solicitud = ?";
            const sqlMembresia = "INSERT INTO Membresia (FechaPago, MontoPagado, id_usuario) VALUES (?, 10.00, ?)";

            db.query(sqlSolicitud, [id_solicitud], (err) => {
                if (err) return db.rollback(() => res.status(500).send("Error en solicitud"));

                db.query(sqlMembresia, [inicioEfectivo, id_usuario], (err) => {
                    if (err) return db.rollback(() => res.status(500).send("Error en membresía"));

                    db.query("UPDATE Comprador SET PuedeAdquirir = 1 WHERE id_usuario = ?", [id_usuario], (err) => {
                        if (err) console.error('Error activando PuedeAdquirir:', err.message);

                        db.commit((err) => {
                            if (err) return db.rollback(() => res.status(500).send("Error"));
                            try {
                                client.execute(
                                    `INSERT INTO bitacora_seguridad (id_usuario, fecha_evento, tipo_evento, descripcion, ip_origen, dispositivo)
                                     VALUES (?, toTimestamp(now()), ?, ?, ?, ?)`,
                                    [id_usuario, 'APROBACION_PAGO', 'Solicitud de pago aprobada por administrador', req.ip || '', req.headers['user-agent'] || ''],
                                    { prepare: true }
                                ).catch(e => console.error('Error audit log:', e.message));
                            } catch (e) {
                                console.error('Error Cassandra:', e.message);
                            }
                            res.send("Membresía activada y días sumados");
                        });
                    });
                });
            });
        });
    });
});

router.post('/registrar-nuevo-pago', (req, res) => {
    const { id_usuario } = req.body;

    const sqlExpiry = `
        SELECT MAX(DATE_ADD(FechaPago, INTERVAL (MontoPagado / 10 * 30) DAY)) AS vencimiento_actual
        FROM Membresia WHERE id_usuario = ?
    `;

    db.query(sqlExpiry, [id_usuario], (err, result) => {
        if (err) return res.status(500).send("Error al consultar vencimiento");

        const vencimientoActual = result[0]?.vencimiento_actual;
        const ahora = new Date();
        const inicioEfectivo = vencimientoActual && new Date(vencimientoActual) > ahora
            ? vencimientoActual
            : ahora;

        const sql = "INSERT INTO Membresia (FechaPago, MontoPagado, id_usuario) VALUES (?, 10.00, ?)";
        db.query(sql, [inicioEfectivo, id_usuario], (err) => {
            if (err) return res.status(500).send("Error al registrar pago");
            db.query("UPDATE Comprador SET PuedeAdquirir = 1 WHERE id_usuario = ?", [id_usuario], (err) => {
                if (err) console.error('Error activando PuedeAdquirir:', err.message);
                res.send("Membresía renovada.");
            });
        });
    });
});

// ==========================================
// 6. REPORTES Y CONSULTAS
// ==========================================

router.get('/consultas/obras-vendidas', (req, res) => {
    const { fecha_inicio, fecha_fin } = req.query;
    const sql = "SELECT f.id_factura, f.id_obra, o.Nombre AS Obra, f.Total_Pagado, COALESCE(DATE_FORMAT(f.Fecha_Venta, '%Y-%m-%d'), '—') AS Fecha FROM Factura f JOIN Obra o ON f.id_obra = o.id_Obra WHERE COALESCE(DATE(f.Fecha_Venta), CURDATE()) BETWEEN ? AND ? ORDER BY f.Fecha_Venta DESC";
    db.query(sql, [fecha_inicio, fecha_fin], (err, results) => {
        if (err) return res.status(500).send(err.message);
        res.json(results);
    });
});

router.get('/consultas/resumen-facturacion', (req, res) => {
    const { fecha_inicio, fecha_fin } = req.query;
    const sql = "SELECT f.id_factura, COALESCE(DATE_FORMAT(f.Fecha_Venta, '%Y-%m-%d'), '—') AS Fecha, o.Nombre AS Obra, f.Monto_Neto AS Precio_Obra, f.Porcentaje_Comision AS Porcentaje_Museo, f.Ganancia_Museo_USD AS Ganancia_Museo, f.Total_Pagado AS Total_Recaudado FROM Factura f JOIN Obra o ON f.id_obra = o.id_Obra WHERE COALESCE(DATE(f.Fecha_Venta), CURDATE()) BETWEEN ? AND ? ORDER BY f.Fecha_Venta DESC";
    db.query(sql, [fecha_inicio, fecha_fin], (err, results) => {
        if (err) return res.status(500).send(err.message);
        res.json(results);
    });
});

router.get('/consultas/resumen-membresias', (req, res) => {
    const { fecha_inicio, fecha_fin } = req.query;
    const sql = "SELECT m.idMembresia, u.Email, DATE_FORMAT(m.FechaPago, '%Y-%m-%d') AS FechaPago, m.MontoPagado FROM Membresia m JOIN Usuario u ON m.id_usuario = u.id_usuario WHERE DATE(m.FechaPago) BETWEEN ? AND ? ORDER BY m.FechaPago DESC";
    db.query(sql, [fecha_inicio, fecha_fin], (err, results) => {
        if (err) {
            console.error('Error en reporte de membresías:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// ==========================================
// 7. RUTAS PARA ENVÍOS (VERSIÓN SIMPLIFICADA)
// ==========================================

// Obtener datos de una factura específica para el envío (SIN columnas de dirección)
router.get('/api/factura/:id', (req, res) => {
    const idFactura = req.params.id;
    console.log('Buscando factura ID:', idFactura);
    
    const query = `
        SELECT f.*, u.Nombre, u.Apellido, u.Email,
               c.Cedula,
               COALESCE(NULLIF(f.NombreComprador,''), CONCAT(u.Nombre,' ',u.Apellido)) as CompradorNombre,
               COALESCE(NULLIF(f.EmailComprador,''), u.Email) as CompradorEmail,
               COALESCE(NULLIF(f.CedulaComprador,''), c.Cedula) as CompradorCedula,
               o.Nombre as nombre_obra, o.Precio
        FROM Factura f
        INNER JOIN Usuario u ON f.id_comprador = u.id_usuario
        LEFT JOIN Comprador c ON u.id_usuario = c.id_usuario
        INNER JOIN Obra o ON f.id_obra = o.id_Obra
        WHERE f.id_factura = ?
    `;
    
    db.query(query, [idFactura], (err, results) => {
        if (err) {
            console.error('Error obteniendo factura:', err);
            return res.status(500).json({ success: false, message: 'Error en BD' });
        }
        
        console.log('Resultados factura:', results);
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Factura no encontrada' });
        }
        
        const factura = results[0];
        
        // Obtener dirección de envío si existe
        const dirQuery = "SELECT * FROM Envio WHERE Factura_id_Factura = ? ORDER BY id_Envio DESC LIMIT 1";
        db.query(dirQuery, [idFactura], (errDir, dirResults) => {
            const envio = dirResults && dirResults.length > 0 ? dirResults[0] : null;
            const direccion = envio ? {
                municipio: envio.Municipio || '',
                parroquia: envio.Parroquia || '',
                direccion: envio.Calle || ''
            } : null;
            
            res.json({ 
                success: true, 
                factura, 
                direccion,
                numero_guia: envio ? envio.numero_guia : null
            });
        });
    });
});

// Registrar un nuevo envío (versión con textos)
router.post('/api/registrar-envio', (req, res) => {
    let { id_factura, estado, municipio, parroquia, direccion_detallada, numero_guia } = req.body;
    
    if (!numero_guia || numero_guia.trim() === '') {
        const rand = String(Math.floor(1000 + Math.random() * 9000));
        numero_guia = `MUS-${String(id_factura).padStart(6,'0')}-${rand}`;
    }
    
    console.log('Datos recibidos en /api/registrar-envio:', req.body);
    
    if (!id_factura) {
        return res.status(400).json({ 
            success: false, 
            message: 'ID de factura es requerido' 
        });
    }
    
    if (!municipio || !parroquia || !direccion_detallada) {
        return res.status(400).json({ 
            success: false, 
            message: 'Todos los campos de dirección son obligatorios' 
        });
    }
    
    const checkFacturaQuery = 'SELECT id_factura, Total_Pagado FROM Factura WHERE id_factura = ?';
    db.query(checkFacturaQuery, [id_factura], (err, facturaResults) => {
        if (err) {
            console.error('Error verificando factura:', err);
            return res.status(500).json({ success: false, message: 'Error en BD' });
        }
        
        if (facturaResults.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'La factura no existe' 
            });
        }
        
        const factura = facturaResults[0];
        
        const checkQuery = 'SELECT id_Envio FROM Envio WHERE Factura_id_Factura = ?';
        db.query(checkQuery, [id_factura], (err, results) => {
            if (err) {
                console.error('Error verificando envío:', err);
                return res.status(500).json({ success: false, message: 'Error en BD' });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Esta factura ya tiene un envío registrado' 
                });
            }
            
            const insertEnvio = () => {
                const insertQuery = `
                    INSERT INTO Envio (Factura_id_Factura, Monto_total, Estado_entrega, Municipio, Parroquia, Calle, numero_guia, fecha_envio) 
                    VALUES (?, ?, 'En proceso', ?, ?, ?, ?, NOW())
                `;
                db.query(insertQuery, [id_factura, factura.Total_Pagado || 0, municipio, parroquia, direccion_detallada, numero_guia], (err2, result) => {
                    if (err2) {
                        console.error('Error registrando envío:', err2);
                        return res.status(500).json({ success: false, message: 'Error al registrar el envío: ' + err2.message });
                    }
                    res.json({ success: true, message: 'Envío registrado exitosamente', id_envio: result.insertId, numero_guia });
                });
            };

            // Asegurar que las columnas adicionales existan
            db.query("SHOW COLUMNS FROM Envio LIKE 'numero_guia'", (err, colResults) => {
                if (colResults && colResults.length === 0) {
                    db.query("ALTER TABLE Envio ADD COLUMN numero_guia varchar(45) DEFAULT NULL, ADD COLUMN fecha_envio datetime DEFAULT NULL, MODIFY COLUMN Estado_entrega enum('En proceso','Enviado','Entregado') DEFAULT 'En proceso'", (alterErr) => {
                        insertEnvio();
                    });
                } else {
                    insertEnvio();
                }
            });
        });
    });
});

// ==========================================
// 8. RUTAS PARA DATOS GEOGRÁFICOS
// ==========================================

    router.get('/api/estados', (req, res) => {
        db.query("SELECT id_estado, nombre FROM Estado ORDER BY nombre", (err, results) => {
            if (err) {
                console.error('Error obteniendo estados:', err);
                return res.status(500).json({ success: false, message: 'Error en BD' });
            }
            res.json({ success: true, estados: results });
        });
    });


    router.get('/api/municipios/:id_estado', (req, res) => {
        const { id_estado } = req.params;
        db.query(
            "SELECT id_municipio, nombre FROM Municipio WHERE id_estado = ? ORDER BY nombre", 
            [id_estado], 
            (err, results) => {
                if (err) {
                    console.error('Error obteniendo municipios:', err);
                    return res.status(500).json({ success: false, message: 'Error en BD' });
                }
                res.json({ success: true, municipios: results });
            }
        );
    });


    router.get('/api/parroquias/:id_municipio', (req, res) => {
        const { id_municipio } = req.params;
        db.query(
            "SELECT id_parroquia, nombre FROM Parroquia WHERE id_municipio = ? ORDER BY nombre", 
            [id_municipio], 
            (err, results) => {
                if (err) {
                    console.error('Error obteniendo parroquias:', err);
                    return res.status(500).json({ success: false, message: 'Error en BD' });
                }
                res.json({ success: true, parroquias: results });
            }
        );
    });


// ==========================================
// 8.5 GESTIÓN DE OBRAS (MongoDB)
// ==========================================

router.get('/api/obras-admin', async (req, res) => {
    try {
        const obras = await Obra.find().sort({ _id: 1 }).lean();
        res.json(obras.map(o => ({
            id: o._id,
            nombre: o.nombre,
            fecha_creacion: o.fecha_creacion ? o.fecha_creacion.toISOString().split('T')[0] : '',
            precio: o.precio,
            estado_obra: o.estado_obra,
            fotografia: o.fotografia || '',
            genero_nombre: o.genero?.nombre || '',
            autores_ids: o.autores || []
        })));
    } catch (err) {
        console.error('Error obteniendo obras:', err);
        res.status(500).json({ success: false, message: 'Error al obtener obras' });
    }
});

router.post('/api/obras-admin', async (req, res) => {
    try {
        const { nombre, fecha_creacion, precio, estado_obra, fotografia, genero_nombre, autores_ids, fotografia_base64, fotografia_nombre } = req.body;
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ success: false, message: 'El nombre de la obra es requerido' });
        }
        if (!precio || isNaN(precio)) {
            return res.status(400).json({ success: false, message: 'El precio es requerido' });
        }

        let rutaFoto = fotografia || '';

        if (fotografia_base64) {
            const matches = fotografia_base64.match(/^data:image\/(\w+);base64,(.+)$/);
            if (matches) {
                const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
                const buffer = Buffer.from(matches[2], 'base64');
                const fileName = `${Date.now()}-${fotografia_nombre || `imagen.${ext}`}`;
                const filePath = path.join(__dirname, '..', 'assets', 'images', 'art_previews', fileName);
                require('fs').writeFileSync(filePath, buffer);
                rutaFoto = `/images/art_previews/${fileName}`;
            }
        }

        const maxId = await Obra.findOne().sort({ _id: -1 }).select('_id').lean();
        const newId = (maxId ? maxId._id : 0) + 1;

        const obra = new Obra({
            _id: newId,
            nombre: nombre.trim(),
            fecha_creacion: fecha_creacion || undefined,
            precio: parseFloat(precio),
            estado_obra: estado_obra || 'Disponible',
            fotografia: rutaFoto,
            genero: {
                nombre: genero_nombre || 'General'
            },
            autores: autores_ids || []
        });

        await obra.save();

        // Sync to MySQL
        try {
            const generoMap = { 'Pintura': 1, 'Escultura': 2, 'Fotografía': 3, 'Orfebreria': 4, 'Ceramica': 5 };
            const idGenero = generoMap[genero_nombre] || null;
            db.query("SET FOREIGN_KEY_CHECKS = 0");
            db.query(
                "INSERT INTO Obra (id_Obra, Nombre, Fecha_creacion, Precio, Estado_obra, id_Genero, Fotografia) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE Nombre = VALUES(Nombre), Precio = VALUES(Precio), Estado_obra = VALUES(Estado_obra)",
                [newId, nombre.trim(), fecha_creacion || null, parseFloat(precio), estado_obra || 'Disponible', idGenero, rutaFoto || '']
            );
            db.query("SET FOREIGN_KEY_CHECKS = 1");
        } catch (mysqlErr) {
            console.error('Error MySQL al crear obra:', mysqlErr.message);
        }

        res.json({ success: true, message: 'Obra agregada correctamente', id: newId });
    } catch (err) {
        console.error('Error creando obra:', err);
        res.status(500).json({ success: false, message: 'Error al crear obra' });
    }
});

router.put('/api/obras-admin/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { nombre, precio, estado_obra } = req.body;

        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ success: false, message: 'El nombre es requerido' });
        }

        const obra = await Obra.findById(id);
        if (!obra) {
            return res.status(404).json({ success: false, message: 'Obra no encontrada' });
        }

        const estadoAnterior = obra.estado_obra;

        obra.nombre = nombre.trim();
        obra.precio = parseFloat(precio);
        obra.estado_obra = estado_obra || 'Disponible';
        await obra.save();

        // Also update MySQL
        try {
            db.query(
                "UPDATE Obra SET Nombre = ?, Precio = ?, Estado_obra = ? WHERE id_Obra = ?",
                [nombre.trim(), parseFloat(precio), estado_obra || 'Disponible', id]
            );
        } catch (mysqlErr) {
            console.error('Error MySQL:', mysqlErr.message);
        }

        if (estadoAnterior !== obra.estado_obra) {
            try {
                const { client } = require('../config/cassandra');
                await client.execute(
                    `INSERT INTO historial_estatus_obra
                     (id_obra, fecha_cambio, estatus_anterior, estatus_nuevo, modificado_por, motivo)
                     VALUES (?, toTimestamp(now()), ?, ?, ?, ?)`,
                    [id, estadoAnterior, obra.estado_obra, 'admin', 'Actualización desde panel'],
                    { prepare: true }
                );
            } catch (cassErr) {
                console.error('Error Cassandra:', cassErr.message);
            }
        }

        res.json({ success: true, message: 'Obra actualizada correctamente' });
    } catch (err) {
        console.error('Error actualizando obra:', err);
        res.status(500).json({ success: false, message: 'Error al actualizar obra' });
    }
});

router.delete('/api/obras-admin/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await Obra.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Obra no encontrada' });
        }

        // Sync MySQL
        try {
            db.query("DELETE FROM Obra WHERE id_Obra = ?", [id]);
        } catch (mysqlErr) {
            console.error('Error MySQL al eliminar obra:', mysqlErr.message);
        }

        res.json({ success: true, message: 'Obra eliminada correctamente' });
    } catch (err) {
        console.error('Error eliminando obra:', err);
        res.status(500).json({ success: false, message: 'Error al eliminar obra' });
    }
});

// ==========================================
// 8.7 GESTIÓN DE ESPECIALIZACIONES (MongoDB)
// ==========================================

router.put('/api/obras-admin/:id/detalles', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { detalles } = req.body;

        if (!detalles || typeof detalles !== 'object') {
            return res.status(400).json({ success: false, message: 'Debe proporcionar un objeto de detalles válido' });
        }

        const obra = await Obra.findById(id);
        if (!obra) {
            return res.status(404).json({ success: false, message: 'Obra no encontrada' });
        }

        obra.genero.detalles = detalles;
        await obra.save();

        res.json({ success: true, message: 'Detalles de obra actualizados correctamente' });
    } catch (err) {
        console.error('Error actualizando detalles de obra:', err);
        res.status(500).json({ success: false, message: 'Error al actualizar detalles de obra' });
    }
});

// ==========================================
// 8.8 NACIONALIDADES (MongoDB)
// ==========================================

router.get('/api/nacionalidades', async (req, res) => {
    try {
        const nacionalidades = await Nacionalidad.find().sort({ _id: 1 }).lean();
        res.json(nacionalidades.map(n => ({ id: n._id, descripcion: n.nombre })));
    } catch (err) {
        console.error('Error obteniendo nacionalidades:', err);
        res.status(500).json({ success: false, message: 'Error al obtener nacionalidades' });
    }
});

// ==========================================
// 9. GESTIÓN DE GÉNEROS (MongoDB)
// ==========================================

router.get('/api/generos', async (req, res) => {
    try {
        const [generos, espDocs] = await Promise.all([
            Genero.find().sort({ _id: 1 }).lean(),
            mongoose.connection.db.collection('especializaciones').find().toArray()
        ]);
        const espMap = {};
        espDocs.forEach(e => { espMap[e.nombre] = e.atributos || []; });
        res.json(generos.map(g => ({
            id: g._id,
            nombre: g.nombre,
            atributos: (g.atributos && g.atributos.length) ? g.atributos : (espMap[g.nombre] || [])
        })));
    } catch (err) {
        console.error('Error obteniendo géneros:', err);
        res.status(500).json({ success: false, message: 'Error al obtener géneros' });
    }
});

router.post('/api/generos', async (req, res) => {
    try {
        const { nombre, atributos } = req.body;
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ success: false, message: 'El nombre del género es requerido' });
        }

        const existente = await Genero.findOne({ nombre: nombre.trim() });
        if (existente) {
            return res.status(400).json({ success: false, message: 'El género ya existe' });
        }

        const maxId = await Genero.findOne().sort({ _id: -1 }).select('_id').lean();
        const newId = (maxId ? maxId._id : 0) + 1;

        const genero = new Genero({
            _id: newId,
            nombre: nombre.trim(),
            atributos: Array.isArray(atributos) ? atributos : []
        });

        await genero.save();
        res.json({ success: true, message: 'Género agregado correctamente', id: newId });
    } catch (err) {
        console.error('Error creando género:', err);
        res.status(500).json({ success: false, message: 'Error al crear género' });
    }
});

router.put('/api/generos/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { nombre, atributos } = req.body;

        const update = {};
        if (nombre && nombre.trim()) update.nombre = nombre.trim();
        if (atributos !== undefined) update.atributos = Array.isArray(atributos) ? atributos : [];

        const result = await Genero.findByIdAndUpdate(id, update, { new: true });
        if (!result) {
            return res.status(404).json({ success: false, message: 'Género no encontrado' });
        }
        res.json({ success: true, message: 'Género actualizado correctamente' });
    } catch (err) {
        console.error('Error actualizando género:', err);
        res.status(500).json({ success: false, message: 'Error al actualizar género' });
    }
});

router.delete('/api/generos/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await Genero.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Género no encontrado' });
        }
        res.json({ success: true, message: 'Género eliminado correctamente' });
    } catch (err) {
        console.error('Error eliminando género:', err);
        res.status(500).json({ success: false, message: 'Error al eliminar género' });
    }
});

// ==========================================
// 10. GESTIÓN DE AUTORES (MongoDB)
// ==========================================

router.get('/api/autores-admin', async (req, res) => {
    try {
        const autores = await Autor.find().sort({ _id: 1 }).lean();
        res.json(autores.map(a => ({
            id: a._id,
            nombre: a.nombre,
            apellido: a.apellido,
            nacionalidad: a.nacionalidad || '',
            biografia: a.biografia || '',
            fotografia: a.fotografia || ''
        })));
    } catch (err) {
        console.error('Error obteniendo autores:', err);
        res.status(500).json({ success: false, message: 'Error al obtener autores' });
    }
});

router.post('/api/autores-admin', async (req, res) => {
    try {
        const { nombre, apellido, nacionalidad, biografia, fotografia_base64, fotografia_nombre } = req.body;
        if (!nombre || !nombre.trim() || !apellido || !apellido.trim()) {
            return res.status(400).json({ success: false, message: 'Nombre y apellido son requeridos' });
        }

        let rutaFoto = '';

        if (fotografia_base64) {
            const matches = fotografia_base64.match(/^data:image\/(\w+);base64,(.+)$/);
            if (matches) {
                const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
                const buffer = Buffer.from(matches[2], 'base64');
                const fileName = `${Date.now()}-${fotografia_nombre || `imagen.${ext}`}`;
                const filePath = path.join(__dirname, '..', 'assets', 'images', 'authors', fileName);
                require('fs').writeFileSync(filePath, buffer);
                rutaFoto = `/images/authors/${fileName}`;
            }
        }

        const maxId = await Autor.findOne().sort({ _id: -1 }).select('_id').lean();
        const newId = (maxId ? maxId._id : 0) + 1;

        const autor = new Autor({
            _id: newId,
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            nacionalidad: nacionalidad ? nacionalidad.trim() : '',
            biografia: biografia ? biografia.trim() : '',
            fotografia: rutaFoto
        });

        await autor.save();
        res.json({ success: true, message: 'Autor agregado correctamente', id: newId });
    } catch (err) {
        console.error('Error creando autor:', err);
        res.status(500).json({ success: false, message: 'Error al crear autor' });
    }
});

router.delete('/api/autores-admin/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await Autor.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Autor no encontrado' });
        }
        res.json({ success: true, message: 'Autor eliminado correctamente' });
    } catch (err) {
        console.error('Error eliminando autor:', err);
        res.status(500).json({ success: false, message: 'Error al eliminar autor' });
    }
});

// ==========================================
// 11. CONSULTAS CASSANDRA (Sprint 2)
// ==========================================

// Q1: Obras vendidas en un período
router.get('/cassandra/obras-vendidas', async (req, res) => {
    try {
        const { anio_mes } = req.query;
        if (!anio_mes) {
            return res.status(400).json({ success: false, message: 'anio_mes requerido (ej: 2026-01)' });
        }
        const result = await client.execute(
            'SELECT * FROM obras_vendidas_por_periodo WHERE anio_mes = ?',
            [anio_mes]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error consultando obras vendidas (Cassandra):', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Q1b: Obras vendidas en múltiples meses
router.get('/cassandra/obras-vendidas-rango', async (req, res) => {
    try {
        const meses = req.query.meses;
        if (!meses) {
            return res.status(400).json({ success: false, message: 'meses requerido (ej: 2026-01,2026-02)' });
        }
        const listaMeses = meses.split(',');
        const results = [];
        for (const mes of listaMeses) {
            const result = await client.execute(
                'SELECT * FROM obras_vendidas_por_periodo WHERE anio_mes = ?',
                [mes.trim()]
            );
            results.push(...result.rows);
        }
        results.sort((a, b) => new Date(b.fecha_venta) - new Date(a.fecha_venta));
        res.json({ success: true, data: results });
    } catch (err) {
        console.error('Error consultando rango obras vendidas (Cassandra):', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Q2: Resumen de facturación mensual
router.get('/cassandra/resumen-facturacion', async (req, res) => {
    try {
        const { anio_mes } = req.query;
        if (!anio_mes) {
            const result = await client.execute('SELECT * FROM resumen_facturacion_mensual');
            return res.json({ success: true, data: result.rows });
        }
        const result = await client.execute(
            'SELECT * FROM resumen_facturacion_mensual WHERE anio_mes = ?',
            [anio_mes]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error consultando resumen facturación (Cassandra):', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Q3: Bitácora de seguridad por usuario
router.get('/cassandra/bitacora-seguridad', async (req, res) => {
    try {
        const { id_usuario, tipo_evento } = req.query;
        if (id_usuario && tipo_evento) {
            const result = await client.execute(
                'SELECT * FROM bitacora_seguridad WHERE id_usuario = ? AND tipo_evento = ? ALLOW FILTERING',
                [parseInt(id_usuario), tipo_evento]
            );
            return res.json({ success: true, data: result.rows });
        }
        if (id_usuario) {
            const result = await client.execute(
                'SELECT * FROM bitacora_seguridad WHERE id_usuario = ?',
                [parseInt(id_usuario)]
            );
            return res.json({ success: true, data: result.rows });
        }
        res.status(400).json({ success: false, message: 'id_usuario requerido' });
    } catch (err) {
        console.error('Error consultando bitácora (Cassandra):', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Todos los logs de seguridad (enriquecidos con nombre de usuario desde MySQL)
router.get('/api/logs-seguridad', async (req, res) => {
    try {
        const result = await client.execute(
            'SELECT * FROM bitacora_seguridad ALLOW FILTERING'
        );
        const rows = result.rows;

        const idsUnicos = [...new Set(rows.map(r => r.id_usuario))];
        const nombreMap = {};

        if (idsUnicos.length > 0) {
            const placeholders = idsUnicos.map(() => '?').join(',');
            const [usuarios] = await db.promise().query(
                `SELECT id_usuario, Nombre, Apellido FROM Usuario WHERE id_usuario IN (${placeholders})`,
                idsUnicos
            );
            usuarios.forEach(u => {
                nombreMap[u.id_usuario] = `${u.Nombre} ${u.Apellido}`;
            });
        }

        const logs = rows.map(r => ({
            id_usuario: r.id_usuario,
            nombre_usuario: nombreMap[r.id_usuario] || `Usuario #${r.id_usuario}`,
            fecha_evento: r.fecha_evento,
            tipo_evento: r.tipo_evento,
            descripcion: r.descripcion,
            ip_origen: r.ip_origen,
            dispositivo: r.dispositivo
        }));

        logs.sort((a, b) => new Date(b.fecha_evento) - new Date(a.fecha_evento));

        res.json({ success: true, data: logs });
    } catch (err) {
        console.error('Error consultando logs de seguridad:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Q4: Obras con cambios de estatus registrados en Cassandra
router.get('/cassandra/obras-con-historial', async (req, res) => {
    try {
        const result = await client.execute('SELECT DISTINCT id_obra FROM historial_estatus_obra');
        const ids = result.rows.map(r => r.id_obra);
        if (ids.length === 0) return res.json({ success: true, data: [] });

        const placeholders = ids.map(() => '?').join(',');
        const [obraRows] = await db.promise().query(
            `SELECT id_Obra, Nombre, Estado_obra FROM Obra WHERE id_Obra IN (${placeholders})`, ids
        );
        const obraMap = {};
        obraRows.forEach(o => obraMap[o.id_Obra] = { nombre: o.Nombre, estado_actual: o.Estado_obra });

        const enriched = ids.map(id => ({
            id_obra: id,
            nombre_obra: obraMap[id]?.nombre || `Obra #${id}`,
            estado_actual: obraMap[id]?.estado_actual || 'Desconocido'
        }));
        enriched.sort((a, b) => a.id_obra - b.id_obra);
        res.json({ success: true, data: enriched });
    } catch (err) {
        console.error('Error consultando obras con historial:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Q4: Historial de estatus de obra(s)
router.get('/cassandra/historial-estatus-obra', async (req, res) => {
    try {
        const { id_obra } = req.query;

        let rows;
        if (id_obra) {
            const result = await client.execute(
                'SELECT * FROM historial_estatus_obra WHERE id_obra = ?',
                [parseInt(id_obra)]
            );
            rows = result.rows;
        } else {
            res.status(400).json({ success: false, message: 'id_obra requerido' });
            return;
        }

        const enriched = await Promise.all(rows.map(async (row) => {
            let nombreObra = `Obra #${row.id_obra}`;
            try {
                const [obraRows] = await db.promise().query(
                    'SELECT Nombre FROM Obra WHERE id_Obra = ?', [row.id_obra]
                );
                if (obraRows.length > 0) nombreObra = obraRows[0].Nombre;
            } catch { }
            return {
                id_obra: row.id_obra,
                nombre_obra: nombreObra,
                fecha_cambio: row.fecha_cambio,
                estatus_anterior: row.estatus_anterior,
                estatus_nuevo: row.estatus_nuevo,
                modificado_por: row.modificado_por,
                motivo: row.motivo
            };
        }));

        res.json({ success: true, data: enriched });
    } catch (err) {
        console.error('Error consultando historial estatus (Cassandra):', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});



// ==========================================
// 12. ESCRITURA EN CASSANDRA (Sprint 2)
// ==========================================

// Registrar evento en bitácora de seguridad
router.post('/cassandra/registrar-evento-seguridad', async (req, res) => {
    try {
        const { id_usuario, tipo_evento, descripcion, ip_origen, dispositivo } = req.body;
        if (!id_usuario || !tipo_evento) {
            return res.status(400).json({ success: false, message: 'id_usuario y tipo_evento requeridos' });
        }
        await client.execute(
            `INSERT INTO bitacora_seguridad (id_usuario, fecha_evento, tipo_evento, descripcion, ip_origen, dispositivo)
             VALUES (?, toTimestamp(now()), ?, ?, ?, ?)`,
            [parseInt(id_usuario), tipo_evento, descripcion || '', ip_origen || req.ip || '', dispositivo || req.headers['user-agent'] || '']
        );
        res.json({ success: true, message: 'Evento registrado en bitácora' });
    } catch (err) {
        console.error('Error registrando evento seguridad (Cassandra):', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Registrar cambio de estatus de obra
router.post('/cassandra/registrar-cambio-estatus', async (req, res) => {
    try {
        const { id_obra, estatus_anterior, estatus_nuevo, modificado_por, motivo } = req.body;
        if (!id_obra || !estatus_anterior || !estatus_nuevo) {
            return res.status(400).json({ success: false, message: 'id_obra, estatus_anterior y estatus_nuevo requeridos' });
        }
        await client.execute(
            `INSERT INTO historial_estatus_obra (id_obra, fecha_cambio, estatus_anterior, estatus_nuevo, modificado_por, motivo)
             VALUES (?, toTimestamp(now()), ?, ?, ?, ?)`,
            [parseInt(id_obra), estatus_anterior, estatus_nuevo, modificado_por ? parseInt(modificado_por) : null, motivo || '']
        );
        res.json({ success: true, message: 'Cambio de estatus registrado' });
    } catch (err) {
        console.error('Error registrando cambio estatus (Cassandra):', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});



// Buscar comprador por email o cédula
router.post('/api/buscar-comprador', (req, res) => {
    const { email, cedula } = req.body;
    if (!email && !cedula) {
        return res.status(400).json({ success: false, message: "Debe proporcionar email o cédula" });
    }
    let sql = "SELECT u.id_usuario, u.Email, u.Nombre, u.Apellido, c.Cedula FROM Usuario u LEFT JOIN Comprador c ON u.id_usuario = c.id_usuario WHERE";
    const params = [];
    const conditions = [];
    if (email) { conditions.push("u.Email = ?"); params.push(email); }
    if (cedula) { conditions.push("c.Cedula = ?"); params.push(cedula); }
    sql += " " + conditions.join(" OR ") + " LIMIT 1";
    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (results.length === 0) return res.json({ success: true, found: false, message: "Usuario no encontrado" });
        res.json({ success: true, found: true, usuario: results[0] });
    });
});

module.exports = router;