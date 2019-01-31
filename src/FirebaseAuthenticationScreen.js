import React from 'react';
import { Container, Header, Content, Button, Text } from 'native-base';
import firebase from 'firebase';
import Expo, { Google, Facebook } from 'expo';
import { FACEBOOK_APP_ID, FIREBASE_CONFIG } from '../config'

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
            <Text>Click Me!</Text>
          </Button>
        </Content>
      </Container>
    );
  }
}
