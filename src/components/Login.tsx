import { useEffect, useState } from 'react'
import { authService } from '../services/authService'

interface LoginProps {
  onLoginSuccess: () => void
}

export const Login = ({ onLoginSuccess }: LoginProps) => {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if we're returning from Cognito with an authorization code
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')

    if (code) {
      try {
        // Validate state parameter first
        authService.validateStateParameter(state)

        authService
          .exchangeCodeForToken(code)
          .then(token => {
            authService.setIdToken(token)
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname)
            setError(null)
            onLoginSuccess()
          })
          .catch(err => {
            console.error('Login failed:', err)
            setError(err.message || 'Login failed')
          })
      } catch (err) {
        console.error('State validation failed:', err)
        setError(err instanceof Error ? err.message : 'Invalid authorization state')
      }
    }
  }, [onLoginSuccess])

  const handleLogin = () => {
    setError(null)
    window.location.href = authService.getLoginUrl()
  }

  return (
    <div className="login-container">
      <div className="login-box" role="main">
        <h1 id="login-title">drive</h1>
        <p id="login-description">Sign in with your AWS Cognito account</p>
        {error && (
          <div 
            className="error-message" 
            role="alert" 
            aria-live="assertive"
            aria-atomic="true"
          >
            {error}
            <button 
              onClick={handleLogin} 
              className="retry-button"
              aria-label="Retry login after error"
            >
              Retry
            </button>
          </div>
        )}
        <button 
          onClick={handleLogin}
          aria-label="Login with AWS Cognito"
          aria-describedby="login-description"
        >
          Login with Cognito
        </button>
      </div>
    </div>
  )
}
