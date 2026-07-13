const express = require('express');
const path = require('path');
const app = express();
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const { connectCassandra } = require('../../../shared/database/cassandra');
const getSessionConfig = require('../../../shared/middlewares/session_config');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const { sessionFromToken } = require('../../../shared/middlewares/auth_jwt');

app.use(require('express-session')(getSessionConfig()));
app.use(sessionFromToken);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'user', timestamp: new Date().toISOString() });
});

const userRouter = require('./routers/user_router');
app.use(userRouter);

const { errorHandler, notFoundHandler } = require('../../../shared/middlewares/error_middleware');
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.USER_SERVICE_PORT || 3003;

const start = async () => {
    await connectCassandra();

    try {
        const { queryRaw } = require('../../../shared/database/postgres');
        await queryRaw(`
            CREATE TABLE IF NOT EXISTS obra (
                id_obra VARCHAR(24) PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                fecha_creacion DATE,
                precio NUMERIC(10,2),
                estado_obra VARCHAR(50) DEFAULT 'Disponible',
                id_genero INTEGER,
                fotografia TEXT
            )
        `);
        await queryRaw(`
            CREATE TABLE IF NOT EXISTS genero (
                id_genero SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL
            )
        `);
        console.log('Tablas obra/genero sincronizadas en Supabase');
        await queryRaw(`
            CREATE TABLE IF NOT EXISTS tarjeta (
                id_tarjeta SERIAL PRIMARY KEY,
                id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario),
                numero_tarjeta VARCHAR(19) NOT NULL,
                fecha_expiracion VARCHAR(5) NOT NULL,
                titular VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(id_usuario)
            )
        `);
        console.log('Tabla tarjeta sincronizada en Supabase');
    } catch (err) {
        console.error('Error creando tablas en Supabase:', err.message);
    }

    app.listen(PORT, () => {
        console.log(`User service corriendo en puerto ${PORT}`);
    });
};

start();
