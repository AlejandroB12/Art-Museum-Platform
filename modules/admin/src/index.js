const express = require('express');
const path = require('path');
const app = express();
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const { connectMongoDB, connectCassandra } = require('../../../shared/database/mongodb');
const { connectCassandra: connectCass } = require('../../../shared/database/cassandra');
const getSessionConfig = require('../../../shared/middlewares/session_config');
const { sessionFromToken } = require('../../../shared/middlewares/auth_jwt');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(require('express-session')(getSessionConfig()));
app.use(sessionFromToken);

const adminRouter = require('./routers/admin_router');
app.use(adminRouter);

const { errorHandler, notFoundHandler } = require('../../../shared/middlewares/error_middleware');
app.use(notFoundHandler);
app.use(errorHandler);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'admin', timestamp: new Date().toISOString() });
});

const PORT = process.env.ADMIN_SERVICE_PORT || 3007;

const start = async () => {
    await connectMongoDB();
    await connectCass();
    app.listen(PORT, () => {
        console.log(`Admin service corriendo en puerto ${PORT}`);
    });
};

start();
