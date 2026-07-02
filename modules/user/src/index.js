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

const userRouter = require('./routers/user_router');
app.use(userRouter);

const { errorHandler, notFoundHandler } = require('../../../shared/middlewares/error_middleware');
app.use(notFoundHandler);
app.use(errorHandler);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'user', timestamp: new Date().toISOString() });
});

const PORT = process.env.USER_SERVICE_PORT || 3003;

const start = async () => {
    await connectCassandra();
    app.listen(PORT, () => {
        console.log(`User service corriendo en puerto ${PORT}`);
    });
};

start();
