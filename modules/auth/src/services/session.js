const userRepo = require('../repositories/user_repository');

function getUsuarioActual(req) {
    if (req.session && req.session.usuario) {
        const u = req.session.usuario;
        return {
            id_usuario: u.id_usuario,
            Nombre: u.nombre || u.Nombre || '',
            Apellido: u.apellido || u.Apellido || '',
            Email: u.email || u.Email || '',
            Rol: u.rol || u.Rol || ''
        };
    }
    if (req.session && req.session.id_usuario) {
        return {
            id_usuario: req.session.id_usuario,
            Nombre: req.session.usuario?.nombre || req.session.usuario?.Nombre || 'Invitado',
            Apellido: req.session.usuario?.apellido || req.session.usuario?.Apellido || '',
            Email: req.session.usuario?.email || req.session.usuario?.Email || 'guest@museo.com',
            Rol: req.session.usuario?.rol || req.session.usuario?.Rol || null
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
