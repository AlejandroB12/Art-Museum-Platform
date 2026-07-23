const { query, queryRaw, beginTransaction, commit, rollback } = require('../../../../shared/database/postgres');
const supabase = require('../../../../shared/database/supabase');
const { client, connectCassandra } = require('../../../../shared/database/cassandra');
const { connectMongoDB } = require('../../../../shared/database/mongodb');
const neo4j = require('../../../../shared/database/neo4j');

module.exports = {
    query, queryRaw, beginTransaction, commit, rollback,
    supabase, client, connectCassandra, connectMongoDB, neo4j
};
