const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })
const express = require('express')
const cors = require('cors')
const { Model } = require('objection')
const knex = require('./knex/knex.js')
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express()
app.use(cors())
app.use(bodyParser.json());

Model.knex(knex)

app.get('/', (req, res) => {
  res.send('Irish Property Price Register is alive!')
})

app.listen(process.env.PORT, () =>
  console.log(
    `Irish Property Price Register listening on port ${process.env.PORT}!`
  )
)

const context = { knex, app }
exports.context = context

require('./api/property')
require('./api/properties')
require('./api/counties')
require('./auth/auth')