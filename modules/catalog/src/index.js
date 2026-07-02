const express = require('express');
const path = require('path');
const app = express();
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const { connectMongoDB } = require('../../../shared/database/mongodb');
const getSessionConfig = require('../../../shared/middlewares/session_config');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const { sessionFromToken } = require('../../../shared/middlewares/auth_jwt');

app.use(require('express-session')(getSessionConfig()));
app.use(sessionFromToken);

const catalogRouter = require('./routers/catalog_router');
app.use('/api', catalogRouter);

const { errorHandler, notFoundHandler } = require('../../../shared/middlewares/error_middleware');
app.use(notFoundHandler);
app.use(errorHandler);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'catalog', timestamp: new Date().toISOString() });
});

const PORT = process.env.CATALOG_SERVICE_PORT || 3002;

const start = async () => {
    await connectMongoDB();
    app.listen(PORT, () => {
        console.log(`Catalog service corriendo en puerto ${PORT}`);
    });
};

start();
