const moment = require('moment')

class PropertyService {
  constructor(propertyModel) {
    this.propertyModel = propertyModel
  }

  async fetch(params) {
    const query = this.propertyModel
      .query()
      .select(
        'uuid',
        'property_county.name as county',
        'lat',
        'lon'
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
            const date = moment(params.start_date, 'YYYY-M-D', true)
            if (date.isValid()) {
              builder.where('date', '>=', date.toISOString())
            }
          }
          if (params.end_date) {
            const date = moment(params.end_date, 'YYYY-M-D', true)
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
        }
      })
      .joinRelated('property_county')
      .whereNotNull('place_id')

    if (params.limit) {
      query.limit(params.limit)
    }
    
    if (params.county) {
      const counties = params.county.split(',').map(county => county.toLowerCase())
      query.whereRaw('LOWER(`property_county`.`name`) IN (?)', [counties])
    }
    
    if (params.query) {
      query.whereRaw('LOWER(address) LIKE ?', [`%${params.query}%`])
    }
    
    return query
  }

  async fetchOne(params) {
    const query = this.propertyModel
      .query()
      .select(
        'uuid',
        'address',
        'property_county.name as county',
        'lat',
        'lon'
      )
      .withGraphJoined('sales(selectSalesData, orderByCriteria)', {joinOperation: 'innerJoin'})
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
        }
      })
      .joinRelated('property_county')
      .whereNotNull('place_id')
      .where('uuid',  params.id)

    return query
  }
}

exports.PropertyService = PropertyService
