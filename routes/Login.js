const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const path = require('path');

require('dotenv').config(); // Carga las variables de entorno.

// --- IMPORTACIÓN DE BASE DE DATOS ---
const db = require('../config/database');
const { client } = require('../config/cassandra');
const ObraMongo = require('../models/Obra');

// --- HELPER: Registrar evento en bitácora de seguridad ---
const registrarEventoSeguridad = async (id_usuario, tipo_evento, descripcion, req) => {
    try {
        await client.execute(
            `INSERT INTO bitacora_seguridad (id_usuario, fecha_evento, tipo_evento, descripcion, ip_origen, dispositivo)
             VALUES (?, toTimestamp(now()), ?, ?, ?, ?)`,
            [id_usuario, tipo_evento, descripcion, req?.ip || '', req?.headers['user-agent'] || ''],
            { prepare: true }
        );
    } catch (err) {
        console.error('Error registrando evento seguridad:', err.message);
    }
};

// --- CONFIGURACIÓN DE NODEMAILER ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// --- RUTAS DE AUTENTICACIÓN ---
router.post('/login-auth', (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM Usuario WHERE Email = ? AND Contraseña = ?";

    db.query(sql, [username, password], (err, results) => {
        if (err) return res.status(500).send("Error en el servidor");

        if (results.length > 0) {
            const usuario = results[0];

            if (usuario.Estatus === 0) {
                return res.sendFile(path.join(__dirname, '..', 'views', 'user', 'Cuenta-pendiente.html'));
            }

            const sqlPago = "SELECT FechaPago, MontoPagado FROM Membresia WHERE id_usuario = ? ORDER BY FechaPago DESC LIMIT 1";

            db.query(sqlPago, [usuario.id_usuario], (err, pagos) => {
                if (err) return res.status(500).send("Error al verificar membresía");

                if (pagos.length > 0) {
                    const pago = pagos[0];
                    const fechaPago = new Date(pago.FechaPago);
                    const dias = (parseFloat(pago.MontoPagado) / 10) * 30;
                    const expiracion = new Date(fechaPago.getTime() + dias * 86400000);
                    const ahora = new Date();

                    if (ahora > expiracion) {
                        db.query("UPDATE Comprador SET PuedeAdquirir = 0 WHERE id_usuario = ?", [usuario.id_usuario]);
                    }
                } else if (usuario.Rol !== 'administrador') {
                    db.query("UPDATE Comprador SET PuedeAdquirir = 0 WHERE id_usuario = ?", [usuario.id_usuario]);
                }

                req.session.id_usuario = usuario.id_usuario;
                req.session.usuario = {
                    id_usuario: usuario.id_usuario,
                    Nombre: usuario.Nombre,
                    Email: usuario.Email,
                    Rol: usuario.Rol
                };

                registrarEventoSeguridad(usuario.id_usuario, 'INICIO_SESION', 'Inicio de sesión exitoso', req);

                if (usuario.Rol === 'administrador') {
                    res.redirect('/admin/Panel-adminsitrador.html');
                } else {
                    res.redirect(`/user/Panel-usuario.html?email=${usuario.Email}`);
                }
            });
        } else {
            res.redirect('/user/Login.html?error=credenciales');
        }
    });
});

// --- RECUPERACIÓN DE CONTRASEÑA ---
router.post('/recuperar-pw', (req, res) => {
    const { correo } = req.body;
    const sql = "SELECT id_usuario FROM Usuario WHERE Email = ?";

    db.query(sql, [correo], (err, results) => {
        if (err) return res.status(500).send("Error en el servidor");
        if (results.length > 0) {
            const userId = results[0].id_usuario;
            const enlaceRecuperacion = `http://localhost:3000/Recovery/Nueva-contraseña.html?id=${userId}`;
            const mailOptions = {
                from: '"Museo Virtual" <fg57179@gmail.com>',
                to: correo,
                subject: 'Restablecer tu contraseña',
                html: `<div style="text-align: center;"><h2>Recuperación</h2><a href="${enlaceRecuperacion}">Click aquí para cambiar contraseña</a></div>`
            };
            transporter.sendMail(mailOptions, (error) => {
                if (error) return res.status(500).send("Error al enviar el correo.");
                registrarEventoSeguridad(userId, 'CODIGO_RECUPERACION', 'Código de recuperación enviado al email', req);
                res.redirect('/recovery/Confirmacion-envio.html');
            });
        } else {
            res.status(404).send("<h2>Correo no encontrado</h2>");
        }
    });
});

// Actualización de contraseña
router.post('/update-password', (req, res) => {
    const { userId, newPassword } = req.body;
    const sql = "UPDATE Usuario SET Contraseña = ? WHERE id_Usuario = ?";
    db.query(sql, [newPassword, userId], (err) => {
        if (err) return res.status(500).send("Error al actualizar");
        registrarEventoSeguridad(userId, 'CAMBIO_CONTRASENA', 'Contraseña actualizada exitosamente', req);
        res.redirect('/recovery/Actualizacion-contraseña.html');
    });
});

// --- REGISTRO CON TRANSACCIÓN PARA COMPRADORES ---
router.post('/registrar', (req, res) => {
    const { nombre, apellido, telefono, correo, password, cedula, parroquia, calle } = req.body;
    const codigoVerificacion = Math.floor(100000 + Math.random() * 900000);

    db.beginTransaction((err) => {
        if (err) { console.error(err); return res.status(500).send("Error de inicio de transacción"); }

        const sqlUser = "INSERT INTO Usuario (Email, Contraseña, Nombre, Apellido, Estatus, Rol) VALUES (?, ?, ?, ?, 0, 'comprador')";

        db.query(sqlUser, [correo, password, nombre, apellido], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    console.error("Error en tabla Usuario:", err.message);
                    res.status(500).send("Error al crear usuario: " + err.message);
                });
            }

            const idUsuario = result.insertId;

            const sqlComprador = "INSERT INTO Comprador (id_usuario, Cedula, Telefono, CodigoVerificacion, id_parroquia, Calle) VALUES (?, ?, ?, ?, ?, ?)";

            if (!cedula) {
                return db.rollback(() => res.status(400).send("Error: La cédula es obligatoria para compradores."));
            }

            db.query(sqlComprador, [idUsuario, cedula, telefono, codigoVerificacion, parroquia || null, calle], (err) => {
                if (err) {
                    return db.rollback(() => {
                        console.error("ERROR DETALLADO EN COMPRADOR:", err);
                        res.status(500).send("Error en Comprador: " + err.message);
                    });
                }

                const sqlMembresia = "INSERT INTO Membresia (FechaPago, MontoPagado, id_usuario) VALUES (NOW(), 10.00, ?)";
                db.query(sqlMembresia, [idUsuario], (errMem) => {
                    if (errMem) return db.rollback(() => res.status(500).send("Error en Membresía"));

                    db.commit((err) => {
                        if (err) return db.rollback(() => res.status(500).send("Error en Commit"));
                        registrarEventoSeguridad(idUsuario, 'REGISTRO_USUARIO', 'Registro de nuevo comprador', req);
                        res.redirect('/user/Mensaje-exitoso.html');
                    });
                });
            });
        });
    });
});
// --- API PARA UBICACIÓN ---
router.get('/api/estados', (req, res) => {
    db.query("SELECT id_estado, nombre FROM Estado", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.get('/api/municipios/:id_estado', (req, res) => {
    db.query("SELECT id_municipio, nombre FROM Municipio WHERE id_estado = ?", [req.params.id_estado], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.get('/api/parroquias/:id_municipio', (req, res) => {
    db.query("SELECT id_parroquia, nombre FROM Parroquia WHERE id_municipio = ?", [req.params.id_municipio], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// --- OTROS ENDPOINTS ---
router.get('/api/usuario-actual', (req, res) => {
    if (req.session && req.session.usuario) {
        return res.json(req.session.usuario);
    }
    if (req.session && req.session.id_usuario) {
        return res.json({
            id_usuario: req.session.id_usuario,
            Nombre: req.session.usuario?.Nombre || 'Invitado',
            Email: req.session.usuario?.Email || 'guest@museo.com',
            Rol: req.session.usuario?.Rol || null
        });
    }
    return res.status(401).json({ error: "No autenticado" });
});

router.post('/guardar-seguridad', (req, res) => {
    console.log("Sesión:", req.session.id_usuario); // MIRA ESTO EN LA CONSOLA
    console.log("Datos recibidos:", req.body);      // MIRA ESTO EN LA CONSOLA

    if (!req.session.id_usuario) {
        return res.status(401).send("Debes iniciar sesión para guardar esto.");
    }


    const id_usuario = req.session.id_usuario;
    const datos = req.body; // Asegúrate de que el frontend envíe un array de objetos

    // Limpiamos preguntas anteriores del usuario (opcional, para evitar duplicados)
    db.query("DELETE FROM CodigoSeguridad WHERE id_usuario = ?", [id_usuario], (err) => {

        // Insertamos las nuevas
        const valores = datos.map(p => [p.pregunta, p.resp, id_usuario]);
        const sql = "INSERT INTO CodigoSeguridad (Pregunta, Respuesta, id_usuario) VALUES ?";

        db.query(sql, [valores], (err) => {
            if (err) return res.status(500).send("Error al guardar: " + err.message);
            registrarEventoSeguridad(id_usuario, 'GUARDAR_SEGURIDAD', 'Preguntas de seguridad guardadas', req);
            res.send("Preguntas guardadas con éxito");
        });
    });
});

router.get('/api/membresia-usuario', (req, res) => {
    const idUsuario = req.session.id_usuario;
    if (!idUsuario) return res.status(401).json({ error: "Sesión no iniciada" });

    const sqlMembresia = `
        SELECT 
            CONCAT('Pago $', MontoPagado) AS Concepto,
            FechaPago AS FechaInicio,
            MontoPagado AS TotalPagado,
            DATE_ADD(FechaPago, INTERVAL (MontoPagado / 10 * 30) DAY) AS FechaVencimiento,
            'Aprobado' AS EstadoPago,
            CAST(MontoPagado / 10 * 30 AS UNSIGNED) AS DiasRestantes,
            'detalle' AS Tipo
        FROM Membresia 
        WHERE id_usuario = ?

        UNION ALL

        SELECT 
            'Total Acumulado' AS Concepto,
            MIN(FechaPago) AS FechaInicio,
            SUM(MontoPagado) AS TotalPagado,
            MAX(DATE_ADD(FechaPago, INTERVAL (MontoPagado / 10 * 30) DAY)) AS FechaVencimiento,
            CASE 
                WHEN NOW() <= MAX(DATE_ADD(FechaPago, INTERVAL (MontoPagado / 10 * 30) DAY)) THEN 'Activa'
                ELSE 'Vencida'
            END AS EstadoPago,
            GREATEST(0, TIMESTAMPDIFF(DAY, NOW(), MAX(DATE_ADD(FechaPago, INTERVAL (MontoPagado / 10 * 30) DAY)))) AS DiasRestantes,
            'total' AS Tipo
        FROM Membresia 
        WHERE id_usuario = ?

        ORDER BY CASE Tipo WHEN 'total' THEN 2 WHEN 'detalle' THEN 1 ELSE 0 END, FechaInicio ASC`;

    const sqlSolicitudes = `
        SELECT 
            'Solicitud de Pago' AS Concepto,
            FechaSolicitud AS FechaInicio,
            Monto AS TotalPagado,
            NULL AS FechaVencimiento,
            Estatus AS EstadoPago,
            NULL AS DiasRestantes,
            'solicitud' AS Tipo
        FROM SolicitudPago 
        WHERE id_usuario = ? AND Estatus = 'Pendiente'
        ORDER BY FechaSolicitud DESC`;

    db.query(sqlMembresia, [idUsuario, idUsuario], (err, membresiaResults) => {
        if (err) return res.status(500).json({ error: "Error de base de datos" });
        
        db.query(sqlSolicitudes, [idUsuario], (err, solicitudResults) => {
            if (err) return res.status(500).json({ error: "Error de base de datos" });
            
            const combined = [...solicitudResults, ...membresiaResults];
            res.json(combined);
        });
    });
});

router.post('/solicitar-pago', (req, res) => {
    if (!req.session.id_usuario) return res.status(401).send("No autorizado");
    const sql = "INSERT INTO SolicitudPago (id_usuario, FechaSolicitud, Monto, Estatus) VALUES (?, NOW(), 10.00, 'Pendiente')";
    db.query(sql, [req.session.id_usuario], (err) => {
        if (err) return res.status(500).send("Error al registrar");
        registrarEventoSeguridad(req.session.id_usuario, 'SOLICITUD_PAGO', 'Solicitud de pago de membresía enviada', req);
        res.send("Solicitud enviada");
    });
});

router.get('/mis-compras', (req, res) => {
    const idUsuario = req.session.id_usuario;
    if (!idUsuario) return res.status(401).json({ error: "Sesión no válida" });

    const sql = `
        SELECT o.Nombre, o.Precio, f.Fecha_Venta AS Fecha_emision, g.Nombre AS Genero, 'Pagado' AS Estado
        FROM Factura f
        INNER JOIN Obra o ON f.id_obra = o.id_Obra
        INNER JOIN Comprador c ON f.id_comprador = c.id_usuario
        LEFT JOIN Genero g ON o.id_Genero = g.id_Genero
        WHERE c.id_usuario = ?
        UNION
        SELECT o.Nombre, o.Precio, r.Fecha_Reserva AS Fecha_emision, g.Nombre AS Genero, 'Reservado' AS Estado
        FROM Reserva r
        INNER JOIN Obra o ON r.id_obra = o.id_Obra
        LEFT JOIN Genero g ON o.id_Genero = g.id_Genero
        WHERE r.id_usuario = ?
        ORDER BY Fecha_emision DESC`;

    db.query(sql, [idUsuario, idUsuario], (err, results) => {
        if (err) {
            console.error("--- ERROR EN BASE DE DATOS ---");
            console.error("Mensaje:", err.message);
            return res.status(500).json({ error: "Error en la consulta: " + err.message });
        }

        console.log("Compras encontradas:", results.length);
        res.json(results);
    });
});

// En Login.js
router.get('/api/datos-envio-pago', (req, res) => {
    if (!req.session.id_usuario) return res.status(401).json({ error: "No iniciado" });

    const sql = `
        SELECT u.Nombre, u.Apellido, c.Calle, p.nombre AS Parroquia, m.nombre AS Municipio
        FROM Comprador c
        INNER JOIN Usuario u ON c.id_usuario = u.id_usuario
        LEFT JOIN Parroquia p ON c.id_parroquia = p.id_parroquia
        LEFT JOIN Municipio m ON p.id_municipio = m.id_municipio
        WHERE c.id_usuario = ?`;

    db.query(sql, [req.session.id_usuario], (err, results) => {
        if (err) return res.status(500).json({ error: "Error al obtener datos" });
        if (results.length === 0) return res.json(null);

        res.json(results[0]);
    });
});
// --- RUTA PARA REGISTRAR LA RESERVA Y ACTUALIZAR ESTADO DE OBRA ---
router.post('/confirmar-reserva', async (req, res) => {
    if (!req.session.id_usuario) return res.status(401).json({ error: "Sesión expirada" });

    const id_obra = Number(req.body.id_obra);
    const id_usuario = req.session.id_usuario;
    const fecha = new Date();

    if (!Number.isInteger(id_obra) || id_obra <= 0) return res.status(400).json({ error: "ID de obra inválido" });

    try {
        // 0. Verificar membresía activa y sincronizar PuedeAdquirir
        const puedeAdquirir = await new Promise((resolve, reject) => {
            const sqlCheck = `
                SELECT c.PuedeAdquirir,
                       CASE WHEN EXISTS (
                           SELECT 1 FROM Membresia m
                           WHERE m.id_usuario = c.id_usuario
                           AND NOW() <= DATE_ADD(m.FechaPago, INTERVAL (m.MontoPagado / 10 * 30) DAY)
                       ) THEN 1 ELSE 0 END AS MembresiaActiva
                FROM Comprador c WHERE c.id_usuario = ?
            `;
            db.query(sqlCheck, [id_usuario], (err, results) => {
                if (err) return reject(err);
                if (results.length === 0) return resolve(true);
                const r = results[0];
                const membresiaActiva = r.MembresiaActiva == 1;
                if (!membresiaActiva) {
                    db.query("UPDATE Comprador SET PuedeAdquirir = 0 WHERE id_usuario = ?", [id_usuario]);
                    resolve(false);
                } else {
                    resolve(r.PuedeAdquirir == 1);
                }
            });
        });
        if (!puedeAdquirir) {
            return res.status(403).json({ error: "No tienes permiso para adquirir obras. Contacta al administrador." });
        }

        // 1. Verificar obra en MongoDB (fuente de verdad del catálogo)
        const obraMongo = await ObraMongo.findById(id_obra).lean();
        if (!obraMongo) return res.status(404).json({ error: "La obra no existe" });
        if (obraMongo.estado_obra !== 'Disponible') {
            return res.status(400).json({ error: "La obra no está disponible (estado: " + obraMongo.estado_obra + ")" });
        }

        // 2. Sincronizar MySQL (crear o actualizar registro de obra)
        const generoMap = { 'Pintura': 1, 'Escultura': 2, 'Fotografía': 3, 'Orfebreria': 4, 'Ceramica': 5 };
        const generoNombre = obraMongo.genero?.nombre || 'Pintura';
        const idGenero = generoMap[generoNombre] || 1;

        // La FK Obra -> Factura es circular; la deshabilitamos temporalmente
        await new Promise((resolve, reject) => {
            db.query("SET FOREIGN_KEY_CHECKS = 0", (err) => err ? reject(err) : resolve());
        });

        await new Promise((resolve, reject) => {
            db.query(
                "INSERT INTO Obra (id_Obra, Nombre, Fecha_creacion, Precio, Estado_obra, id_Genero, Fotografia) VALUES (?, ?, ?, ?, 'Reservado', ?, ?) ON DUPLICATE KEY UPDATE Estado_obra = 'Reservado'",
                [id_obra, obraMongo.nombre, obraMongo.fecha_creacion || fecha, obraMongo.precio, idGenero, obraMongo.fotografia || ''],
                (err) => err ? reject(err) : resolve()
            );
        });

        await new Promise((resolve, reject) => {
            db.query("SET FOREIGN_KEY_CHECKS = 1", (err) => err ? reject(err) : resolve());
        });

        // 3. Crear reserva en MySQL
        await new Promise((resolve, reject) => {
            db.query("INSERT INTO Reserva (id_Obra, id_Usuario, Fecha_Reserva) VALUES (?, ?, ?)",
                [id_obra, id_usuario, fecha],
                (err) => err ? reject(err) : resolve()
            );
        });

        // 4. Actualizar estado en MongoDB (después de que MySQL haya funcionado)
        await ObraMongo.findByIdAndUpdate(id_obra, { estado_obra: 'Reservado' });

        // 5. Registrar en Cassandra (asíncrono, no bloquea la respuesta)
        registrarEventoSeguridad(id_usuario, 'CONFIRMAR_RESERVA', `Obra ${id_obra} reservada`, req);
        try {
            const { client: cassClient } = require('../config/cassandra');
            cassClient.execute(
                `INSERT INTO historial_estatus_obra (id_obra, fecha_cambio, estatus_anterior, estatus_nuevo, modificado_por, motivo)
                 VALUES (?, toTimestamp(now()), 'Disponible', 'Reservado', ?, ?)`,
                [id_obra, id_usuario, 'Comprador inició proceso de compra'],
                { prepare: true }
            ).catch(e => console.error('Error registrando cambio estatus:', e.message));
        } catch (e) {
            console.error('Error registrando en Cassandra:', e.message);
        }

        // 6. Crear relación :COMPRO en Neo4j (asíncrono, no bloquea la respuesta)
        try {
            const { getSession } = require('../config/neo4j');
            const neoSession = getSession();
            neoSession.run(
                `MERGE (c:Comprador {id_usuario: $compradorId})
                 MERGE (o:Obra {id_obra: $obraId})
                 MERGE (c)-[:COMPRO {fecha: datetime()}]->(o)`,
                { compradorId: id_usuario, obraId: id_obra }
            ).then(() => neoSession.close()).catch(e => {
                console.error('Error creando relación Neo4j:', e.message);
                neoSession.close();
            });
        } catch (e) {
            console.error('Error conectando a Neo4j:', e.message);
        }

        res.json({ success: true, message: "Reserva confirmada y obra actualizada" });
    } catch (err) {
        console.error('Error en confirmar-reserva:', err);
        res.status(500).json({ error: "Error al procesar la reserva", detalle: err.message });
    }
});

router.get('/api/estado-usuario', (req, res) => {
    if (req.session && req.session.id_usuario) {
        const sql = `
            SELECT u.Rol, c.PuedeAdquirir,
                   CASE WHEN EXISTS (
                       SELECT 1 FROM Membresia m
                       WHERE m.id_usuario = u.id_usuario
                       AND NOW() <= DATE_ADD(m.FechaPago, INTERVAL (m.MontoPagado / 10 * 30) DAY)
                   ) THEN 1 ELSE 0 END AS MembresiaActiva
            FROM Usuario u
            LEFT JOIN Comprador c ON u.id_usuario = c.id_usuario
            WHERE u.id_usuario = ?
        `;
        db.query(sql, [req.session.id_usuario], (err, results) => {
            if (err || results.length === 0) {
                return res.json({ autenticado: true, puedeAdquirir: true });
            }
            const r = results[0];
            let puedeAdquirir = r.PuedeAdquirir == 1;
            const membresiaActiva = r.MembresiaActiva == 1;

            if (!membresiaActiva && puedeAdquirir) {
                db.query("UPDATE Comprador SET PuedeAdquirir = 0 WHERE id_usuario = ?", [req.session.id_usuario]);
                puedeAdquirir = false;
            }

            res.json({
                autenticado: true,
                puedeAdquirir,
                id_usuario: req.session.id_usuario,
                rol: r.Rol || 'comprador'
            });
        });
    } else {
        res.json({ autenticado: false, puedeAdquirir: false });
    }
});

router.get('/logout', (req, res) => {
    const idUsuario = req.session?.id_usuario;

    if (idUsuario) {
        registrarEventoSeguridad(idUsuario, 'CIERRE_SESION', 'Cierre de sesión manual', req);
    }

    req.session.destroy((err) => {
        if (err) {
            console.error("Error al destruir sesión:", err);
            return res.status(500).send("No se pudo cerrar la sesión");
        }
        res.clearCookie('connect.sid', { path: '/' });
        res.redirect('/');
    });
});

module.exports = router;