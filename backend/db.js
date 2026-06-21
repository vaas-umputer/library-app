const {Pool} = require('pg');

const pool = new Pool({
    user: 'root',        // change if your pg user is different
    host: 'localhost',
    database: 'library',
    password: 'root',    // change to your actual password
    port: 5432,
})

module.exports = pool;