module.exports = {
  async insert(trx, table, query, primaryKey, primaryValue, data) {
    const insertData = {}
    insertData[primaryKey] = primaryValue
    let rs = null
    if (query) {
      rs = await trx(table)
        .select('*')
        .whereRaw(query)
    } else {
      rs = await trx(table)
        .select('*')
        .where(insertData)
    }

    const property = rs && rs.shift()
    if (property) {
      return property
    }

    const finalData = { ...insertData, ...data }
    await trx(table).insert(finalData)

    const newRs = await trx(table)
      .select('*')
      .where(insertData)
    return newRs.shift()
  }
}
