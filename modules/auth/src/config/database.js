const { Sequelize } = require('sequelize');
const path = require('path');
const cassandra = require('express-cassandra');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });

const sequelize = new Sequelize(process.env.SUPABASE_URL, {
    dialect: 'postgres',
    dialectOptions: { ssl: { rejectUnauthorized: false } },
    pool: { max: 5, min: 0, idle: 30000 },
    logging: false
});

const models = require('../models/sequelize')(sequelize);

cassandra.setDirectory(path.join(__dirname, '..', 'models', 'cassandra'));

const connectCassandra = () => {
    return new Promise((resolve) => {
        cassandra.bind({
            clientOptions: {
                cloud: { secureConnectBundle: path.resolve(process.env.CASSANDRA_SECURE_BUNDLE_PATH) },
                credentials: {
                    username: process.env.CASSANDRA_CLIENT_ID,
                    password: process.env.CASSANDRA_CLIENT_SECRET
                },
                keyspace: process.env.CASSANDRA_KEYSPACE || 'museo_db'
            },
            ormOptions: {
                defaultReplicationStrategy: {
                    class: 'SimpleStrategy',
                    replication_factor: 1
                },
                migration: 'safe'
            }
        }, (err) => {
            if (err) {
                console.error('Error conectando Cassandra:', err.message);
                resolve(null);
            } else {
                console.log('Cassandra conectado via express-cassandra');
                resolve(cassandra);
            }
        });
    });
};

module.exports = { sequelize, Sequelize, ...models, cassandraModels: cassandra, connectCassandra };
