const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    return sequelize.define('Factura', {

        id_factura: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_obra: { type: DataTypes.STRING(24), allowNull: false },
        id_comprador: { type: DataTypes.INTEGER, allowNull: false },
        id_admin: { type: DataTypes.INTEGER, allowNull: false },
        fecha_venta: { type: DataTypes.DATE },
        monto_neto: { type: DataTypes.DECIMAL(20, 2), allowNull: false },
        iva: { type: DataTypes.DECIMAL(20, 2), allowNull: false },
        total_pagado: { type: DataTypes.DECIMAL(20, 2), allowNull: false },
        ganancia_usd: { type: DataTypes.DECIMAL(20, 2), allowNull: false },
        porcentaje_comision: { type: DataTypes.DECIMAL(5, 2), allowNull: false }
    }, 
    
    {
        tableName: 'factura',
        timestamps: false
    });
};
