const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const getSessionConfig = () => {
    const store = new MySQLStore({
        host: process.env.DB_HOST_MYSQL,
        port: 3306,
        user: process.env.DB_USER_MYSQL,
        password: process.env.DB_PASSWORD_MYSQL,
        database: process.env.DB_NAME_MYSQL,
        createDatabaseTable: true,
        schema: {
            tableName: 'sessions',
            columnNames: {
                session_id: 'session_id',
                expires: 'expires',
                data: 'data'
            }
        }
    });

    return {
        secret: process.env.SESSION_SECRET,
        store,
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }
    };
};

module.exports = getSessionConfig;
