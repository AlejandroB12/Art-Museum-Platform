const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    return sequelize.define('Estado', {

        id_estado: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: DataTypes.STRING(100), allowNull: false }
    }, 
    
    {
        tableName: 'estado',
        timestamps: false
    });
};
