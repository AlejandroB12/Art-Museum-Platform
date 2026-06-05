const cassandra = require('cassandra-driver');
require('dotenv').config();

const client = new cassandra.Client({
    contactPoints: (process.env.CASSANDRA_CONTACT_POINTS || '127.0.0.1').split(','),
    localDataCenter: process.env.CASSANDRA_LOCAL_DC || 'datacenter1',
    keyspace: process.env.CASSANDRA_KEYSPACE || 'museo_db',
    queryOptions: {
        prepare: true,
        consistency: cassandra.types.consistencies.localQuorum
    }
});

const connectCassandra = async () => {
    try {
        await client.connect();
        console.log(`Cassandra conectado: ${client.hosts.first()?.address || 'desconocido'}`);
        return client;
    } catch (err) {
        console.error('Error conectando a Cassandra:', err.message);
        return null;
    }
};

const executeQuery = async (query, params = [], options = {}) => {
    try {
        const result = await client.execute(query, params, {
            prepare: true,
            consistency: options.consistency || cassandra.types.consistencies.localOne,
            ...options
        });
        return result;
    } catch (err) {
        console.error('Error en query Cassandra:', err.message);
        throw err;
    }
};

const executeBatch = async (queries, options = {}) => {
    try {
        const batch = queries.map(q => ({
            query: q.query,
            params: q.params || []
        }));
        await client.batch(batch, {
            prepare: true,
            consistency: options.consistency || cassandra.types.consistencies.localQuorum
        });
    } catch (err) {
        console.error('Error en batch Cassandra:', err.message);
        throw err;
    }
};

module.exports = { client, connectCassandra, executeQuery, executeBatch };
