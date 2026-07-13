const userRepo = require('../repositories/user_repository');

function getUsuarioActual(req) {
    if (req.session && req.session.usuario) return req.session.usuario;
    if (req.session && req.session.id_usuario) {
        return {
            id_usuario: req.session.id_usuario,
            nombre: req.session.usuario?.nombre || 'Invitado',
            email: req.session.usuario?.email || 'guest@museo.com',
            rol: req.session.usuario?.rol || null
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
    const puedeAdquirir = r.membresia_activa;

    return {
        autenticado: true,
        puedeAdquirir,
        id_usuario: req.session.id_usuario,
        rol: r.rol || 'comprador'
    };
}

module.exports = { getUsuarioActual, getEstadoUsuario };
