const userRepo = require('../repositories/user_repository');
const compradorRepo = require('../repositories/comprador_repository');
const membershipRepo = require('../repositories/membership_repository');
const auditRepo = require('../repositories/audit_repository');
const { hash } = require('../../../../shared/utils/hash_handler');
const { RegisterRequest } = require('../schemas/register');

class EmailAlreadyExistsError extends Error {
    constructor() {
        super('El correo electrónico ya está registrado');
        this.name = 'EmailAlreadyExistsError';
    }
}

class CedulaAlreadyExistsError extends Error {
    constructor() {
        super('La cédula ya está registrada');
        this.name = 'CedulaAlreadyExistsError';
    }
}

async function register(data, req) {
    const validated = RegisterRequest.parse(data);
    const { nombre, apellido, telefono, correo, password, cedula, parroquia, calle } = validated;
    const hashedPassword = await hash(password);
    const codigoVerificacion = Math.floor(100000 + Math.random() * 900000);
    const cedulaNum = parseInt(cedula, 10);

    const existing = await userRepo.findByEmail(correo);
    if (existing.length > 0) {
        throw new EmailAlreadyExistsError();
    }

    let idUsuario;
    try {
        const newUser = await userRepo.createUser({
            email: correo,
            password: hashedPassword,
            nombre: nombre,
            apellido: apellido,
            rol: 'comprador',
            activo: false
        });
        idUsuario = newUser.id_usuario;

        await compradorRepo.create({
            id_usuario: idUsuario,
            cedula: cedulaNum,
            telefono: telefono || null,
            codigo_verificacion: String(codigoVerificacion),
            id_parroquia: parroquia ? parseInt(parroquia, 10) : null,
            calle: calle || null
        });

        const ahora = new Date();
        const expiracion = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000);
        await membershipRepo.insert(
            idUsuario,
            ahora.toISOString().split('T')[0],
            expiracion.toISOString().split('T')[0],
            10.00
        );
    } catch (err) {
        if (idUsuario) {
            await userRepo.deleteById(idUsuario).catch(() => {});
        }
        if (err.name === 'SequelizeUniqueConstraintError') {
            const fields = err.fields || {};
            if (fields.cedula) throw new CedulaAlreadyExistsError();
            if (fields.email) throw new EmailAlreadyExistsError();
        }
        throw err;
    }

    try {
        await auditRepo.registrarEvento(idUsuario, 'REGISTRO_USUARIO', 'Registro de nuevo comprador', req);
    } catch (err) {
        console.error('Error registrando evento de auditoría:', err.message);
    }

    return { id_usuario: idUsuario, nombre, correo };
}

module.exports = { register, EmailAlreadyExistsError, CedulaAlreadyExistsError };
