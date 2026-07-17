const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

const getSessionConfig = () => {
    const store = new pgSession({
        conString: process.env.SUPABASE_URL,
        tableName: 'session',
        createTableIfMissing: true
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
