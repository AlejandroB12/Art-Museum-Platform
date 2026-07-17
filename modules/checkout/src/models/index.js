module.exports = (sequelize) => {
    
    const Usuario = require('./sequelize/usuario_model')(sequelize);
    const Comprador = require('./sequelize/comprador_model')(sequelize);
    const Membresia = require('./sequelize/membresia_model')(sequelize);
    const Estado = require('./sequelize/estado_model')(sequelize);
    const Municipio = require('./sequelize/municipio_model')(sequelize);
    const Parroquia = require('./sequelize/parroquia_model')(sequelize);

    Usuario.hasOne(Comprador, { foreignKey: 'id_usuario' });
    Comprador.belongsTo(Usuario, { foreignKey: 'id_usuario' });

    Usuario.hasMany(Membresia, { foreignKey: 'id_usuario' });
    Membresia.belongsTo(Usuario, { foreignKey: 'id_usuario' });

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

    return {
        Usuario, Comprador, Membresia,
        Estado, Municipio, Parroquia
    };
};
