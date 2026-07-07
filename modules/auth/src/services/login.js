const userRepo = require('../repositories/user_repository');
const membershipRepo = require('../repositories/membership_repository');
const auditRepo = require('../repositories/audit_repository');
const { loginSchema } = require('../schemas/login');

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

module.exports = { login };
