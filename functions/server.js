const createError = require('http-errors')
const express = require('express')
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const crypto = require('crypto');
const OAuth = require('oauth-1.0a');
const port = process.env.PORT || 3000

const config = require('./config.js')

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/api/ping', (req, res) => {
    res.json({ ping: 'pong' }); 
});

app.post('/auth/github', async (req, res) => {

  // TODO: validate code
  const code = req.body.code

  const result = await createTokenWithCode(code);

  return res.json(result)

  async function createTokenWithCode(code) {
    const url =
      `https://github.com/login/oauth/access_token` +
      `?client_id=${config.GITHUB.CLIENT_ID}` +
      `&client_secret=${config.GITHUB.CLIENT_SECRET}` +
      `&code=${code}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    return res.json(); // return Promise Object
  }
});

if (!module.parent) {
  app.listen(3000, () => {
    console.log('Example app listening on port 3000!');
  });
}

module.exports = app;
