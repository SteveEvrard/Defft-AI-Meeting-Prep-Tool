import { useEffect, useRef, useState, type FormEvent } from 'react'
import App from '../../App'
import defftIcon from '../../assets/defft-icon.png'
import {
  getAuthConfigError,
  getAuthErrorMessage,
  getCurrentSession,
  getGoogleClientId,
  isAuthConfigured,
  isGoogleSignInConfigured,
  signInWithEmailAndPassword,
  signInWithGoogleAccessToken,
  signOut,
  type AuthSession,
} from '../../lib/auth'

type AuthStatus = 'checking' | 'signed_out' | 'signing_in' | 'authenticated'
const GOOGLE_SCRIPT_ID = 'google-identity-services'

interface GoogleTokenResponse {
  access_token?: string
  error?: string
  expires_in?: number
}

interface GoogleTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            callback: (response: GoogleTokenResponse) => void
            client_id: string
            error_callback?: (error: { message?: string; type: string }) => void
            hd?: string
            prompt?: string
            scope: string
          }) => GoogleTokenClient
        }
      }
    }
  }
}

export function AuthGate() {
  const [status, setStatus] = useState<AuthStatus>('checking')
  const [session, setSession] = useState<AuthSession | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isGoogleReady, setIsGoogleReady] = useState(false)
  const googleTokenClientRef = useRef<GoogleTokenClient | null>(null)

  const googleClientId = getGoogleClientId()

  useEffect(() => {
    const hydrateSession = async () => {
      if (!isAuthConfigured()) {
        setError(getAuthConfigError())
        setStatus('signed_out')
        return
      }

      try {
        const nextSession = await getCurrentSession()

        if (nextSession) {
          setSession(nextSession)
          setStatus('authenticated')
          return
        }

        setStatus('signed_out')
      } catch (caughtError) {
        setError(getAuthErrorMessage(caughtError))
        setStatus('signed_out')
      }
    }

    void hydrateSession()
  }, [])

  useEffect(() => {
    if (!isGoogleSignInConfigured()) {
      googleTokenClientRef.current = null
      return
    }

    let cancelled = false
    let script: HTMLScriptElement | null = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null

    const handleGooglePopupError = (popupError: { message?: string; type: string }) => {
      if (cancelled) {
        return
      }

      setStatus('signed_out')
      setError(
        popupError.type === 'popup_closed'
          ? 'Google sign-in was canceled.'
          : popupError.type === 'popup_failed_to_open'
            ? 'Your browser blocked the Google sign-in popup.'
            : popupError.message ?? 'Unable to start Google sign-in.',
      )
    }

    const initializeGoogle = () => {
      if (cancelled || !window.google?.accounts?.oauth2) {
        return
      }

      googleTokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        callback: (response) => {
          if (cancelled) {
            return
          }

          if (response.error || !response.access_token) {
            setStatus('signed_out')
            setError('Unable to complete Google sign-in.')
            return
          }

          void (async () => {
            try {
              const nextSession = await signInWithGoogleAccessToken(
                response.access_token!,
                response.expires_in,
              )
              if (cancelled) {
                return
              }

              setSession(nextSession)
              setPassword('')
              setStatus('authenticated')
            } catch (caughtError) {
              if (cancelled) {
                return
              }

              setError(getAuthErrorMessage(caughtError))
              setStatus('signed_out')
            }
          })()
        },
        client_id: googleClientId,
        error_callback: handleGooglePopupError,
        hd: 'defft.ai',
        prompt: 'select_account',
        scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
      })
      setIsGoogleReady(true)
    }

    if (window.google?.accounts?.oauth2) {
      initializeGoogle()
      return () => {
        cancelled = true
      }
    }

    const handleLoad = () => initializeGoogle()
    const handleError = () => {
      if (cancelled) {
        return
      }

      setError('Unable to load Google sign-in.')
      setIsGoogleReady(false)
    }

    if (!script) {
      script = document.createElement('script')
      script.id = GOOGLE_SCRIPT_ID
      script.async = true
      script.defer = true
      script.src = 'https://accounts.google.com/gsi/client'
      script.addEventListener('load', handleLoad)
      script.addEventListener('error', handleError)
      document.head.appendChild(script)
    } else {
      script.addEventListener('load', handleLoad)
      script.addEventListener('error', handleError)
    }

    return () => {
      cancelled = true
      script?.removeEventListener('load', handleLoad)
      script?.removeEventListener('error', handleError)
    }
  }, [googleClientId])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setStatus('signing_in')

    try {
      const nextSession = await signInWithEmailAndPassword(email.trim(), password)
      setSession(nextSession)
      setPassword('')
      setStatus('authenticated')
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError))
      setStatus('signed_out')
    }
  }

  const handleGoogleSignIn = async () => {
    if (!googleTokenClientRef.current) {
      setError('Google sign-in is still loading. Try again in a moment.')
      return
    }

    setError(null)
    setStatus('signing_in')

    try {
      googleTokenClientRef.current.requestAccessToken()
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError))
      setStatus('signed_out')
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setSession(null)
    setPassword('')
    setStatus('signed_out')
  }

  if (status === 'authenticated' && session) {
    return <App authSession={session} authUser={session.user} onSignOut={handleSignOut} />
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-card__header">
          <div className="auth-brand" aria-hidden="true">
            <img className="auth-brand__icon" src={defftIcon} alt="" />
          </div>
          <p className="section-kicker">Secure access</p>
          <h1>Sign in to Meeting Prep Tool</h1>
          <p className="auth-copy">
            Sign in with your Defft email or continue with Google to access the workspace.
          </p>
        </div>

        {status === 'checking' ? (
          <div className="auth-loading">
            <div className="skeleton skeleton--hero" />
            <p className="auth-copy">Checking your secure session...</p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>Email</span>
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                type="email"
                value={email}
              />
            </label>

            <label className="auth-field">
              <span>Password</span>
              <input
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                type="password"
                value={password}
              />
            </label>

            {error ? <p className="auth-error">{error}</p> : null}

            <button
              className="primary-button auth-submit"
              disabled={!isAuthConfigured() || !email.trim() || !password || status === 'signing_in'}
              type="submit"
            >
              {status === 'signing_in' ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="auth-divider" aria-hidden="true">
              <span>or</span>
            </div>

            <button
              className="gsi-material-button"
              disabled={!isAuthConfigured() || !isGoogleReady || status === 'signing_in'}
              onClick={handleGoogleSignIn}
              type="button"
            >
              <div className="gsi-material-button-state" />
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    style={{ display: 'block' }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {status === 'signing_in' ? 'Signing in with Google...' : 'Sign in with Google'}
                </span>
                <span className="gsi-material-button-contents gsi-material-button-contents--hidden">
                  Sign in with Google
                </span>
              </div>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
