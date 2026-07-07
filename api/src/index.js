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
app.use('/controllers', express.static(path.join(__dirname, '..', '..', 'controllers')));

const viewsPath = path.join(__dirname, '..', '..', 'views');

// Clean URL routes
// Public
app.get('/', (req, res) => res.sendFile(path.join(viewsPath, 'public', 'home.html')));
app.get('/home', (req, res) => res.sendFile(path.join(viewsPath, 'public', 'home.html')));
app.get('/login', (req, res) => res.sendFile(path.join(viewsPath, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(viewsPath, 'public', 'register.html')));
app.get('/catalog/artwork', (req, res) => res.sendFile(path.join(viewsPath, 'public', 'art-catalog.html')));
app.get('/catalog/artist', (req, res) => res.sendFile(path.join(viewsPath, 'public', 'artist-catalog.html')));
app.get('/artist/profile/:name', (req, res) => res.sendFile(path.join(viewsPath, 'public', 'artist-profile.html')));

// Private
app.get('/dashboard', (req, res) => res.sendFile(path.join(viewsPath, 'private', 'user-dashboard.html')));
app.get('/checkout', (req, res) => res.sendFile(path.join(viewsPath, 'private', 'checkout.html')));
app.get('/shipping', (req, res) => res.sendFile(path.join(viewsPath, 'private', 'shipping-address.html')));
app.get('/recovery', (req, res) => res.sendFile(path.join(viewsPath, 'private', 'password-recovery.html')));
app.get('/security-questions', (req, res) => res.sendFile(path.join(viewsPath, 'private', 'security-questions.html')));
app.get('/pending-activation', (req, res) => res.sendFile(path.join(viewsPath, 'private', 'pending-activation.html')));

// Admin
app.get('/admin', (req, res) => res.sendFile(path.join(viewsPath, 'admin', 'admin-dashboard.html')));
app.get('/admin/users', (req, res) => res.sendFile(path.join(viewsPath, 'admin', 'admin-users.html')));
app.get('/admin/catalog', (req, res) => res.sendFile(path.join(viewsPath, 'admin', 'admin-catalog.html')));
app.get('/admin/security', (req, res) => res.sendFile(path.join(viewsPath, 'admin', 'admin-security.html')));

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
