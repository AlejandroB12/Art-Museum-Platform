const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const db = require('../config/database');
const path = require('path');

require('dotenv').config();

const Genero = require('../models/Genero');
const Autor = require('../models/Autor');
const Obra = require('../models/Obra');
const Especializacion = require('../models/Especializacion');
const Nacionalidad = require('../models/Nacionalidad');

const { client } = require('../config/cassandra');

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
                    res.redirect('/admin/Mensaje-exitoso.html');
                    //res.sendFile(path.join(__dirname, 'admin', 'Mensaje-exitoso.html'));
                });
            });
        });
    });
});
router.post('/admin-auth', (req, res) => {
    const { "admin-user": username, "admin-password": password } = req.body;
    const sql = "SELECT * FROM Usuario WHERE Email = ? AND Contraseña = ? AND Rol = 'administrador'";
    
    db.query(sql, [username, password], (err, results) => {
        if (err) return res.status(500).send("Error en el servidor");
        if (results.length > 0) {
            req.session.id_usuario = results[0].id_usuario;
            res.redirect('/admin/Panel-adminsitrador.html');
        } else {
            res.redirect('/admin/Credenciales-incorrectas-administrador.html');
        }
    });
});

// ==========================================
// 2. GESTIÓN DE USUARIOS (CRUD Y APROBACIÓN)
// ==========================================

router.get('/api/todos-los-usuarios', (req, res) => {
    db.query("SELECT id_usuario, Email, Rol, Estatus FROM Usuario", (err, results) => {
        if (err) return res.status(500).json([]);
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
                                                        <a href="http://localhost:3000/user/Login.html" style="color:#121212; font-size:14px; font-weight:700; text-decoration:none; text-transform:uppercase; letter-spacing:1.5px; display:inline-block;">Iniciar Sesión</a>
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

router.get('/api/obras-reservadas', (req, res) => {
    const sql = "SELECT id_Obra, Nombre, Precio FROM Obra WHERE Estado_obra = 'Reservado'";
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error obteniendo obras reservadas:', err);
            return res.status(500).json([]);
        }
        res.json(results);
    });
});

router.post('/generar-factura', (req, res) => {
    const { id_obra, id_admin, precio_neto, porcentaje_comision } = req.body;
    const adminId = req.session?.id_usuario || id_admin;
    
    if (!id_obra || !adminId || !precio_neto || !porcentaje_comision) {
        return res.status(400).json({ 
            success: false, 
            message: "Faltan datos requeridos (ID de administrador no disponible)" 
        });
    }
    
    db.beginTransaction((err) => {
        if (err) {
            console.error('Error al iniciar transacción:', err);
            return res.status(500).json({ 
                success: false, 
                message: "Error al iniciar transacción" 
            });
        }
        
        const sqlVerificarObra = "SELECT Estado_obra FROM Obra WHERE id_Obra = ?";
        db.query(sqlVerificarObra, [id_obra], (err, obraResults) => {
            if (err) {
                return db.rollback(() => res.status(500).json({ 
                    success: false, 
                    message: "Error verificando obra" 
                }));
            }
            
            if (obraResults.length === 0) {
                return db.rollback(() => res.status(404).json({ 
                    success: false, 
                    message: "La obra no existe" 
                }));
            }
            
            if (obraResults[0].Estado_obra !== 'Reservado') {
                return db.rollback(() => res.status(400).json({ 
                    success: false, 
                    message: "La obra no está en estado Reservado" 
                }));
            }
            
            const sqlDatosObra = "SELECT Nombre FROM Obra WHERE id_Obra = ?";
            db.query(sqlDatosObra, [id_obra], (err, obraDatos) => {
                if (err) {
                    return db.rollback(() => res.status(500).json({ 
                        success: false, 
                        message: "Error obteniendo datos de la obra" 
                    }));
                }
                
                const sqlComprador = "SELECT id_usuario FROM Reserva WHERE id_obra = ?";
                db.query(sqlComprador, [id_obra], (err, compradorResults) => {
                    if (err) {
                        console.error('Error obteniendo comprador:', err);
                        return db.rollback(() => res.status(500).json({ 
                            success: false, 
                            message: "Error obteniendo datos del comprador" 
                        }));
                    }
                    
                    let id_comprador;
                    
                    const procesarComprador = (id_comp) => {
                        const sqlDatosComprador = `
                            SELECT u.Email, u.Nombre, u.Apellido, c.Cedula
                            FROM Usuario u
                            LEFT JOIN Comprador c ON u.id_usuario = c.id_usuario
                            WHERE u.id_usuario = ?
                        `;
                        
                        db.query(sqlDatosComprador, [id_comp], (err, compradorDatos) => {
                            if (err) {
                                console.error('Error obteniendo datos del comprador:', err);
                                return db.rollback(() => res.status(500).json({ 
                                    success: false, 
                                    message: "Error obteniendo datos del comprador" 
                                }));
                            }
                            
                            const comprador = compradorDatos[0] || {};
                            const nombreComprador = comprador.Nombre && comprador.Apellido ? 
                                `${comprador.Nombre} ${comprador.Apellido}` : 'No disponible';
                            
                            const iva = parseFloat(precio_neto) * 0.12;
                            const gananciaMuseo = parseFloat(precio_neto) * (parseFloat(porcentaje_comision) / 100);
                            const total = parseFloat(precio_neto) + iva;
                            
                            const sqlFactura = `
                                INSERT INTO Factura 
                                (Monto_Neto, IVA, Total_Pagado, Ganancia_Museo_USD, Porcentaje_Comision, id_obra, id_comprador, id_admin) 
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                            `;
                            
                            db.query(sqlFactura, [
                                precio_neto, 
                                iva, 
                                total, 
                                gananciaMuseo, 
                                porcentaje_comision, 
                                id_obra, 
                                id_comp, 
                                adminId
                            ], (err, result) => {
                                if (err) {
                                    console.error('Error al generar factura:', err);
                                    return db.rollback(() => res.status(500).json({ 
                                        success: false, 
                                        message: "Error al generar factura: " + err.message 
                                    }));
                                }
                                
                                const idFactura = result.insertId;
                                
                                db.query("UPDATE Obra SET Estado_obra = 'Vendida' WHERE id_Obra = ?", [id_obra], (err) => {
                                    if (err) {
                                        console.error('Error al actualizar obra:', err);
                                        return db.rollback(() => res.status(500).json({ 
                                            success: false, 
                                            message: "Error al actualizar obra: " + err.message 
                                        }));
                                    }
                                    
                                    db.query("DELETE FROM Reserva WHERE id_obra = ?", [id_obra], (err) => {
                                        if (err) {
                                            console.error('Error al eliminar reserva:', err);
                                            console.warn('La reserva no pudo ser eliminada automáticamente');
                                        }
                                        
                                            db.commit(async (err) => {
                                                if (err) {
                                                    console.error('Error al confirmar transacción:', err);
                                                    return db.rollback(() => res.status(500).json({ 
                                                        success: false, 
                                                        message: "Error al confirmar" 
                                                    }));
                                                }

                                                try {
                                                    const fecha = new Date();
                                                    const anioMes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

                                                    await client.batch([
                                                        {
                                                            query: `INSERT INTO obras_vendidas_por_periodo
                                                                    (anio_mes, fecha_venta, id_factura, id_obra, nombre_obra, precio_venta, iva,
                                                                     total_pagado, ganancia_museo_usd, porcentaje_comision, id_comprador,
                                                                     comprador_nombre, comprador_apellido, comprador_email, comprador_cedula,
                                                                     id_admin, admin_nombre)
                                                                    VALUES (?, toTimestamp(now()), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                                            params: [anioMes, idFactura, id_obra, obraDatos[0]?.Nombre || '', precio_neto, iva, total,
                                                                     gananciaMuseo, porcentaje_comision, id_comp, comprador.Nombre || '',
                                                                     comprador.Apellido || '', comprador.Email || '', comprador.Cedula || null,
                                                                     adminId, 'Admin']
                                                         },
                                                         {
                                                             query: `INSERT INTO historial_estatus_obra
                                                                     (id_obra, fecha_cambio, estatus_anterior, estatus_nuevo, modificado_por, motivo)
                                                                     VALUES (?, toTimestamp(now()), ?, ?, ?, ?)`,
                                                             params: [id_obra, 'Reservado', 'Vendida', adminId, `Pago completado - Factura #${idFactura}`]
                                                        }
                                                    ], { prepare: true });
                                                } catch (cassErr) {
                                                    console.error('Error insertando en Cassandra:', cassErr.message);
                                                }
                                                
                                                res.json({ 
                                                    success: true, 
                                                    message: "Factura generada correctamente",
                                                    id_factura: idFactura,
                                                    mostrarEnvio: true,
                                                    datos: {
                                                        id_factura: idFactura,
                                                        id_obra: id_obra,
                                                        nombreObra: obraDatos[0]?.Nombre || 'No disponible',
                                                        id_comprador: id_comp,
                                                        nombreComprador: nombreComprador,
                                                        emailComprador: comprador.Email || 'No disponible',
                                                        cedulaComprador: comprador.Cedula || 'No disponible',
                                                        precio_neto: parseFloat(precio_neto),
                                                        iva: iva,
                                                        ganancia_museo: gananciaMuseo,
                                                        porcentaje_comision: parseFloat(porcentaje_comision),
                                                        total: total,
                                                        fecha: new Date().toLocaleDateString(),
                                                        hora: new Date().toLocaleTimeString()
                                                    }
                                                });
                                            });
                                    });
                                });
                            });
                        });
                    };
                    
                    if (compradorResults.length === 0) {
                        console.log('No hay reserva para la obra, buscando comprador por defecto...');
                        
                        const sqlBuscarComprador = "SELECT id_usuario FROM Usuario WHERE Rol = 'comprador' AND Estatus = 1 LIMIT 1";
                        
                        db.query(sqlBuscarComprador, (err, compradorDefault) => {
                            if (err || compradorDefault.length === 0) {
                                return db.rollback(() => res.status(400).json({ 
                                    success: false, 
                                    message: "No hay compradores disponibles en el sistema" 
                                }));
                            }
                            
                            id_comprador = compradorDefault[0].id_usuario;
                            
                            const sqlCrearReserva = "INSERT INTO Reserva (id_obra, id_usuario) VALUES (?, ?)";
                            db.query(sqlCrearReserva, [id_obra, id_comprador], (err) => {
                                if (err) {
                                    console.error('Error creando reserva:', err);
                                    return db.rollback(() => res.status(500).json({ 
                                        success: false, 
                                        message: "Error creando reserva automática" 
                                    }));
                                }
                                
                                console.log(`Reserva creada automáticamente para obra ${id_obra} con comprador ${id_comprador}`);
                                procesarComprador(id_comprador);
                            });
                        });
                    } else {
                        id_comprador = compradorResults[0].id_usuario;
                        procesarComprador(id_comprador);
                    }
                });
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

    db.beginTransaction((err) => {
        if (err) return res.status(500).send("Error");

        const sqlSolicitud = "UPDATE SolicitudPago SET Estatus = 'Aprobado' WHERE id_solicitud = ?";
        const sqlMembresia = "INSERT INTO Membresia (FechaPago, MontoPagado, id_usuario) VALUES (CURDATE(), 10.00, ?)";

        db.query(sqlSolicitud, [id_solicitud], (err) => {
            if (err) return db.rollback(() => res.status(500).send("Error en solicitud"));

            db.query(sqlMembresia, [id_usuario], (err) => {
                if (err) return db.rollback(() => res.status(500).send("Error en membresía"));
                
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

router.post('/registrar-nuevo-pago', (req, res) => {
    const { id_usuario } = req.body;
    const sql = "INSERT INTO Membresia (FechaPago, MontoPagado, id_usuario) VALUES (CURDATE(), 10.00, ?)";
    db.query(sql, [id_usuario], (err) => {
        if (err) return res.status(500).send("Error al registrar pago");
        res.send("Membresía renovada.");
    });
});

// ==========================================
// 6. REPORTES Y CONSULTAS
// ==========================================

router.get('/consultas/obras-vendidas', (req, res) => {
    const { fecha_inicio, fecha_fin } = req.query;
    const sql = "SELECT f.id_factura, f.id_obra, o.Nombre AS Obra, f.Total_Pagado, DATE_FORMAT(f.Fecha_Venta, '%Y-%m-%d') AS Fecha FROM Factura f JOIN Obra o ON f.id_obra = o.id_Obra WHERE DATE(f.Fecha_Venta) BETWEEN ? AND ? ORDER BY f.Fecha_Venta DESC";
    db.query(sql, [fecha_inicio, fecha_fin], (err, results) => {
        if (err) return res.status(500).send(err.message);
        res.json(results);
    });
});

router.get('/consultas/resumen-facturacion', (req, res) => {
    const { fecha_inicio, fecha_fin } = req.query;
    const sql = "SELECT f.id_factura, DATE_FORMAT(f.Fecha_Venta, '%Y-%m-%d') AS Fecha, o.Nombre AS Obra, f.Monto_Neto AS Precio_Obra, f.Porcentaje_Comision AS Porcentaje_Museo, f.Ganancia_Museo_USD AS Ganancia_Museo, f.Total_Pagado AS Total_Recaudado FROM Factura f JOIN Obra o ON f.id_obra = o.id_Obra WHERE DATE(f.Fecha_Venta) BETWEEN ? AND ? ORDER BY f.Fecha_Venta DESC";
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
        SELECT f.*, u.Email, c.Nombre, c.Apellido, c.Cedula,
               o.Nombre as nombre_obra, o.Precio
        FROM Factura f
        INNER JOIN Usuario u ON f.id_comprador = u.id_usuario
        INNER JOIN Comprador c ON u.id_usuario = c.id_usuario
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
        
        // Como no tenemos columnas de dirección, devolvemos direccion: null
        res.json({ 
            success: true, 
            factura, 
            direccion: null
        });
    });
});

// Registrar un nuevo envío (versión con textos)
router.post('/api/registrar-envio', (req, res) => {
    const { id_factura, estado, municipio, parroquia, direccion_detallada, numero_guia } = req.body;
    
    console.log('Datos recibidos en /api/registrar-envio:', req.body);
    
    if (!id_factura) {
        return res.status(400).json({ 
            success: false, 
            message: 'ID de factura es requerido' 
        });
    }
    
    if (!estado || !municipio || !parroquia || !direccion_detallada) {
        return res.status(400).json({ 
            success: false, 
            message: 'Todos los campos de dirección son obligatorios' 
        });
    }
    
    const checkFacturaQuery = 'SELECT id_factura FROM Factura WHERE id_factura = ?';
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
        
        const checkQuery = 'SELECT id_envio FROM Envio WHERE id_factura = ?';
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
            
            const insertQuery = `
                INSERT INTO Envio (id_factura, estado, municipio, parroquia, direccion_detallada, numero_guia, fecha_envio) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `;
            
            db.query(insertQuery, [id_factura, estado, municipio, parroquia, direccion_detallada, numero_guia || null], (err2, result) => {
                if (err2) {
                    console.error('Error registrando envío:', err2);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error al registrar el envío: ' + err2.message 
                    });
                }
                
                res.json({ 
                    success: true, 
                    message: 'Envío registrado exitosamente',
                    id_envio: result.insertId
                });
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
        res.json({ success: true, message: 'Obra agregada correctamente', id: newId });
    } catch (err) {
        console.error('Error creando obra:', err);
        res.status(500).json({ success: false, message: 'Error al crear obra' });
    }
});

router.delete('/api/obras-admin/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await Obra.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Obra no encontrada' });
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

router.get('/api/especializaciones', async (req, res) => {
    try {
        const esp = await Especializacion.find().sort({ _id: 1 }).lean();
        res.json(esp.map(e => ({
            id: e._id,
            nombre: e.nombre,
            atributos: e.atributos || []
        })));
    } catch (err) {
        console.error('Error obteniendo especializaciones:', err);
        res.status(500).json({ success: false, message: 'Error al obtener especializaciones' });
    }
});

router.post('/api/especializaciones', async (req, res) => {
    try {
        const { nombre, atributos } = req.body;
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ success: false, message: 'Debe seleccionar un género' });
        }

        const existe = await Especializacion.findOne({ nombre: nombre.trim() }).lean();
        if (existe) {
            return res.status(400).json({ success: false, message: 'Ya existe una especialización para este género' });
        }

        const maxId = await Especializacion.findOne().sort({ _id: -1 }).select('_id').lean();
        const newId = (maxId ? maxId._id : 0) + 1;

        const esp = new Especializacion({
            _id: newId,
            nombre: nombre.trim(),
            atributos: Array.isArray(atributos) ? atributos : []
        });

        await esp.save();
        res.json({ success: true, message: 'Especialización agregada correctamente', id: newId });
    } catch (err) {
        console.error('Error creando especialización:', err);
        res.status(500).json({ success: false, message: 'Error al crear especialización' });
    }
});

router.put('/api/especializaciones/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { atributos } = req.body;

        if (!Array.isArray(atributos) || atributos.length === 0) {
            return res.status(400).json({ success: false, message: 'Debe proporcionar al menos un atributo' });
        }

        const result = await Especializacion.findByIdAndUpdate(id, { atributos }, { new: true });
        if (!result) {
            return res.status(404).json({ success: false, message: 'Especialización no encontrada' });
        }
        res.json({ success: true, message: 'Especialización actualizada correctamente' });
    } catch (err) {
        console.error('Error actualizando especialización:', err);
        res.status(500).json({ success: false, message: 'Error al actualizar especialización' });
    }
});

router.delete('/api/especializaciones/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await Especializacion.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Especialización no encontrada' });
        }
        res.json({ success: true, message: 'Especialización eliminada correctamente' });
    } catch (err) {
        console.error('Error eliminando especialización:', err);
        res.status(500).json({ success: false, message: 'Error al eliminar especialización' });
    }
});

router.get('/api/especializaciones/:id/obras', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const esp = await Especializacion.findById(id).lean();
        if (!esp) {
            return res.status(404).json({ success: false, message: 'Especialización no encontrada' });
        }

        const soloSinDetalles = req.query.solo_sin_detalles === 'true';
        let filter = { 'genero.nombre': esp.nombre };

        if (soloSinDetalles) {
            filter['genero.detalles'] = { $exists: false };
        }

        const obras = await Obra.find(filter)
            .select('_id nombre genero.detalles')
            .sort({ _id: 1 })
            .lean();

        const sinDetallesFilter = soloSinDetalles
            ? obras
            : await Obra.find({ 'genero.nombre': esp.nombre, 'genero.detalles': { $exists: false } })
                .select('_id')
                .lean();

        const idsSinDetalles = new Set(sinDetallesFilter.map(o => o._id));

        res.json({
            obras: obras.map(o => ({
                id: o._id,
                nombre: o.nombre,
                detalles: o.genero?.detalles || {}
            })),
            totalObras: await Obra.countDocuments({ 'genero.nombre': esp.nombre }),
            obrasSinDetalles: idsSinDetalles.size,
            idsSinDetalles: Array.from(idsSinDetalles)
        });
    } catch (err) {
        console.error('Error obteniendo obras por especialización:', err);
        res.status(500).json({ success: false, message: 'Error al obtener obras' });
    }
});

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

router.put('/api/especializaciones/:id/obras/batch-detalles', async (req, res) => {
    try {
        const espId = parseInt(req.params.id);
        const { detalles } = req.body;

        if (!detalles || typeof detalles !== 'object') {
            return res.status(400).json({ success: false, message: 'Debe proporcionar un objeto de detalles válido' });
        }

        const esp = await Especializacion.findById(espId).lean();
        if (!esp) {
            return res.status(404).json({ success: false, message: 'Especialización no encontrada' });
        }

        const result = await Obra.updateMany(
            { 'genero.nombre': esp.nombre, 'genero.detalles': { $exists: false } },
            { $set: { 'genero.detalles': detalles } }
        );

        res.json({
            success: true,
            message: `${result.modifiedCount} obra(s) actualizada(s) correctamente`,
            modifiedCount: result.modifiedCount
        });
    } catch (err) {
        console.error('Error en actualización masiva de detalles:', err);
        res.status(500).json({ success: false, message: 'Error al actualizar detalles masivamente' });
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
        const generos = await Genero.find().sort({ _id: 1 }).lean();
        res.json(generos.map(g => ({
            id: g._id,
            nombre: g.nombre
        })));
    } catch (err) {
        console.error('Error obteniendo géneros:', err);
        res.status(500).json({ success: false, message: 'Error al obtener géneros' });
    }
});

router.post('/api/generos', async (req, res) => {
    try {
        const { nombre } = req.body;
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
            nombre: nombre.trim()
        });

        await genero.save();
        res.json({ success: true, message: 'Género agregado correctamente', id: newId });
    } catch (err) {
        console.error('Error creando género:', err);
        res.status(500).json({ success: false, message: 'Error al crear género' });
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



module.exports = router;