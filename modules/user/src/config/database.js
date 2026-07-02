const { db, query, queryRaw } = require('../../../../shared/database/mysql');
const { client } = require('../../../../shared/database/cassandra');

module.exports = { db, query, queryRaw, client };
