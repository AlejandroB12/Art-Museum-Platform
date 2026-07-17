const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    return sequelize.define('SolicitudPago', {

        id_solicitud: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_usuario: { type: DataTypes.INTEGER, allowNull: false },
        fecha_solicitud: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        monto: { type: DataTypes.DECIMAL(20, 2), defaultValue: 10.00 },
        estatus: { type: DataTypes.STRING(20), defaultValue: 'Pendiente' }
    }, 
    
    {
        tableName: 'solicitud_pago',
        timestamps: false
    });
};
