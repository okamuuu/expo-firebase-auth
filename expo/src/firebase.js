import firebase from 'firebase';
import { FIREBASE_CONFIG } from '../config'

if (!firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}

export default firebase
