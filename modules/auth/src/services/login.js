const userRepo = require('../repositories/user_repository');
const membershipRepo = require('../repositories/membership_repository');
const auditRepo = require('../repositories/audit_repository');
const { verify } = require('../../../../shared/utils/hash_handler');
const { LoginRequest } = require('../schemas/login');

class InvalidCredentialsError extends Error {
    constructor() {
        super('Credenciales inválidas');
        this.name = 'InvalidCredentialsError';
    }
}

class InactiveAccountError extends Error {
    constructor() {
        super('Cuenta desactivada');
        this.name = 'InactiveAccountError';
    }
}

async function login(credentials, req) {
    const { email, password } = credentials;

    const results = await userRepo.findByEmail(email);
    if (results.length === 0) {
        throw new InvalidCredentialsError();
    }

    const usuario = results[0];
    const passwordMatch = await verify(password, usuario.password);
    if (!passwordMatch) {
        throw new InvalidCredentialsError();
    }

    if (!usuario.activo) {
        throw new InactiveAccountError();
    }

    req.session.id_usuario = usuario.id_usuario;
    req.session.usuario = {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol
    };

    await auditRepo.registrarEvento(usuario.id_usuario, 'INICIO_SESION', 'Inicio de sesión exitoso', req);

    return {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol
    };
}

module.exports = { login, InvalidCredentialsError, InactiveAccountError };
