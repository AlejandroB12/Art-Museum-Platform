const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    return sequelize.define('Reserva', {

        id_reserva: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_obra: { type: DataTypes.STRING(24), allowNull: false },
        id_usuario: { type: DataTypes.INTEGER, allowNull: false },
        fecha_reserva: { type: DataTypes.DATE }
    }, 
    
    {
        tableName: 'reserva',
        timestamps: false
    });
};
