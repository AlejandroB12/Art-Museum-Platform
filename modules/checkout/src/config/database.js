const { db, query, queryRaw } = require('../../../shared/database/mysql');
const { client } = require('../../../shared/database/cassandra');
const { connectMongoDB } = require('../../../shared/database/mongodb');
const { connectNeo4j, getSession } = require('../../../shared/database/neo4j');

module.exports = { db, query, queryRaw, client, connectMongoDB, connectNeo4j, getSession };
