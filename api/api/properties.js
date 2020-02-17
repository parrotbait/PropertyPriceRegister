const { context } = require('../app')
const Property = require('../models/property')
const { PropertyService } = require('../services/propertyService')

const propertyService = new PropertyService(Property)

context.app.get('/api/properties', async (req, res, next) => {
  propertyService.fetch(req.query).then(properties => {
    res.json(properties)
  })
})
