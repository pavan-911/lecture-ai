import { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Save user to Firestore if first time
        const userRef = doc(db, 'users', u.uid)
        const userSnap = await getDoc(userRef)

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            name: u.displayName,
            email: u.email,
            photo: u.photoURL,
            streak: 0,
            lastActive: serverTimestamp(),
            createdAt: serverTimestamp(),
          })
        } else {
          // Update last active
          await setDoc(userRef, { lastActive: serverTimestamp() }, { merge: true })
        }
      }
      setUser(u)
    })
    return () => unsub()
  }, [])

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}