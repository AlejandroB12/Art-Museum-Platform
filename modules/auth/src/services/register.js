const userRepo = require('../repositories/user_repository');
const compradorRepo = require('../repositories/comprador_repository');
const membershipRepo = require('../repositories/membership_repository');
const auditRepo = require('../repositories/audit_repository');
const { registerSchema } = require('../schemas/register');

async function register(data, req) {
    const validated = registerSchema.parse(data);
    const { nombre, apellido, telefono, correo, password, cedula, parroquia, calle } = validated;
    const codigoVerificacion = Math.floor(100000 + Math.random() * 900000);

    if (!cedula) {
        throw new Error("La cédula es obligatoria para compradores.");
    }

    const cedulaNum = parseInt(cedula.replace(/\D/g, ''), 10);
    if (isNaN(cedulaNum)) {
        throw new Error("La cédula debe contener solo números.");
    }

    let idUsuario;
    try {
        const { prisma } = require('../models');
        const newUser = await prisma.usuario.create({
            data: {
                Email: correo, Contraseña: password,
                Nombre: nombre, Apellido: apellido,
                Estatus: 0, Rol: 'comprador'
            }
        });
        idUsuario = newUser.id_usuario;

        await prisma.comprador.create({
            data: {
                Cedula: cedulaNum,
                Telefono: telefono || null,
                CodigoVerificacion: codigoVerificacion,
                Calle: calle || null,
                PuedeAdquirir: true,
                usuario: { connect: { id_usuario: idUsuario } },
                ...(parroquia ? { parroquia: { connect: { id_parroquia: parseInt(parroquia, 10) } } } : {})
            }
        });

        await prisma.membresia.create({
            data: {
                id_usuario: idUsuario,
                FechaPago: new Date(),
                MontoPagado: 10.00
            }
        });
    } catch (err) {
        if (idUsuario) {
            await userRepo.deleteById(idUsuario).catch(() => {});
        }
        throw err;
    }

    try {
        await auditRepo.registrarEvento(idUsuario, 'REGISTRO_USUARIO', 'Registro de nuevo comprador', req);
    } catch (err) {
        console.error('Error registrando evento de auditoría:', err.message);
    }

    return {
        redirect: `/public/register.html?success=1&nombre=${encodeURIComponent(nombre)}&correo=${encodeURIComponent(correo)}`
    };
}

module.exports = { register };
