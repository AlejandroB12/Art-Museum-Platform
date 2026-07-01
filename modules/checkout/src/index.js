const express = require('express');
const path = require('path');
const app = express();
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const { connectMongoDB } = require('../../../shared/database/mongodb');
const { connectCassandra } = require('../../../shared/database/cassandra');
const { connectNeo4j } = require('../../../shared/database/neo4j');
const getSessionConfig = require('../../../shared/middlewares/session_config');
const { sessionFromToken } = require('../../../shared/middlewares/auth_jwt');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(require('express-session')(getSessionConfig()));
app.use(sessionFromToken);

const checkoutRouter = require('./routers/checkout_router');
const geographyRouter = require('./routers/geography_router');

app.use(checkoutRouter);
app.use('/api', geographyRouter);

const { errorHandler, notFoundHandler } = require('../../../shared/middlewares/error_middleware');
app.use(notFoundHandler);
app.use(errorHandler);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'checkout', timestamp: new Date().toISOString() });
});

const PORT = process.env.CHECKOUT_SERVICE_PORT || 3004;

const start = async () => {
    await connectMongoDB();
    await connectCassandra();
    await connectNeo4j();
    app.listen(PORT, () => {
        console.log(`Checkout service corriendo en puerto ${PORT}`);
    });
};

start();
