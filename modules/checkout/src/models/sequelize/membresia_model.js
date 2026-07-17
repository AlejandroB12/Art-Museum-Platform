const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    return sequelize.define('Membresia', {

        id_membresia: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_usuario: { type: DataTypes.INTEGER, allowNull: false },
        fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
        fecha_expiracion: { type: DataTypes.DATEONLY, allowNull: false },
        monto_pagado: { type: DataTypes.DECIMAL(20, 2), allowNull: false }
    }, 
    
    {
        tableName: 'membresia',
        timestamps: false
    });
};
