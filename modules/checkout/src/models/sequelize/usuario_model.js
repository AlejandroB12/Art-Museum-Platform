const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    return sequelize.define('Usuario', {

        id_usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        email: { type: DataTypes.STRING(45), unique: true, allowNull: false },
        password: { type: DataTypes.STRING(255), allowNull: false },
        nombre: { type: DataTypes.STRING(45) },
        apellido: { type: DataTypes.STRING(45) },
        rol: { type: DataTypes.STRING(20), allowNull: false },
        activo: { type: DataTypes.BOOLEAN, defaultValue: true }
    }, 
    
    {
        tableName: 'usuario',
        timestamps: false
    });
};
