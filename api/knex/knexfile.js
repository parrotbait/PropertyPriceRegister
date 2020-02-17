// Update with your config settings.

module.exports = {
  development: {
    client: 'mysql',
    connection: {
      host: 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    },
    debug: false,
    pool: {
      min: 1,
      max: 10
    }
  },
  staging: {},
  production: {}
}
