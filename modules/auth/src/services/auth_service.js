const userRepo = require('../repositories/user_repository');
const compradorRepo = require('../repositories/comprador_repository');
const membershipRepo = require('../repositories/membership_repository');
const auditRepo = require('../repositories/audit_repository');
const emailUtils = require('../../../../shared/utils/email');
const {
    loginSchema, recoverySchema, updatePasswordSchema,
    registerSchema, securityQuestionsSchema
} = require('../schemas/auth_schema');

async function login(username, password, req) {
    const { username: validatedUser, password: validatedPass } = loginSchema.parse({ username, password });

    const results = await userRepo.findByEmail(validatedUser);
    if (results.length === 0) return { error: 'credenciales', redirect: '/public/login.html?error=credenciales' };

    const usuario = results[0];
    if (usuario.Contraseña !== validatedPass) {
        return { error: 'credenciales', redirect: '/public/login.html?error=credenciales' };
    }

    if (usuario.Estatus === 0) {
        return { pending: true };
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
    const { correo: validatedCorreo } = recoverySchema.parse({ correo });

    const results = await userRepo.findByEmail(validatedCorreo);
    if (results.length === 0) throw new Error("Correo no encontrado");

    const userId = results[0].id_usuario;
    const enlaceRecuperacion = `http://localhost:3000/private/password-recovery.html?id=${userId}`;
    await emailUtils.sendMail(emailUtils.createRecoveryEmail(validatedCorreo, enlaceRecuperacion));
    await auditRepo.registrarEvento(userId, 'CODIGO_RECUPERACION', 'Código de recuperación enviado al email', req);
}

async function updatePassword(userId, newPassword, req) {
    const { userId: validatedId, newPassword: validatedPass } = updatePasswordSchema.parse({ userId, newPassword });

    await userRepo.updatePassword(validatedId, validatedPass);
    await auditRepo.registrarEvento(validatedId, 'CAMBIO_CONTRASENA', 'Contraseña actualizada exitosamente', req);
}

async function register(data, req) {
    const validated = registerSchema.parse(data);
    const { nombre, apellido, telefono, correo, password, cedula, parroquia, calle } = validated;
    const codigoVerificacion = Math.floor(100000 + Math.random() * 900000);

    const newUser = await userRepo.beginTransaction();
    try {
        const result = await userRepo.queryRaw(
            "INSERT INTO Usuario (Email, Contraseña, Nombre, Apellido, Estatus, Rol) VALUES (?, ?, ?, ?, 0, 'comprador')",
            [correo, password, nombre, apellido]
        );
        const idUsuario = result.insertId;

        if (!cedula) {
            await userRepo.rollback().catch(() => {});
            throw new Error("La cédula es obligatoria para compradores.");
        }

        await compradorRepo.create({
            id_usuario: idUsuario, Cedula: cedula, Telefono: telefono,
            CodigoVerificacion: codigoVerificacion, id_parroquia: parroquia || null, Calle: calle
        });

        await membershipRepo.insert(idUsuario, 'NOW()', 10.00);
        await userRepo.commit();
        await auditRepo.registrarEvento(idUsuario, 'REGISTRO_USUARIO', 'Registro de nuevo comprador', req);

        return {
            redirect: `/public/register.html?success=1&nombre=${encodeURIComponent(nombre)}&correo=${encodeURIComponent(correo)}`
        };
    } catch (err) {
        await userRepo.rollback().catch(() => {});
        throw err;
    }
}

async function saveSecurityQuestions(userId, datos, req) {
    const validated = securityQuestionsSchema.parse(datos);

    await userRepo.queryRaw("DELETE FROM CodigoSeguridad WHERE id_usuario = ?", [userId]);
    const valores = validated.map(p => [p.pregunta, p.resp, userId]);
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

async function getEstadoUsuario(req) {
    if (!req.session?.id_usuario) {
        return { autenticado: false, puedeAdquirir: false };
    }

    const results = await userRepo.findWithMembresiaStatus(req.session.id_usuario);
    if (!results || results.length === 0) {
        return { autenticado: true, puedeAdquirir: true };
    }

    const r = results[0];
    let puedeAdquirir = r.PuedeAdquirir == 1;
    const membresiaActiva = r.MembresiaActiva == 1;

    if (!membresiaActiva && puedeAdquirir) {
        await userRepo.updatePuedeAdquirir(req.session.id_usuario, 0);
        puedeAdquirir = false;
    }

    return {
        autenticado: true,
        puedeAdquirir,
        id_usuario: req.session.id_usuario,
        rol: r.Rol || 'comprador'
    };
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
    saveSecurityQuestions, getUsuarioActual, getEstadoUsuario, logout
};
