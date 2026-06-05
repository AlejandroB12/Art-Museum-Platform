const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectMongoDB = require('../config/mongodb');
const { connectCassandra } = require('../config/cassandra');

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
    res.redirect('/public/Inicio.html');
});

const loginRoutes = require('../routes/Login');
const catalogoRoutes = require('../routes/Catalogo');
const adminRoutes = require('../routes/Admin');

app.use('/', loginRoutes);
app.use('/api', catalogoRoutes);
app.use('/', adminRoutes);

const PORT = process.env.PORT;

const startServer = async () => {
    await connectMongoDB();
    await connectCassandra();
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
};

startServer();
