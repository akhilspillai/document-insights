import * as firebaseui from 'firebaseui';
import { auth } from './firebase';

// Create a single FirebaseUI Auth instance bound to our Firebase Auth.
const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(auth);

export { ui };
