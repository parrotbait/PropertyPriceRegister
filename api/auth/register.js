const { context } = require('../app')
const User = require('../models/user')
const { UserService } = require('../services/userService')
const crypto = require('crypto');
const sha1 = require('sha1');

const userService = new UserService(User)

async function createUser(req, res) {
  // Read username and password from request body
  const { first_name, second_name, email, password, host } = req.body;

  const user = await userService.fetchOne({ email: email })
  // Filter user from the users array by username and password
  if (!user || Object.keys(user).length === 0) {
    // Generate an access token
    const access_key = crypto.createHmac('sha512', email).digest("hex")
    const access_secret = sha1(password)
    
    const newUser = await userService.add({ first_name, second_name, email, access_key, access_secret: access_secre, origin: host })
    if (newUser && Object.keys(newUser).length !== 0) {
      res.setHeader('Content-Type', 'application/json');
      res.json({
        id: newUser.uuid,
        email: newUser.email,
        access_key: access_key,
        access_secret: access_secret
      });
    } else {
      res.sendStatus(501)
    }
  } else {
    res.json({
      id: user.uuid,
      email: user.email,
      access_key: user.access_key,
      access_secret: user.access_secret
    });
  }
}

context.app.post('/register', async (req, res) => {
  try {
    await createUser(req, res)
  } catch (err) {
    console.log(JSON.stringify(err))
    res.sendStatus(500)
  }
});