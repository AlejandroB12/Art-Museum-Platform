const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const BASE_OPTS = {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 8000,
    connectTimeoutMS: 8000,
};

const STRATEGIES = [
    { name: 'Local', uri: process.env.MONGO_URI_LOCAL, opts: {} },
    { name: 'SRV', uri: process.env.MONGO_URI, opts: {} },
    { name: 'SRV + tlsInsecure', uri: process.env.MONGO_URI ? process.env.MONGO_URI + '&tlsInsecure=true' : '', opts: {} },
    { name: 'Directo', uri: process.env.MONGO_URI_FALLBACK, opts: {} },
    { name: 'Directo + tlsInsecure', uri: process.env.MONGO_URI_FALLBACK ? process.env.MONGO_URI_FALLBACK + '&tlsInsecure=true' : '', opts: {} },
];

const connectMongoDB = async () => {
    for (const s of STRATEGIES) {
        try {
            const uri = s.uri || '';
            if (!uri) continue;
            const opts = { ...BASE_OPTS, ...s.opts };
            const conn = await mongoose.connect(uri, opts);
            console.log(`MongoDB conectado [${s.name}]: ${conn.connection.host}`);
            return conn;
        } catch (err) {
            console.log(`  MongoDB [${s.name}]: ${err.message.split('\n')[0].split('.')[0]}`);
        }
    }
    console.log('  MongoDB: No se pudo conectar con ninguna estrategia');
    return null;
};

module.exports = { connectMongoDB };
