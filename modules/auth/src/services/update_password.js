const userRepo = require('../repositories/user_repository');
const auditRepo = require('../repositories/audit_repository');
const { updatePasswordSchema } = require('../schemas/update_password');

async function updatePassword(userId, newPassword, req) {
    const { userId: validatedId, newPassword: validatedPass } = updatePasswordSchema.parse({ userId, newPassword });

    await userRepo.updatePassword(validatedId, validatedPass);
    await auditRepo.registrarEvento(validatedId, 'CAMBIO_CONTRASENA', 'Contraseña actualizada exitosamente', req);
}

module.exports = { updatePassword };
