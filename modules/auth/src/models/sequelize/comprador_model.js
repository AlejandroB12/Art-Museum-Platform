const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    return sequelize.define('Comprador', {

        id_usuario: { type: DataTypes.INTEGER, primaryKey: true },
        cedula: { type: DataTypes.INTEGER, unique: true, allowNull: false },
        telefono: { type: DataTypes.STRING(15) },
        codigo_verificacion: { type: DataTypes.STRING(6) },
        id_estado: { type: DataTypes.INTEGER },
        id_municipio: { type: DataTypes.INTEGER },
        id_parroquia: { type: DataTypes.INTEGER },
        calle: { type: DataTypes.STRING(100) }
    }, 
    
    {
        tableName: 'comprador',
        timestamps: false
    });
};
