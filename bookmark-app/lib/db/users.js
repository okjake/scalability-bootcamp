const { Pool } = require('pg');
const config = require('config');
const client = new Pool(config.get('db'));

const users = module.exports;

users.create = function(params, callback) {
  const query = 'INSERT INTO users(email) values($1) RETURNING id';
  return client.query(query, [params.email], (err, result) => {
    if (err) callback(err);
    callback(null, result.rows[0].id);   
  });
};