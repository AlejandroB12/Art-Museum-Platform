const path = require('path');
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });

const PORT = parseInt(process.env.CATALOG_SERVICE_PORT, 10) || 3002;

const { connectMongoDB } = require('./config/database');
const getSessionConfig = require('../../../shared/middlewares/session_config');
const { sessionFromToken } = require('../../../shared/middlewares/auth_jwt');
const apiLimiter = require('../../../shared/middlewares/rate_limiter');
const { errorHandler, notFoundHandler } = require('../../../shared/middlewares/error_middleware');

const artistRouter = require('./routers/artist_router');
const artworkRouter = require('./routers/artwork_router');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(session(getSessionConfig()));
app.use(sessionFromToken);

app.get('/health', (req, res) => {
    
    res.json({ status: 'ok', service: 'catalog', timestamp: new Date().toISOString() });
});

app.use('/api', apiLimiter);
app.use('/api', artistRouter);
app.use('/api', artworkRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
    await connectMongoDB();
    const server = app.listen(PORT, () => {
        console.log(`Catalog service corriendo en puerto ${PORT}`);
    });

    const shutdown = async (signal) => {
        console.log(`\n${signal} recibido. Cerrando conexiones...`);
        server.close();
        await mongoose.connection.close();
        console.log('Servicio detenido.');
        process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
};

start();
