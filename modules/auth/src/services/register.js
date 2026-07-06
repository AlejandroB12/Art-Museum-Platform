const userRepo = require('../repositories/user_repository');
const compradorRepo = require('../repositories/comprador_repository');
const membershipRepo = require('../repositories/membership_repository');
const auditRepo = require('../repositories/audit_repository');
const { registerSchema } = require('../schemas/register');

async function register(data, req) {
    const validated = registerSchema.parse(data);
    const { nombre, apellido, telefono, correo, password, cedula, parroquia, calle } = validated;
    const codigoVerificacion = Math.floor(100000 + Math.random() * 900000);

    const newUser = await userRepo.beginTransaction();
    try {
        const result = await userRepo.queryRaw(
            "INSERT INTO Usuario (Email, Contraseña, Nombre, Apellido, Estatus, Rol) VALUES (?, ?, ?, ?, 0, 'comprador')",
            [correo, password, nombre, apellido]
        );
        const idUsuario = result.insertId;

        if (!cedula) {
            await userRepo.rollback().catch(() => {});
            throw new Error("La cédula es obligatoria para compradores.");
        }

        await compradorRepo.create({
            id_usuario: idUsuario, Cedula: cedula, Telefono: telefono,
            CodigoVerificacion: codigoVerificacion, id_parroquia: parroquia || null, Calle: calle
        });

        await membershipRepo.insert(idUsuario, 'NOW()', 10.00);
        await userRepo.commit();
        await auditRepo.registrarEvento(idUsuario, 'REGISTRO_USUARIO', 'Registro de nuevo comprador', req);

        return {
            redirect: `/public/register.html?success=1&nombre=${encodeURIComponent(nombre)}&correo=${encodeURIComponent(correo)}`
        };
    } catch (err) {
        await userRepo.rollback().catch(() => {});
        throw err;
    }
}

module.exports = { register };
