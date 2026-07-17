const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    return sequelize.define('Parroquia', {

        id_parroquia: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_municipio: { type: DataTypes.INTEGER },
        nombre: { type: DataTypes.STRING(100), allowNull: false }
    }, 
    
    {
        tableName: 'parroquia',
        timestamps: false
    });
};
