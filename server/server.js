const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { connectMongoDB, connectCassandra, connectNeo4j } = require('../config/database');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'views')));
app.use(express.static(path.join(__dirname, '..', 'assets')));
app.use('/images', express.static(path.join(__dirname, 'assets/images')));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.get('/', (req, res) => {
    res.redirect('/public/home.html');
});

// ==========================================
// Rutas modulares (routes → services → repositories)
// ==========================================
const routes = require('../backend/api/api_router');
app.use(routes);

// ==========================================
// Swagger (si está instalado)
// ==========================================
try {
    const swaggerJsdoc = require('swagger-jsdoc');
    const swaggerUi = require('swagger-ui-express');

    const swaggerSpec = swaggerJsdoc({
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'Art Museum Platform API',
                version: '1.0.0',
                description: 'API del Museo de Arte Contemporáneo - Catálogo, autenticación, membresías, recomendaciones'
            },
            servers: [{ url: `http://localhost:${process.env.PORT || 3000}` }]
        },
        apis: ['./backend/**/*_router.js', './backend/**/*_schema.js']
    });

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log('Swagger disponible en /api-docs');
} catch (e) {
    console.log('Swagger no instalado. Ejecute: npm install swagger-jsdoc swagger-ui-express');
}

const { errorHandler, notFoundHandler } = require('../backend/api/middlewares/error_middleware');
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT;

const startServer = async () => {
    await connectMongoDB();
    await connectCassandra();
    await connectNeo4j();
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
};

startServer();
