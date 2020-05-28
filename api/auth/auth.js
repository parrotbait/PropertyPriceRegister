const { context } = require('../app')
const jwt = require('jsonwebtoken');
const sha1 = require('sha1');
const Token = require('../models/token')
const User = require('../models/user')
const { TokenService } = require('../services/tokenService')
const { UserService } = require('../services/userService')

const tokenService = new TokenService(Token)
const userService = new UserService(User)
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

context.app.post('/authorize', async (req, res) => {
  // Read username and password from request body
  const { access_key, access_secret } = req.body;

  const user = await userService.fetchOne({ access_key, access_secret})
  if (user) {
    const existing = await tokenService.fetchOne({ access_key })
    if (existing && Object.keys(existing).length !== 0) {
      // TODO: Check time
      res.setHeader('Content-Type', 'application/json');
      res.json({
        token: existing.access_token,
        end_date: existing.end_date
      });
      return 
    }

    // Generate an access token
    const token = jwt.sign({ username: user.token }, accessTokenSecret);
    const newToken = await tokenService.save({ access_token: token, access_key: access_key })
    res.setHeader('Content-Type', 'application/json');
    res.json({
      token,
      end_date: newToken.end_date
    });
  } else {
    res.send('Access key or secret incorrect');
  }
});