const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    return sequelize.define('PreguntaSeguridad', {
        
        id_pregunta: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        pregunta: { type: DataTypes.STRING(45) },
        respuesta: { type: DataTypes.STRING(45) },
        id_usuario: { type: DataTypes.INTEGER, allowNull: false }
    }, 
    
    {
        tableName: 'pregunta_seguridad',
        timestamps: false
    });
};
