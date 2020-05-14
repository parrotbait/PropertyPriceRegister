const { context } = require('../app')
var authenticateJWT = require('../auth/jwt_middleware')
const Property = require('../models/property')
const { PropertyService } = require('../services/propertyService')

const propertyService = new PropertyService(Property)

context.app.get('/api/property', authenticateJWT, async (req, res, next) => {
  propertyService.fetchOne(req.query).then(properties => {
    res.json(properties.length ? properties[0] : {})
  })
})
