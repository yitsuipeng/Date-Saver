const result = require('dotenv').config();
if (result.error) {
    throw result.error;
}
const mysql = require('mysql');

// control develop / test
const dbStatus = 'project';

const pool  = mysql.createPool({
    connectionLimit : 10,
    host            : result.parsed.DB_HOST,
    user            : result.parsed.DB_USER,
    password        : result.parsed.DB_PASS,
    database        : dbStatus
});

const queryPool = function (queryType, condition) {
    return new Promise((resolve, reject) => {
        
        pool.query(queryType, condition, (err, result, fields) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

module.exports = {queryPool,dbStatus};
