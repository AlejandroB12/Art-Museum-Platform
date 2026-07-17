const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    
    return sequelize.define('Envio', {

        id_envio: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_factura: { type: DataTypes.INTEGER, unique: true, allowNull: false },
        fecha_envio: { type: DataTypes.DATE },
        monto_total: { type: DataTypes.DECIMAL(20, 2) },
        estado_entrega: { type: DataTypes.STRING(20) }
    }, 
    
    {
        tableName: 'envio',
        timestamps: false
    });
};
