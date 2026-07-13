module.exports = (sequelize) => {
    
    const Usuario = require('./usuario_model')(sequelize);
    const Comprador = require('./comprador_model')(sequelize);
    const Admin = require('./admin_model')(sequelize);
    const PreguntaSeguridad = require('./pregunta_seguridad_model')(sequelize);
    const Membresia = require('./membresia_model')(sequelize);
    const SolicitudPago = require('./solicitud_pago_model')(sequelize);
    const Estado = require('./estado_model')(sequelize);
    const Municipio = require('./municipio_model')(sequelize);
    const Parroquia = require('./parroquia_model')(sequelize);
    const Factura = require('./factura_model')(sequelize);
    const Envio = require('./envio_model')(sequelize);
    const Reserva = require('./reserva_model')(sequelize);

    // --- Asociaciones ---
    Usuario.hasOne(Comprador, { foreignKey: 'id_usuario', onDelete: 'CASCADE' });
    Comprador.belongsTo(Usuario, { foreignKey: 'id_usuario', onDelete: 'CASCADE' });

    Usuario.hasOne(Admin, { foreignKey: 'id_usuario', onDelete: 'CASCADE' });
    Admin.belongsTo(Usuario, { foreignKey: 'id_usuario', onDelete: 'CASCADE' });

    Usuario.hasMany(PreguntaSeguridad, { foreignKey: 'id_usuario', onDelete: 'CASCADE' });
    PreguntaSeguridad.belongsTo(Usuario, { foreignKey: 'id_usuario', onDelete: 'CASCADE' });

    Usuario.hasMany(Membresia, { foreignKey: 'id_usuario', onDelete: 'CASCADE' });
    Membresia.belongsTo(Usuario, { foreignKey: 'id_usuario', onDelete: 'CASCADE' });

    Usuario.hasMany(SolicitudPago, { foreignKey: 'id_usuario' });
    SolicitudPago.belongsTo(Usuario, { foreignKey: 'id_usuario' });

    Estado.hasMany(Municipio, { foreignKey: 'id_estado' });
    Municipio.belongsTo(Estado, { foreignKey: 'id_estado' });

    Municipio.hasMany(Parroquia, { foreignKey: 'id_municipio' });
    Parroquia.belongsTo(Municipio, { foreignKey: 'id_municipio' });

    Comprador.belongsTo(Estado, { foreignKey: 'id_estado' });
    Estado.hasMany(Comprador, { foreignKey: 'id_estado' });

    Comprador.belongsTo(Municipio, { foreignKey: 'id_municipio' });
    Municipio.hasMany(Comprador, { foreignKey: 'id_municipio' });

    Comprador.belongsTo(Parroquia, { foreignKey: 'id_parroquia' });
    Parroquia.hasMany(Comprador, { foreignKey: 'id_parroquia' });

    Usuario.hasMany(Factura, { foreignKey: 'id_comprador', as: 'facturasComprador' });
    Usuario.hasMany(Factura, { foreignKey: 'id_admin', as: 'facturasAdmin' });
    Factura.belongsTo(Usuario, { foreignKey: 'id_comprador', as: 'comprador' });
    Factura.belongsTo(Usuario, { foreignKey: 'id_admin', as: 'admin' });

    Factura.hasOne(Envio, { foreignKey: 'id_factura' });
    Envio.belongsTo(Factura, { foreignKey: 'id_factura' });

    Usuario.hasMany(Reserva, { foreignKey: 'id_usuario' });
    Reserva.belongsTo(Usuario, { foreignKey: 'id_usuario' });

    return {
        Usuario, Comprador, Admin, PreguntaSeguridad,
        Membresia, SolicitudPago, Estado, Municipio, Parroquia,
        Factura, Envio, Reserva
    };
};
