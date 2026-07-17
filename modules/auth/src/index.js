const express = require('express');
const path = require('path');
const app = express();
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const { sequelize, connectCassandra } = require('./config/database');
const getSessionConfig = require('../../../shared/middlewares/session_config');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const { sessionFromToken } = require('../../../shared/middlewares/auth_jwt');

app.use(require('express-session')(getSessionConfig()));
app.use(sessionFromToken);

const authRouter = require('./routers/auth_router');
app.use(authRouter);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'auth', timestamp: new Date().toISOString() });
});

const { errorHandler, notFoundHandler } = require('../../../shared/middlewares/error_middleware');
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.AUTH_SERVICE_PORT || 3001;

const start = async () => {

    try {
        await sequelize.authenticate();
        console.log('Supabase (PostgreSQL) conectado via Sequelize');
    } catch (err) {
        console.error('Error conectando a Supabase:', err.message);
    }
    await connectCassandra();

    app.listen(PORT, () => {
        
        console.log(`Auth service corriendo en puerto ${PORT}`);
    });
};

start();
