const createError = require('http-errors')
const express = require('express')
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const crypto = require('crypto');
const OAuth = require('oauth-1.0a');

const qs = require('qs')
const HmacSHA1 = require('crypto-js/hmac-sha1')
const Base64 = require('crypto-js/enc-base64')
const { URLSearchParams } = require('url')


const port = process.env.PORT || 3000

const config = require('./config.js')

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/api/ping', (req, res) => {
    res.json({ ping: 'pong' }); 
});

app.post('/auth/google', async (req, res) => {

  async function createTokenWithGoogleCode(code, redirect_uri) {

    const url = `https://www.googleapis.com/oauth2/v4/token`
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        code,
        client_id: config.GOOGLE.CLIENT_ID,
        client_secret: config.GOOGLE.CLIENT_SECRET,
        redirect_uri,
        grant_type: 'authorization_code'
      })
    });
    
    return await res.json()
  }

  return res.json(await createTokenWithGoogleCode(req.body.code, req.body.redirect_uri))
});

app.post('/auth/github', async (req, res) => {

  async function createTokenWithGithubCode(code) {
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
    return await res.json()
  }

  return res.json(await createTokenWithGithubCode(req.body.code))
});

app.post('/auth/twitter/request_token', async (req, res) => {

  const { redirect_uri } = req.body

  // Step 1: Obtaining a request token
  const oauth = OAuth({
    consumer: {
      key: config.TWITTER.CLIENT_ID,
      secret: config.TWITTER.CLIENT_SECRET,
    },
    signature_method: 'HMAC-SHA1',
    hash_function: (baseString, key) => Base64.stringify(HmacSHA1(baseString, key))
  })

  const request_data = {
    url: 'https://api.twitter.com/oauth/request_token',
    method: 'POST',
    data: { 
      oauth_callback: redirect_uri,
    }
  };
 
  const response = await fetch(request_data.url, {
    method: request_data.method,
    headers: oauth.toHeader(oauth.authorize(request_data))
  })

  const text = await response.text();
  return res.json(qs.parse(text))
});

app.post('/auth/twitter/access_token', async (req, res) => {

  const { oauth_token, oauth_token_secret, oauth_verifier } = req.body

  const oauth = OAuth({
    consumer: {
      key: config.TWITTER.CLIENT_ID,
      secret: config.TWITTER.CLIENT_SECRET,
    },
    signature_method: 'HMAC-SHA1',
    hash_function: (baseString, key) => Base64.stringify(HmacSHA1(baseString, key))
  })

  const request_data = {
    url: 'https://api.twitter.com/oauth/access_token',
    method: 'POST',
    data: {
      oauth_verifier,  
    },
  }
  
  const headers = oauth.toHeader(oauth.authorize(request_data, {key: oauth_token, secret: oauth_token_secret}))
 
  const response = await fetch(request_data.url, {
    method: request_data.method,
    data: request_data.data,
    headers
  })
  
  if (response.status !== 200) {
    res.status = response.status
    return res.json({message: "something wrong"})
  }
  const text = await response.text();
  return res.json(qs.parse(text))
})

if (!module.parent) {
  app.listen(3000, () => {
    console.log('Example app listening on port 3000!');
  });
}

module.exports = app;
