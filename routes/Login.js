const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const path = require('path');

require('dotenv').config(); // Carga las variables de entorno.

// --- IMPORTACIÓN DE BASE DE DATOS ---
const db = require('../config/database');
const { client } = require('../config/cassandra');

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

            const sqlPago = "SELECT FechaPago FROM Membresia WHERE id_usuario = ? ORDER BY FechaPago DESC LIMIT 1";
            
            db.query(sqlPago, [usuario.id_usuario], (err, pagos) => {
                if (err) return res.status(500).send("Error al verificar membresía");

                if (pagos.length > 0) {
                    const fechaPago = new Date(pagos[0].FechaPago);
                    const hoy = new Date();
                    const diffTime = Math.abs(hoy - fechaPago);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays > 30) {
                        return res.send("<h1>Acceso Denegado</h1><p>Tu membresía ha vencido. Contacta al administrador.</p>");
                    }
                } else if (usuario.Rol !== 'administrador') {
                    return res.send("<h1>Acceso Denegado</h1><p>No se encontró registro de pago.</p>");
                }

                req.session.id_usuario = usuario.id_usuario;

                registrarEventoSeguridad(usuario.id_usuario, 'INICIO_SESION', 'Inicio de sesión exitoso', req);

                if (usuario.Rol === 'administrador') {
                    res.redirect('/Admin.html'); 
                } else {
                    res.redirect(`/user/Panel-usuario.html?email=${usuario.Email}`);
                }
            });
        } else {
            res.redirect('/user/Credenciales-incorrectas.html');
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

                const sqlMembresia = "INSERT INTO Membresia (FechaPago, MontoPagado, id_usuario) VALUES (CURDATE(), 10.00, ?)";
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
    db.query("SELECT id_estado, nombre FROM estado", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.get('/api/municipios/:id_estado', (req, res) => {
    db.query("SELECT id_municipio, nombre FROM municipio WHERE id_estado = ?", [req.params.id_estado], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.get('/api/parroquias/:id_municipio', (req, res) => {
    db.query("SELECT id_parroquia, nombre FROM parroquia WHERE id_municipio = ?", [req.params.id_municipio], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// --- OTROS ENDPOINTS ---
router.get('/api/usuario-actual', (req, res) => {
    if (!req.session.id_usuario) return res.status(401).json({ error: "No iniciado" });
    
    const sql = "SELECT Nombre FROM Usuario WHERE id_usuario = ?";
    db.query(sql, [req.session.id_usuario], (err, results) => {
        if (err || results.length === 0) return res.status(500).json({ error: "Error" });
        res.json({ Nombre: results[0].Nombre });
    });
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

    const sql = `
        SELECT 
            'Membresía Premium' AS Concepto,
            MIN(FechaPago) AS FechaInicio,
            SUM(MontoPagado) AS TotalPagado,
            DATE_ADD(MIN(FechaPago), INTERVAL (SUM(MontoPagado) / 10 * 30) DAY) AS FechaVencimiento,
            CASE 
                WHEN CURDATE() <= DATE_ADD(MIN(FechaPago), INTERVAL (SUM(MontoPagado) / 10 * 30) DAY) THEN 'Activa'
                ELSE 'Vencida'
            END AS EstadoPago,
            GREATEST(0, DATEDIFF(DATE_ADD(MIN(FechaPago), INTERVAL (SUM(MontoPagado) / 10 * 30) DAY), CURDATE())) AS DiasRestantes
        FROM Membresia 
        WHERE id_usuario = ?
        GROUP BY id_usuario`;

    db.query(sql, [idUsuario], (err, results) => {
        if (err) return res.status(500).json({ error: "Error de base de datos" });
        res.json(results);
    });
});

router.post('/solicitar-pago', (req, res) => {
    if (!req.session.id_usuario) return res.status(401).send("No autorizado");
    const sql = "INSERT INTO SolicitudPago (id_usuario, Estatus) VALUES (?, 'Pendiente')";
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
        SELECT 
            o.Nombre,
            o.Precio, 
            f.Fecha_Venta AS Fecha_emision,
            g.Nombre AS Genero
        FROM Factura f
        INNER JOIN Obra o ON f.id_obra = o.id_Obra
        INNER JOIN Comprador c ON f.id_comprador = c.id_usuario
        LEFT JOIN Genero g ON o.id_Genero = g.id_Genero
        WHERE c.id_usuario = ?
        ORDER BY f.Fecha_Venta DESC`;

    db.query(sql, [idUsuario], (err, results) => {
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
        if (err || results.length === 0) return res.status(500).json({ error: "Error al obtener datos" });
        
        res.json(results[0]); 
    });
});
// --- RUTA PARA REGISTRAR LA RESERVA Y ACTUALIZAR ESTADO DE OBRA ---
router.post('/confirmar-reserva', (req, res) => {
    if (!req.session.id_usuario) return res.status(401).json({ error: "Sesión expirada" });

    const { id_obra } = req.body;
    const id_usuario = req.session.id_usuario;
    const fecha = new Date();

    const sqlVerificar = "SELECT Estado_Obra FROM Obra WHERE id_Obra = ?";
    db.query(sqlVerificar, [id_obra], (err, obraActual) => {
        if (err) return res.status(500).json({ error: "Error al verificar obra" });
        if (obraActual.length === 0) return res.status(404).json({ error: "La obra no existe" });
        if (obraActual[0].Estado_Obra !== 'Disponible') {
            return res.status(400).json({ error: "La obra no está disponible (estado: " + obraActual[0].Estado_Obra + ")" });
        }

        db.beginTransaction((err) => {
            if (err) return res.status(500).json({ error: "Error al iniciar transacción" });

            const sqlReserva = "INSERT INTO Reserva (id_Obra, id_Usuario, Fecha_Reserva) VALUES (?, ?, ?)";
            db.query(sqlReserva, [id_obra, id_usuario, fecha], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: "Error al crear reserva: " + err.message });
                    });
                }

                const sqlObra = "UPDATE Obra SET Estado_Obra = 'Reservado' WHERE id_Obra = ? AND Estado_Obra = 'Disponible'";
                db.query(sqlObra, [id_obra], (err, result) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: "Error al actualizar obra: " + err.message });
                        });
                    }

                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ error: "Error al confirmar transacción" });
                            });
                        }
                        registrarEventoSeguridad(id_usuario, 'CONFIRMAR_RESERVA', `Obra ${id_obra} reservada`, req);
                        try {
                            const { client } = require('../config/cassandra');
                            client.execute(
                                `INSERT INTO historial_estatus_obra (id_obra, fecha_cambio, estatus_anterior, estatus_nuevo, modificado_por, motivo)
                                 VALUES (?, toTimestamp(now()), 'Disponible', 'Reservado', ?, ?)`,
                                [parseInt(id_obra), id_usuario, 'Comprador inició proceso de compra'],
                                { prepare: true }
                            ).catch(e => console.error('Error registrando cambio estatus:', e.message));
                        } catch (e) {
                            console.error('Error registrando en Cassandra:', e.message);
                        }
                        res.json({ success: true, message: "Reserva confirmada y obra actualizada" });
                    });
                });
            });
        });
    });
});

router.get('/api/estado-usuario', (req, res) => {
    if (req.session && req.session.id_usuario) {
        // Si hay sesión, devolvemos el estado de "autenticado"
        res.json({ autenticado: true });
    } else {
        res.json({ autenticado: false });
    }
});

router.get('/logout', (req, res) => {
    // 1. Destruye la sesión en el servidor
    req.session.destroy((err) => {
        if (err) {
            console.error("Error al destruir sesión:", err);
            return res.status(500).send("No se pudo cerrar la sesión");
        }
        
        // 2. Borra la cookie del navegador (esencial para que el cliente no mantenga sesión)
        res.clearCookie('connect.sid', { path: '/' });
        
        // 3. Redirige a la página pública (Ej: Inicio.html servido por la raíz)
        res.redirect('/'); 
    });
});

module.exports = router;