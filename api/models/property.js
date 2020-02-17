const { Model } = require('objection')
const County = require('./county')
const Sale = require('./sale')

class Property extends Model {
  static get tableName() {
    return 'properties'
  }

  static get relationMappings() {
    return {
      property_county: {
        relation: Model.HasOneRelation,
        modelClass: County,
        join: {
          from: 'properties.county',
          to: 'counties.id'
        }
      },
      sales: {
        relation: Model.HasManyRelation,
        modelClass: Sale,
        join: {
          from: 'properties.id',
          to: 'sales.property_id'
        }
      }
    }
  }
}

module.exports = Property
