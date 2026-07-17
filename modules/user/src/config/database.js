const { query, queryRaw } = require('../../../../shared/database/postgres');
const { client } = require('../../../../shared/database/cassandra');

module.exports = { query, queryRaw, client };
