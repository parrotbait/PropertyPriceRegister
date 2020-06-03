const { context } = require('../app')
const jwt = require('jsonwebtoken');
const sha1 = require('sha1');
const moment = require('moment')
const Token = require('../models/token')
const User = require('../models/user')
const { TokenService } = require('../services/tokenService')
const { UserService } = require('../services/userService')

const tokenService = new TokenService(Token)
const userService = new UserService(User)
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

setCommonHeaders = (res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Pragma', 'no-store')
}

getTokenJson = (token, tokenService) => {
  return {
    access_token: token.access_token,
    token_type: 'Bearer',
    expires_in: tokenService.expiration_seconds
  }
}

context.app.post('/authorize', async (req, res) => {
  // Read username and password from request body
  const { access_key, access_secret } = req.body;
  
  const user = await userService.fetchOne({ access_key, access_secret})
  if (user && Object.keys(user).length !== 0) {
    const existing = await tokenService.fetchOne({ access_key })
    if (existing && Object.keys(existing).length !== 0) {
      let now = moment()
      if (now.isBefore(moment(existing.end_date, 'YYYY-MM-DD HH:mm:ss'))) {
        setCommonHeaders(res)
        res.json(getTokenJson(existing, tokenService))
        return 
      }
    }

    // Generate an access token
    const token = jwt.sign({ username: user.token }, accessTokenSecret);
    const newToken = await tokenService.save({ access_token: token, access_key: access_key })
    setCommonHeaders(res)
    res.json(getTokenJson(newToken, tokenService))
  } else {
    res.send('Access key or secret incorrect');
  }
});