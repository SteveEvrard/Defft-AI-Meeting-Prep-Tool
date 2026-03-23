import { FirebaseError, getApp, getApps, initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  getIdTokenResult,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signInWithCredential,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'

const ALLOWED_EMAIL_DOMAIN = 'defft.ai'
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? ''
const GOOGLE_ACCESS_TOKEN_STORAGE_KEY = 'meeting-prep-tool.google-access-token'
const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60_000

interface FirebaseAuthConfig {
  apiKey: string
  appId: string
  authDomain: string
  messagingSenderId: string
  projectId: string
  storageBucket: string
}

export interface AuthUser {
  email?: string
  initials: string
  name: string
  username: string
}

export interface AuthSession {
  email?: string
  expiresAt: number
  googleAccessToken?: string
  googleAccessTokenExpiresAt?: number
  idToken: string
  user: AuthUser
}

interface StoredGoogleAccessToken {
  accessToken: string
  expiresAt: number
}

const readConfig = (): FirebaseAuthConfig | null => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim()
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim()
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim()
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim()
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim()
  const appId = import.meta.env.VITE_FIREBASE_APP_ID?.trim()

  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    return null
  }

  return {
    apiKey,
    appId,
    authDomain,
    messagingSenderId,
    projectId,
    storageBucket,
  }
}

const firebaseConfig = readConfig()
const firebaseApp = firebaseConfig
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null
const auth = firebaseApp ? getAuth(firebaseApp) : null
const persistenceReady = auth ? setPersistence(auth, browserLocalPersistence) : Promise.resolve()

const isAllowedEmail = (email?: string | null) =>
  Boolean(email?.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`))

const toInitials = (value: string) =>
  value
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'U'

const buildUser = (user: User): AuthUser => {
  const email = user.email ?? undefined
  const name = user.displayName?.trim() || email || 'Authenticated user'

  return {
    email,
    initials: toInitials(name),
    name,
    username: email ?? user.uid,
  }
}

const storeGoogleAccessToken = (accessToken: string, expiresInSeconds?: number) => {
  if (!expiresInSeconds) {
    return
  }

  const value: StoredGoogleAccessToken = {
    accessToken,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  }

  window.localStorage.setItem(GOOGLE_ACCESS_TOKEN_STORAGE_KEY, JSON.stringify(value))
}

const clearGoogleAccessToken = () => {
  window.localStorage.removeItem(GOOGLE_ACCESS_TOKEN_STORAGE_KEY)
}

const readStoredGoogleAccessToken = (): StoredGoogleAccessToken | null => {
  const stored = window.localStorage.getItem(GOOGLE_ACCESS_TOKEN_STORAGE_KEY)

  if (!stored) {
    return null
  }

  try {
    const parsed = JSON.parse(stored) as StoredGoogleAccessToken

    if (parsed.expiresAt <= Date.now() + ACCESS_TOKEN_REFRESH_BUFFER_MS) {
      clearGoogleAccessToken()
      return null
    }

    return parsed
  } catch {
    clearGoogleAccessToken()
    return null
  }
}

const ensureAllowedDomain = async (user: User) => {
  if (isAllowedEmail(user.email)) {
    return
  }

  if (auth) {
    await firebaseSignOut(auth)
  }

  throw new Error(`Use your @${ALLOWED_EMAIL_DOMAIN} email address to sign in.`)
}

const buildSession = async (user: User): Promise<AuthSession> => {
  const tokenResult = await getIdTokenResult(user)
  const storedGoogleAccessToken = readStoredGoogleAccessToken()

  return {
    email: user.email ?? undefined,
    expiresAt: tokenResult.expirationTime ? new Date(tokenResult.expirationTime).getTime() : Date.now(),
    googleAccessToken: storedGoogleAccessToken?.accessToken,
    googleAccessTokenExpiresAt: storedGoogleAccessToken?.expiresAt,
    idToken: tokenResult.token,
    user: buildUser(user),
  }
}

const waitForInitialAuthState = async () => {
  if (!auth) {
    return
  }

  if (typeof auth.authStateReady === 'function') {
    await auth.authStateReady()
    return
  }

  await new Promise<void>((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      () => {
        unsubscribe()
        resolve()
      },
      reject,
    )
  })
}

const ensureConfigured = () => {
  if (!auth) {
    throw new Error('Missing Firebase configuration.')
  }
}

const toAuthErrorMessage = (error: unknown) => {
  if (error instanceof Error && !(error instanceof FirebaseError)) {
    return error.message
  }

  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'Enter a valid email address.'
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password.'
      case 'auth/user-disabled':
        return 'This account has been disabled.'
      case 'auth/popup-closed-by-user':
        return 'Google sign-in was canceled.'
      case 'auth/cancelled-popup-request':
        return 'Google sign-in is already in progress.'
      case 'auth/operation-not-allowed':
        return 'This sign-in method is not enabled in Firebase.'
      case 'auth/unauthorized-domain':
        return 'This domain is not authorized in Firebase Authentication.'
      default:
        return 'Unable to sign in right now.'
    }
  }

  return 'Unable to sign in right now.'
}

export const isAuthConfigured = () => auth !== null
export const isGoogleSignInConfigured = () => googleClientId.length > 0
export const getGoogleClientId = () => googleClientId
export const getGoogleCalendarAccessToken = () => readStoredGoogleAccessToken()?.accessToken ?? null

export const getAuthConfigError = () =>
  'Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, and VITE_FIREBASE_APP_ID to enable sign-in.'

export const getCurrentSession = async (): Promise<AuthSession | null> => {
  ensureConfigured()
  await persistenceReady
  await waitForInitialAuthState()

  const user = auth?.currentUser

  if (!user) {
    return null
  }

  await ensureAllowedDomain(user)

  return buildSession(user)
}

export const signInWithEmailAndPassword = async (
  email: string,
  password: string,
): Promise<AuthSession> => {
  ensureConfigured()
  await persistenceReady
  clearGoogleAccessToken()

  const credentials = await firebaseSignInWithEmailAndPassword(auth!, email, password)
  await ensureAllowedDomain(credentials.user)

  return buildSession(credentials.user)
}

export const signInWithGoogleAccessToken = async (
  accessToken: string,
  expiresInSeconds?: number,
): Promise<AuthSession> => {
  ensureConfigured()
  await persistenceReady
  storeGoogleAccessToken(accessToken, expiresInSeconds)

  const credential = GoogleAuthProvider.credential(undefined, accessToken)
  const credentials = await signInWithCredential(auth!, credential)
  await ensureAllowedDomain(credentials.user)

  return buildSession(credentials.user)
}

export const signOut = async () => {
  if (!auth) {
    clearGoogleAccessToken()
    return
  }

  await firebaseSignOut(auth)
  clearGoogleAccessToken()
}

export const getAuthErrorMessage = (error: unknown) => toAuthErrorMessage(error)
