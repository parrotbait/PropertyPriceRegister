const options = {
    client: 'mysql2',
    connection: {
        host: '127.0.0.1',
        user: 'user12',
        password: 's$cret',
        database: 'mydb'
    }
}

exports.knex = require('knex')(options)