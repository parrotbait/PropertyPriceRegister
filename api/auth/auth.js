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
  if (!access_key) {
    res.sendStatus(400).end('Missing access_key')
    return
  }
  if (!access_secret) {
    res.sendStatus(400).end('Missing access_secret')
    return 
  }
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

    if (!req.headers.origin ) {
      console.log('Missing origin header')
      res.sendStatus(400).end('Missing origin header')
      return
    }

    if (user.origin !== '*' && req.headers.origin.indexOf(user.origin) === -1) {
      res.sendStatus(501).end(`Invalid origin, ${req.headers.origin}`)
      return
    }

    // Generate an access token
    const token = jwt.sign({ username: user.token }, accessTokenSecret);
    tokenService.save({ access_token: token, access_key: access_key }).then(newToken => {
      setCommonHeaders(res)
      res.json(getTokenJson(newToken, tokenService))
    })
    .catch(err => {
      console.log(JSON.stringify(err))
      res.sendStatus(503)
    })
    
  } else {
    res.send('Access key or secret incorrect');
  }
});