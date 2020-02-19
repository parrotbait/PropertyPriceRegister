const { context } = require('../app')
const Property = require('../models/property')
const { PropertyService } = require('../services/propertyService')

const propertyService = new PropertyService(Property)

context.app.get('/api/property', async (req, res, next) => {
  req.query.limit = 1
  propertyService.fetch(req.query).then(properties => {
    res.json(properties.length ? properties[0] : {})
  })
})
