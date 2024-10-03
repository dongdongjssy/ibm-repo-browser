// db client instance
const { CONNECTION } = require('../resources/config')

const pgp = require('pg-promise')({
    capSQL: true // capitalize all generated SQL
})
const client = pgp(CONNECTION)

module.exports = client