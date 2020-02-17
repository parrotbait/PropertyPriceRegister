const { context } = require('../app')
const County = require('../models/county')
const { CountyService } = require('../services/countyService')

const countyService = new CountyService(County)

context.app.get('/api/counties', async (req, res, next) => {
  countyService.fetch(req.query).then(counties => {
    res.json(counties)
  })
})
