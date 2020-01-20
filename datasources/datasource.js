module.exports = {
    
    insert: async function(trx, table, query, primary_key, primary_value, data) {
        const insert_data = {}
        insert_data[primary_key] = primary_value
        let rs = null
        if (query) {
            rs = await trx(table).select('*').whereRaw(query)
        } else {
            rs = await trx(table).select('*').where(insert_data)
        }

        let property = rs && rs.shift()
        if (property) {
            return property
        }

        let final_data = { ...insert_data, ...data }
        await trx(table).insert(final_data)
        
        let new_rs = await trx(table).select('*').where(insert_data)
        return new_rs.shift()
    }
}

class Datasource {
    constructor(knex, table) {
        this.knex = knex
        this.tablename = table
    }

    create(values) {
        return this.knex.transaction(trx => {
            return this.createWithTable(this.tablename, values, trx)
            .then(trx.commit)
            .catch(trx.commit)
        })
    }

    createWithTable(tablename, values, trx) {
        return this.knex(tablename)
        .transacting(trx)
        .returning('*')
        .insert(values)
    }
}