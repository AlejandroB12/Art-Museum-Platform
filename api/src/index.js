const express = require('express');
const path = require('path');
const app = express();
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const rateLimit = require('express-rate-limit');
const getSessionConfig = require('../../shared/middlewares/session_config');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(require('express-session')(getSessionConfig()));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes, intente de nuevo en 15 minutos' }
});
app.use('/api/', limiter);

app.use(express.static(path.join(__dirname, '..', '..', 'views')));
app.use(express.static(path.join(__dirname, '..', '..', 'assets')));
app.use('/images', express.static(path.join(__dirname, '..', '..', 'assets', 'images')));

app.get('/', (req, res) => {
    res.redirect('/public/home.html');
});

try {
    const swaggerJsdoc = require('swagger-jsdoc');
    const swaggerUi = require('swagger-ui-express');

    const swaggerSpec = swaggerJsdoc({
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'Art Museum Platform API',
                version: '1.0.0',
                description: 'API del Museo de Arte Contemporáneo - Microservicios'
            },
            servers: [{ url: `http://localhost:${process.env.PORT || 3000}` }]
        },
        apis: [
            './modules/auth/src/**/*.js',
            './modules/catalog/src/**/*.js',
            './modules/user/src/**/*.js',
            './modules/checkout/src/**/*.js',
            './modules/recommendations/src/**/*.js',
            './modules/chatbot/src/**/*.js',
            './modules/admin/src/**/*.js'
        ]
    });

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} catch (e) {
    console.log('Swagger no disponible. Ejecute: npm install swagger-jsdoc swagger-ui-express');
}

const { apiProxy, shouldProxy } = require('./gateway');

app.use((req, res, next) => {
    if (shouldProxy(req.path)) {
        return apiProxy(req, res, next);
    }
    next();
});

const { errorHandler, notFoundHandler } = require('../../shared/middlewares/error_middleware');
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`API Gateway corriendo en http://localhost:${PORT}`);
    console.log(`Documentación: http://localhost:${PORT}/api-docs`);
});
