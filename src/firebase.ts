import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Use initializeFirestore with auto-detect long polling for better stability in the preview environment
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || '(default)');

export const googleProvider = new GoogleAuthProvider();

// Validate Connection to Firestore
async function testConnection(retries = 5) {
  console.log("Starting Firestore connection test...");
  // Small delay to allow network to stabilize
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  for (let i = 0; i < retries; i++) {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      console.log("Firestore connection successful");
      return;
    } catch (error: any) {
      const isUnavailable = error?.code === 'unavailable' || (error instanceof Error && error.message.includes('the client is offline'));
      if (isUnavailable && i < retries - 1) {
        console.warn(`Firestore connection attempt ${i + 1} failed (unavailable), retrying in ${2 * (i + 1)}s...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
        continue;
      }
      if (isUnavailable) {
        console.error("CRITICAL: Could not reach Firestore backend after multiple attempts. This usually means the network is blocking the connection or the database is not provisioned correctly.");
      } else {
        console.log("Firestore connection test completed (likely successful or permission denied on test doc)");
      }
      break;
    }
  }
}
testConnection();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      console.log("Sign-in cancelled by user");
    } else {
      console.error("Error signing in with Google", error);
    }
    return null;
  }
};
