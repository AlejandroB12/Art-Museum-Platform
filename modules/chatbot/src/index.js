const express = require('express');
const path = require('path');
const app = express();
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });
const getSessionConfig = require('../../../shared/middlewares/session_config');
const { sessionFromToken } = require('../../../shared/middlewares/auth_jwt');

app.use(express.json());
app.use(require('express-session')(getSessionConfig()));
app.use(sessionFromToken);

const witcherRouter = require('./routers/witcher_router');
app.use('/api', witcherRouter);

const { errorHandler, notFoundHandler } = require('../../../shared/middlewares/error_middleware');
app.use(notFoundHandler);
app.use(errorHandler);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'chatbot', timestamp: new Date().toISOString() });
});

const PORT = process.env.CHATBOT_SERVICE_PORT || 3006;

app.listen(PORT, () => {
    console.log(`Chatbot service corriendo en puerto ${PORT}`);
});
