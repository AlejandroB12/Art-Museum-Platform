const dns = require('dns');
const path = require('path');
const cassandra = require('cassandra-driver');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

dns.setServers(['8.8.8.8', '8.8.4.4']);

const client = new cassandra.Client({
    cloud: { secureConnectBundle: path.resolve(process.env.CASSANDRA_SECURE_BUNDLE_PATH) },
    credentials: {
        username: process.env.CASSANDRA_CLIENT_ID,
        password: process.env.CASSANDRA_CLIENT_SECRET
    },
    keyspace: process.env.CASSANDRA_KEYSPACE || 'museo_db',
    queryOptions: { prepare: true }
});

const connectCassandra = async () => {
    try {
        await client.connect();
        console.log('Cassandra conectado (DataStax Astra)');
        return client;
    } catch (err) {
        console.error('Error conectando a DataStax Astra:', err.message);
        return null;
    }
};

module.exports = { client, connectCassandra };
