const moment = require('moment')

class PropertyService {
  constructor(propertyModel) {
    this.propertyModel = propertyModel
  }

  async fetch(params) {
    const query = this.propertyModel
      .query()
      .select(
        'address',
        'property_county.name as county',
        'lat',
        'lon',
        'postcode'
      )
      .withGraphJoined('sales(selectSalesData, queryFilters, orderByCriteria)', {joinOperation: 'innerJoin'})
      .modifiers({
        selectSalesData: builder => {
          builder.select('price', 'date');
        },
        orderByCriteria: builder => {
          if (params.order && params.sort) {
            builder.orderBy(params.sort, params.order)
          } else {
            builder.orderBy('date', 'desc')
          }
        },
        queryFilters: builder => {
          if (params.start_date) {
            const date = moment(params.start_date, 'YYYY-MM-DD', true)
            if (date.isValid()) {
              builder.where('date', '>=', date.toISOString())
            }
          }
          if (params.end_date) {
            const date = moment(params.end_date, 'YYYY-MM-DD', true)
            if (date.isValid()) {
              builder.where('date', '<=', date.toISOString())
            }
          }
          if (params.min_price) {
            const number = Number(params.min_price)
            builder.where('price', '>=', number)
          }
          if (params.max_price) {
            const number = Number(params.max_price)
            builder.where('price', '<=', number)
          }
          //builder.where('species', 'dog');
        }
      })
      .joinRelated('property_county')
      .whereNotNull('place_id')

    if (params.limit) {
      query.limit(params.limit)
    }
    
    if (params.county) {
      query.whereRaw('LOWER(`property_county`.`name`) = ?', [
        params.county.toLowerCase()
      ])
    }
    
    if (params.query) {
      query.whereRaw('LOWER(address) LIKE ?', [`%${params.query}%`])
    }

    
    //query.debug()
    return query
  }
}

exports.PropertyService = PropertyService
