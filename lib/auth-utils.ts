import { auth, googleProvider } from '@/lib/firebase'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  User
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

export async function registerWithEmail(email: string, password: string, username: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(userCredential.user, { displayName: username })
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
    if (!result.user.displayName) {
      // Set a default username for Google users if they don't have one
      await updateProfile(result.user, { 
        displayName: result.user.email?.split('@')[0] || 'User'
      })
    }
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

export async function updateUsername(newUsername: string) {
  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error('No user is currently signed in')
    }

    await updateProfile(user, { displayName: newUsername })
    // Force a refresh to ensure the new displayName is available immediately
    await user.reload()
    return { success: true, user }
  } catch (error) {
    console.error('Update username error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update username'
    }
  }
}

