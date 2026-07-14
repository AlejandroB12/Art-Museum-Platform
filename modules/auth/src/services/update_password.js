const userRepo = require('../repositories/user_repository');
const auditRepo = require('../repositories/audit_repository');
const { hash, verify } = require('../../../../shared/utils/hash_handler');
const { UpdatePasswordRequest } = require('../schemas/update_password');

class InvalidCurrentPasswordError extends Error {
    constructor() {
        super('La contraseña actual no es correcta');
        this.name = 'InvalidCurrentPasswordError';
    }
}

class UserNotFoundError extends Error {
    constructor() {
        super('Usuario no encontrado');
        this.name = 'UserNotFoundError';
    }
}

async function updatePassword(parsed, req) {
    const { userId, currentPassword, newPassword } = parsed;

    const results = await userRepo.findById(userId);
    if (results.length === 0) {
        throw new UserNotFoundError();
    }

    const passwordMatch = await verify(currentPassword, results[0].password);
    if (!passwordMatch) {
        throw new InvalidCurrentPasswordError();
    }

    const hashedPassword = await hash(newPassword);
    await userRepo.updatePassword(userId, hashedPassword);
    await auditRepo.registrarEvento(userId, 'CAMBIO_CONTRASENA', 'Contraseña actualizada exitosamente', req);
}

module.exports = { updatePassword, InvalidCurrentPasswordError, UserNotFoundError };
