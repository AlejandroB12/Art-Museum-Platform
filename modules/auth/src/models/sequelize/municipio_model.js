const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    return sequelize.define('Municipio', {

        id_municipio: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_estado: { type: DataTypes.INTEGER },
        nombre: { type: DataTypes.STRING(100), allowNull: false }
    }, 
    
    {
        tableName: 'municipio',
        timestamps: false
    });
};
