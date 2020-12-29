const result = require('dotenv').config();
if (result.error) {
    throw result.error;
}
const mysql = require('mysql');

// traditional db
const db =
    {
        host: result.parsed.DB_HOST,
        user: result.parsed.DB_USER,
        password: result.parsed.DB_PASS,
        database: 'project'
    };

const traditional = mysql.createConnection(db);
traditional.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('intoSql connected');
});


// pool
const pool  = mysql.createPool({
    connectionLimit : 10,
    host            : result.parsed.DB_HOST,
    user            : result.parsed.DB_USER,
    password        : result.parsed.DB_PASS,
    database        : 'project'
});

function intoSql (queryType, condition) {
    return new Promise((resolve, reject) => {
        traditional.query(queryType, condition, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    });
}

const queryPool = function (queryType, condition) {
    return new Promise((resolve, reject) => {
        
        pool.query(queryType, condition, (err, result, fields) => {
            if (err) reject(err);
            resolve(result);
        });
    });
};

module.exports = {db,queryPool,intoSql,pool};
