require('dotenv/config');

const conn = function(dbclient){
    return {
    user: process.env.USER_DB,
    password: process.env.PASS_DB,
    host: 'localhost',
    database: `backupweb`,    
    port: 5432}
}

module.exports.conn = conn