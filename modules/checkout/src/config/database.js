const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });

const sequelize = new Sequelize(process.env.SUPABASE_URL, {

    dialect: 'postgres',
    dialectOptions: { ssl: { rejectUnauthorized: false } },
    pool: { max: 2, min: 0, idle: 30000 },
    logging: false
});

const models = require('../models')(sequelize);

const { client } = require('../../../../shared/database/cassandra');
const { connectMongoDB } = require('../../../../shared/database/mongodb');
const { connectNeo4j, getSession } = require('../../../../shared/database/neo4j');

module.exports = {sequelize, Sequelize, ...models, client, connectMongoDB, connectNeo4j, getSession};
