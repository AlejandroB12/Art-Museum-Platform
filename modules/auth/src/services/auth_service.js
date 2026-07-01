const userRepo = require('../repositories/user_repository');
const compradorRepo = require('../repositories/comprador_repository');
const membershipRepo = require('../repositories/membership_repository');
const auditRepo = require('../repositories/audit_repository');
const emailUtils = require('../../../shared/utils/email');

async function login(username, password, req) {
    const results = await userRepo.findByEmail(username);
    if (results.length === 0) return { error: 'credenciales', redirect: '/public/login.html?error=credenciales' };

    const usuario = results[0];
    if (usuario.Contraseña !== password) {
        return { error: 'credenciales', redirect: '/public/login.html?error=credenciales' };
    }

    if (usuario.Estatus === 0) {
        return { pending: true, redirect: '/views/user/pending-activation.html' };
    }

    const pagos = await membershipRepo.findLastPayment(usuario.id_usuario);
    if (pagos.length > 0) {
        const pago = pagos[0];
        const fechaPago = new Date(pago.FechaPago);
        const dias = (parseFloat(pago.MontoPagado) / 10) * 30;
        const expiracion = new Date(fechaPago.getTime() + dias * 86400000);
        const ahora = new Date();
        if (ahora > expiracion) {
            await userRepo.updatePuedeAdquirir(usuario.id_usuario, 0);
        }
    } else if (usuario.Rol !== 'administrador') {
        await userRepo.updatePuedeAdquirir(usuario.id_usuario, 0);
    }

    req.session.id_usuario = usuario.id_usuario;
    req.session.usuario = {
        id_usuario: usuario.id_usuario,
        Nombre: usuario.Nombre,
        Email: usuario.Email,
        Rol: usuario.Rol
    };

    await auditRepo.registrarEvento(usuario.id_usuario, 'INICIO_SESION', 'Inicio de sesión exitoso', req);

    if (usuario.Rol === 'administrador') {
        return { success: true, redirect: '/admin/admin-dashboard.html' };
    }
    return { success: true, redirect: `/private/user-dashboard.html?email=${usuario.Email}` };
}

async function recoverPassword(correo, req) {
    const results = await userRepo.findByEmail(correo);
    if (results.length === 0) throw new Error("Correo no encontrado");

    const userId = results[0].id_usuario;
    const enlaceRecuperacion = `http://localhost:3000/private/password-recovery.html?id=${userId}`;
    await emailUtils.sendMail(emailUtils.createRecoveryEmail(correo, enlaceRecuperacion));
    await auditRepo.registrarEvento(userId, 'CODIGO_RECUPERACION', 'Código de recuperación enviado al email', req);
    return { success: true };
}

async function updatePassword(userId, newPassword, req) {
    await userRepo.updatePassword(userId, newPassword);
    await auditRepo.registrarEvento(userId, 'CAMBIO_CONTRASENA', 'Contraseña actualizada exitosamente', req);
}

async function register(data, req) {
    const { nombre, apellido, telefono, correo, password, cedula, parroquia, calle } = data;
    const codigoVerificacion = Math.floor(100000 + Math.random() * 900000);

    await userRepo.beginTransaction();
    try {
        const sqlUser = "INSERT INTO Usuario (Email, Contraseña, Nombre, Apellido, Estatus, Rol) VALUES (?, ?, ?, ?, 0, 'comprador')";
        const result = await userRepo.queryRaw(sqlUser, [correo, password, nombre, apellido]);
        const idUsuario = result.insertId;

        if (!cedula) {
            await userRepo.rollback();
            throw new Error("La cédula es obligatoria para compradores.");
        }

        await compradorRepo.create({
            id_usuario: idUsuario, Cedula: cedula, Telefono: telefono,
            CodigoVerificacion: codigoVerificacion, id_parroquia: parroquia || null, Calle: calle
        });

        await membershipRepo.insert(idUsuario, 'NOW()', 10.00);
        await userRepo.commit();
        await auditRepo.registrarEvento(idUsuario, 'REGISTRO_USUARIO', 'Registro de nuevo comprador', req);
        return { redirect: `/public/register.html?success=1&nombre=${encodeURIComponent(nombre)}&correo=${encodeURIComponent(correo)}` };
    } catch (err) {
        await userRepo.rollback().catch(() => {});
        throw err;
    }
}

async function saveSecurityQuestions(userId, datos, req) {
    await userRepo.queryRaw("DELETE FROM CodigoSeguridad WHERE id_usuario = ?", [userId]);
    const valores = datos.map(p => [p.pregunta, p.resp, userId]);
    await userRepo.queryRaw("INSERT INTO CodigoSeguridad (Pregunta, Respuesta, id_usuario) VALUES ?", [valores]);
    await auditRepo.registrarEvento(userId, 'GUARDAR_SEGURIDAD', 'Preguntas de seguridad guardadas', req);
}

function getUsuarioActual(req) {
    if (req.session && req.session.usuario) return req.session.usuario;
    if (req.session && req.session.id_usuario) {
        return {
            id_usuario: req.session.id_usuario,
            Nombre: req.session.usuario?.Nombre || 'Invitado',
            Email: req.session.usuario?.Email || 'guest@museo.com',
            Rol: req.session.usuario?.Rol || null
        };
    }
    return null;
}

async function logout(req) {
    const idUsuario = req.session?.id_usuario;
    if (idUsuario) {
        await auditRepo.registrarEvento(idUsuario, 'CIERRE_SESION', 'Cierre de sesión manual', req).catch(() => {});
    }
    return new Promise((resolve, reject) => {
        req.session.destroy((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

module.exports = {
    login, recoverPassword, updatePassword, register,
    saveSecurityQuestions, getUsuarioActual, logout
};
