const { context } = require('../app')
const jwt = require('jsonwebtoken');

const users = [{
  userId: 1234567,
  access_key: "mytoken",
  access_secret: 'password',
}];
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

context.app.post('/authorize', (req, res) => {
  // Read username and password from request body
  const { access_key, access_secret } = req.body;

  // Filter user from the users array by username and password
  const user = users.find(u => { return u.access_key === access_key && u.access_secret === access_secret });

  if (user) {
    // Generate an access token
    const accessToken = jwt.sign({ username: user.token }, accessTokenSecret);

    res.setHeader('Content-Type', 'application/json');
    res.json({
        accessToken
    });
  } else {
    res.send('Access key or secret incorrect');
  }
});