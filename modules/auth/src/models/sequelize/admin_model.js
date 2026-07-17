const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    return sequelize.define('Admin', {

        id_usuario: { type: DataTypes.INTEGER, primaryKey: true }
    }, 
    
    {
        tableName: 'admin', 
        timestamps: false
    });
};
