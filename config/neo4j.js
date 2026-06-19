const neo4j = require('neo4j-driver');
require('dotenv').config();

const driver = neo4j.driver(
    process.env.NEO4J_URI || 'neo4j://localhost:7687',
    neo4j.auth.basic(
        process.env.NEO4J_USERNAME || 'neo4j',
        process.env.NEO4J_PASSWORD || 'password'
    ),
    {
        maxConnectionPoolSize: 10,
        connectionTimeout: 30000
    }
);

const connectNeo4j = async () => {
    try {
        await driver.verifyConnectivity();
        console.log('Neo4j conectado (Aura DB)');
        return driver;
    } catch (err) {
        console.error('Error conectando a Neo4j Aura DB:', err.message);
        console.log('  Neo4j: No se pudo conectar. Verifica credenciales en .env');
        return null;
    }
};

const getSession = () => {
    return driver.session();
};

const closeNeo4j = async () => {
    await driver.close();
};

module.exports = { driver, connectNeo4j, getSession, closeNeo4j };
