const { driver, connectNeo4j, getSession, closeNeo4j } = require('../../../shared/database/neo4j');
const { connectMongoDB } = require('../../../shared/database/mongodb');

module.exports = { driver, connectNeo4j, getSession, closeNeo4j, connectMongoDB };
