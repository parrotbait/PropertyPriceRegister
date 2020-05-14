const { context } = require('../app')
const Property = require('../models/property')
const { PropertyService } = require('../services/propertyService')
var authenticateJWT = require('../auth/jwt_middleware')

const propertyService = new PropertyService(Property)

context.app.get('/api/properties', authenticateJWT, async (req, res, next) => {
  propertyService.fetch(req.query).then(properties => {
    res.json(properties)
  })
})
