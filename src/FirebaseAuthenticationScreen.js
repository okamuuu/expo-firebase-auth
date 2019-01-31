import React from 'react';
import { Container, Header, Content, Button, Text } from 'native-base';
import firebase from 'firebase';
import Expo, { Google, Facebook } from 'expo';
import { FACEBOOK_APP_ID, GITHUB, FIREBASE_CONFIG } from '../config'
import { AuthSession } from 'expo';

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
          <Button onPress={this.handleGithubLogin}>
            <Text>Github</Text>
          </Button>
 
        </Content>
      </Container>
    );
  }
}
