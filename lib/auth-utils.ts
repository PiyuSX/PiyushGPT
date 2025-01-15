import { auth, googleProvider } from '@/lib/firebase'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  signOut as firebaseSignOut
} from 'firebase/auth'

export async function loginWithEmail(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { success: true, user: userCredential.user }
  } catch (error: any) {
    console.error('Login error:', error)
    return { 
      success: false, 
      error: error.code === 'auth/invalid-credential' 
        ? 'Invalid email or password'
        : 'Failed to login. Please try again.'
    }
  }
}

export async function registerWithEmail(email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return { success: true, user: userCredential.user }
  } catch (error: any) {
    console.error('Registration error:', error)
    return { 
      success: false, 
      error: error.code === 'auth/email-already-in-use'
        ? 'Email already in use'
        : 'Failed to register. Please try again.'
    }
  }
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    return { success: true, user: result.user }
  } catch (error: any) {
    console.error('Google login error:', error)
    return { 
      success: false, 
      error: error.code === 'auth/popup-closed-by-user'
        ? 'Sign in was cancelled'
        : 'Failed to login with Google. Please try again.'
    }
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth)
    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
    return { success: false, error: 'Failed to log out' }
  }
}

