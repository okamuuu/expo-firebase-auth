import React from 'react';
import { Container, Header, Content, Button, Text } from 'native-base';
import firebase from 'firebase';
import Expo, { AuthSession, Google, Facebook } from 'expo';
import qs from 'qs'
import OAuth from 'oauth-1.0a'
import HmacSHA1 from 'crypto-js/hmac-sha1';
import Base64 from 'crypto-js/enc-base64';

import { FACEBOOK_APP_ID, GITHUB, TWITTER, FIREBASE_CONFIG } from '../config'

const REDIRECT_URL = AuthSession.getRedirectUrl();

firebase.initializeApp(FIREBASE_CONFIG);

export default class FirebaseAuthenticationScreen extends React.Component {

  componentWillMount() {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        this.setState({ loggedIn: true });
      } else {
        this.setState({ loggedIn: false });
      }
    })
  }
  async handleFacebookLogin() {
    const result = await Facebook.logInWithReadPermissionsAsync(
      FACEBOOK_APP_ID,
      { permissions: ['public_profile'] }
    );

    const { type, token } = result

    if (type === 'success') {
      // Build Firebase credential with the Facebook access token.
      const credential = firebase.auth.FacebookAuthProvider.credential(token);

      // Sign in with credential from the Facebook user.
      firebase.auth().signInAndRetrieveDataWithCredential(credential).catch((error) => {
        // Handle Errors here.
      });
    }
  }

  async handleTwitterLogin() {

    const oauth = OAuth({
      consumer: {
        key: TWITTER.CLIENT_ID,
        secret: TWITTER.CLIENT_SECRET,
      },
      signature_method: 'HMAC-SHA1',
      hash_function: (baseString, key) => Base64.stringify(HmacSHA1(baseString, key))
    })
    const token = {
      key: TWITTER.TOKEN,
      secret: TWITTER.TOKEN_SECRET,
    };

    const request_data = {
      url: 'https://api.twitter.com/oauth/request_token',
      method: 'POST',
      data: { 
        oauth_callback: REDIRECT_URL,
      }
    };
 
    const oauth_callback = request_data.data.oauth_callback
    const response = await fetch(request_data.url, {
      method: request_data.method,
      // body: JSON.stringify({ oauth_callback }),
      headers: oauth.toHeader(oauth.authorize(request_data, token)),
    }).catch(console.error)
    
    const { oauth_token, oauth_token_secret, oauth_callback_confirmed } = qs.parse(await response.text())
    const { params }  = await AuthSession.startAsync({
      authUrl: `https://api.twitter.com/oauth/authenticate?oauth_token=${oauth_token}`
    });

    console.log(params)

    const formData = new FormData();
    formData.append("oauth_verifier", params.oauth_verifier);

    const requestTokenData = {
      url: 'https://api.twitter.com/oauth/access_token',
      method: 'POST',
      data: formData,
    }
    const headers = oauth.toHeader(oauth.authorize(requestTokenData, {key: oauth_token, secret: oauth_token_secret}))
    
    const req = new Request(requestTokenData.url, {
      method: 'POST',
      body: formData,
      headers
    })
    const response2 = await fetch(req).catch(console.error)
    const x = qs.parse(await response2.text())
    const credential = firebase.auth.TwitterAuthProvider.credential(x.oauth_token, x.oauth_token_secret);
    const user = await firebase.auth().signInAndRetrieveDataWithCredential(credential);
    console.log(user)
  }

  async handleGithubLogin() {

    const { params } = await AuthSession.startAsync({
      authUrl: authUrlWithId(GITHUB.CLIENT_ID, ['user']),
    });

    const { access_token } = await createTokenWithCode(params.code);

    const credential = firebase.auth.GithubAuthProvider.credential(access_token);
    const user = await firebase.auth().signInAndRetrieveDataWithCredential(credential);
    console.log(user)

    function authUrlWithId(id, fields) {
      return (
        `https://github.com/login/oauth/authorize` +
        `?client_id=${id}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URL)}` +
        `&scope=${encodeURIComponent(fields.join(' '))}`
      );
    }

    async function createTokenWithCode(code) {
      const url =
        `https://github.com/login/oauth/access_token` +
        `?client_id=${GITHUB.CLIENT_ID}` +
        `&client_secret=${GITHUB.CLIENT_SECRET}` +
        `&code=${code}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return res.json();
    }
  }

  async handleGoogleLogin() {
    try {
      const result = await Google.logInAsync({
        clientId: "",
      });
      console.log(result)
    } catch (err) {
      console.log("Googleトークン取得エラー");
      alert("ログインに失敗しました\n\n" + err.message)
      return;
    }
  }

  render() {
    return (
      <Container>
        <Header />
        <Content>
          <Text>Firebase Authentication</Text>
          <Button onPress={this.handleFacebookLogin}>
            <Text>Facebook</Text>
          </Button>
          <Button onPress={this.handleTwitterLogin}>
            <Text>Twitter</Text>
          </Button>
           <Button onPress={this.handleGithubLogin}>
            <Text>Github</Text>
          </Button>
 
        </Content>
      </Container>
    );
  }
}
