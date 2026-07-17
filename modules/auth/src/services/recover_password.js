const userRepo = require('../repositories/user_repository');
const auditRepo = require('../repositories/audit_repository');
const emailUtils = require('../../../../shared/utils/email');
const { PasswordRecoveryRequest } = require('../schemas/recovery');

async function recoverPassword(correo, req) {
    const { correo: validatedCorreo } = PasswordRecoveryRequest.parse({ correo });

    const results = await userRepo.findByEmail(validatedCorreo);
    if (results.length === 0) throw new Error("Correo no encontrado");

    const userId = results[0].id_usuario;
    const enlaceRecuperacion = `http://localhost:3000/private/password-recovery.html?id=${userId}`;
    await emailUtils.sendMail(emailUtils.createRecoveryEmail(validatedCorreo, enlaceRecuperacion));
    await auditRepo.registrarEvento(userId, 'CODIGO_RECUPERACION', 'Código de recuperación enviado al email', req);
}

module.exports = { recoverPassword };
