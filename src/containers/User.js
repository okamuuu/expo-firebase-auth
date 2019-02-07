import { Container } from 'unstated'
import firebase from '../firebase';
import { FIREBASE_CONFIG } from './../../config'

class UserContainer extends Container {

  state = {
    user: null
  }

  constructor(props) {
    super(props);
    firebase.auth().onAuthStateChanged((user) => {
      console.log(user.toJSON())
      if (user) {
        this.setState({ user: user.toJSON() });
      } else {
        this.setState({ user: null });
      }
    })
  }
}

export default UserContainer
