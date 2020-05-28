const jwt = require('jsonwebtoken');
const Token = require('../models/token')
const { TokenService } = require('../services/tokenService')
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

const tokenService = new TokenService(Token)

module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    // Look up the token in the DB and see if still valid, if not valid we return 401/403
    const existing = await tokenService.fetchOne({ access_token: token })
    if (!existing || Object.keys(existing).length === 0) {
      return res.sendStatus(403);
    }

    jwt.verify(token, accessTokenSecret, (err, user) => {
      if (err) {
          return res.sendStatus(403);
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};