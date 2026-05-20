const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectMongoDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Atlas conectado: ${conn.connection.host}`);
        return conn;
    } catch (err) {
        console.error('Error conectando a MongoDB Atlas:', err.message);
        return null;
    }
};

module.exports = connectMongoDB;
