const auditRepo = require('../repositories/audit_repository');

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

module.exports = { logout };
