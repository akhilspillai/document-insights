import { linkWithPopup, signInWithPopup, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';

/**
 * Ensures the current user is signed in with Google.
 * If the user is anonymous, attempts to link the anonymous account to Google.
 * Falls back to credential-based sign-in if linking fails (e.g., credential already in use).
 * Returns the signed-in user.
 */
export async function ensureGoogleSignIn(auth, googleProvider) {
  const currentUser = auth.currentUser;

  // Already signed in with Google (not anonymous)
  if (currentUser && !currentUser.isAnonymous) {
    return currentUser;
  }

  // Anonymous user — try to link with Google
  if (currentUser && currentUser.isAnonymous) {
    try {
      const result = await linkWithPopup(currentUser, googleProvider);
      return result.user;
    } catch (err) {
      if (err.code === 'auth/credential-already-in-use') {
        // Google account already exists — reuse the credential from the
        // failed link attempt to sign in without opening a second popup
        const credential = GoogleAuthProvider.credentialFromError(err);
        if (credential) {
          const result = await signInWithCredential(auth, credential);
          return result.user;
        }
        // Credential extraction failed, fall through to popup
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
      }
      throw err;
    }
  }

  // No user at all — sign in directly
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}
