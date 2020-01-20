
const Datasource = require('./datasource')

class Property extends Datasource {
    constructor(knex) {
        this.knex = knex
        
    }
}