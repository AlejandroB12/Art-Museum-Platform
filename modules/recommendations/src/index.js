const express = require('express');
const path = require('path');
const app = express();
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const { connectNeo4j } = require('../../../shared/database/neo4j');
const getSessionConfig = require('../../../shared/middlewares/session_config');
const { sessionFromToken } = require('../../../shared/middlewares/auth_jwt');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(require('express-session')(getSessionConfig()));
app.use(sessionFromToken);

const recRouter = require('./routers/recommendations_router');
app.use('/api', recRouter);

const { errorHandler, notFoundHandler } = require('../../../shared/middlewares/error_middleware');
app.use(notFoundHandler);
app.use(errorHandler);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'recommendations', timestamp: new Date().toISOString() });
});

const PORT = process.env.RECOMMENDATIONS_SERVICE_PORT || 3005;

const start = async () => {
    await connectNeo4j();
    app.listen(PORT, () => {
        console.log(`Recommendations service corriendo en puerto ${PORT}`);
    });
};

start();
