import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyD3uoUnhTdgMCfVTR1i155eEbO9UbTSLZA",
  authDomain: "lecture-ai-3aa5e.firebaseapp.com",
  projectId: "lecture-ai-3aa5e",
  storageBucket: "lecture-ai-3aa5e.firebasestorage.app",
  messagingSenderId: "37968712562",
  appId: "1:37968712562:web:41c9b3bc4f2188afce43eb"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const provider = new GoogleAuthProvider()
export const db = getFirestore(app)