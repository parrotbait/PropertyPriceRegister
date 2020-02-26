const { context } = require('../app')
const Property = require('../models/property')
const { PropertyService } = require('../services/propertyService')

const propertyService = new PropertyService(Property)

context.app.get('/api/property', async (req, res, next) => {
  propertyService.fetchOne(req.query).then(properties => {
    res.json(properties.length ? properties[0] : {})
  })
})
