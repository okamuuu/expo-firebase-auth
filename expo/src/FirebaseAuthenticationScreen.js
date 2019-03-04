import React from 'react';
import { StyleSheet } from 'react-native';
import { Container, Header, Content, Button, Text, Thumbnail } from 'native-base';
import { Provider, Subscribe } from 'unstated'
import firebase from './firebase';
import Expo, { AuthSession, Google, Facebook } from 'expo';
import qs from 'qs'
import OAuth from 'oauth-1.0a'
import HmacSHA1 from 'crypto-js/hmac-sha1';
import Base64 from 'crypto-js/enc-base64';
import UserContainer from './containers/User'
import { FACEBOOK_APP_ID, GOOGLE, GITHUB, TWITTER } from '../config'

const REDIRECT_URL = AuthSession.getRedirectUrl();

async function createTokenWithCode(provider, code) {
  const url = `http://localhost:3000/auth/${provider}/`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      redirect_uri: REDIRECT_URL // Google で必要
    })
  });
  return await res.json();
}

async function getTwitterRequestToken() {
  const url = `http://localhost:3000/auth/twitter/request_token`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      redirect_uri: REDIRECT_URL
    })
  });
  return await res.json();
}

async function getTwitterAccessToken(params) {
  const { oauth_token, oauth_token_secret, oauth_verifier } = params
  const url = `http://localhost:3000/auth/twitter/access_token`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ oauth_token, oauth_token_secret, oauth_verifier })
  });
  return await res.json();
}

export default class FirebaseAuthenticationScreen extends React.Component {

  handleLogout() { 
    firebase.auth().signOut()
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
      firebase.auth().signInAndRetrieveDataWithCredential(credential).catch(console.error)
    }
  }

  // https://developer.twitter.com/en/docs/twitter-for-websites/log-in-with-twitter/guides/implementing-sign-in-with-twitter
  async handleTwitterLogin() {

    // get request token
    const { oauth_token, oauth_token_secret } = await getTwitterRequestToken()

    // get verifier
    const { params }  = await AuthSession.startAsync({
      authUrl: `https://api.twitter.com/oauth/authenticate?oauth_token=${oauth_token}`
    });

    // get access token
    const oauth_verifier = params.oauth_verifier
    const result = await getTwitterAccessToken({oauth_token, oauth_token_secret, oauth_verifier})

    const credential = firebase.auth.TwitterAuthProvider.credential(
      result.oauth_token, 
      result.oauth_token_secret
    )
    const user = await firebase.auth().signInAndRetrieveDataWithCredential(credential);
    console.log(user)
  }

  async handleGithubLogin() {

    const { params } = await AuthSession.startAsync({
      authUrl: authUrlWithId(GITHUB.CLIENT_ID, ['user']),
    });

    const { access_token } = await createTokenWithCode('github', params.code);

    const credential = firebase.auth.GithubAuthProvider.credential(access_token);
    const user = await firebase.auth().signInAndRetrieveDataWithCredential(credential);

    function authUrlWithId(id, fields) {
      return (
        `https://github.com/login/oauth/authorize` +
        `?client_id=${id}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URL)}` +
        `&scope=${encodeURIComponent(fields.join(' '))}`
      );
    }
  }

  // https://developers.google.com/identity/protocols/OAuth2WebServer
  async handleGoogleLogin() {

    // Redirect to Google's OAuth 2.0 server
    const result = await AuthSession.startAsync({
      authUrl:
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `&client_id=${GOOGLE.CLIENT_ID}` +
        `&redirect_uri=${REDIRECT_URL}` +
        `&response_type=code` +
        `&access_type=offline` +
        `&scope=profile`,
    });

    const { id_token } = await createTokenWithCode('google', result.params.code)

    var credential = firebase.auth.GoogleAuthProvider.credential(id_token);
    firebase.auth().signInAndRetrieveDataWithCredential(credential).catch(console.error)
  }

  render() {
    return (
      <Provider>
        <Subscribe to={[UserContainer]}>
          {userContainer => {
            const user = userContainer.state.user || {}
            return (
              <Container>
                <Header />
                <Content style={styles.content}>
                  <Text>{ user.displayName }</Text>
                  <Thumbnail large source={{uri: user.photoURL}} />
                </Content>
                <Content style={styles.content}>
                  <Text>Firebase Authentication</Text>
                  <Button onPress={this.handleFacebookLogin}>
                    <Text>Facebook</Text>
                  </Button>
                  <Button onPress={this.handleGoogleLogin}>
                    <Text>Google</Text>
                  </Button>
                  <Button onPress={this.handleGithubLogin}>
                    <Text>Github</Text>
                  </Button>
                  <Button onPress={this.handleTwitterLogin}>
                    <Text>Twitter</Text>
                  </Button>
                  <Button onPress={this.handleLogout}>
                    <Text>Logout</Text>
                  </Button>
                </Content>
              </Container>
          )}}
        </Subscribe>
      </Provider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
  },
  content: {
    padding: 30,
  },
  header: {
    alignItems: "center",
    justifyContent: "center"
  },
  footer: {
    alignItems: "center",
    justifyContent: "center"
  }
});
