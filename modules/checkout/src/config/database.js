const { query, queryRaw, beginTransaction, commit, rollback } = require('../../../../shared/database/postgres');
const { client } = require('../../../../shared/database/cassandra');
const { connectMongoDB } = require('../../../../shared/database/mongodb');
const { connectNeo4j, getSession } = require('../../../../shared/database/neo4j');

module.exports = { query, queryRaw, client, connectMongoDB, connectNeo4j, getSession, beginTransaction, commit, rollback };
