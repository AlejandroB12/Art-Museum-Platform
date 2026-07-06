const userRepo = require('../repositories/user_repository');

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

module.exports = { getUsuarioActual, getEstadoUsuario };
