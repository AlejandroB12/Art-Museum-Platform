const { db, query, beginTransaction, commit, rollback, queryRaw } = require('../../../shared/database/mysql');
const { client } = require('../../../shared/database/cassandra');
const { connectMongoDB } = require('../../../shared/database/mongodb');
const { connectNeo4j } = require('../../../shared/database/neo4j');

module.exports = { db, query, beginTransaction, commit, rollback, queryRaw, client, connectMongoDB, connectNeo4j };
