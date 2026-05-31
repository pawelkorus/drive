
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity'
import { getConfig } from '../config/awsConfig'

let cachedCredentials: any = null
let cachedCredentialsExpiration: number | null = null
let cachedIdToken: string | null = null
let cachedUserId: string | null = null

const STATE_STORAGE_KEY = 'oauth2_state'

const decodeToken = (token: string): any => {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid token format')
  }
  const decoded = JSON.parse(atob(parts[1]))
  return decoded
}

/**
 * Generates a cryptographically secure random state parameter for OAuth2 CSRF protection
 * @returns A random state string (43 characters of base64url-encoded random data)
 */
const generateState = (): string => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  // Convert to base64url (no padding)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Stores the state parameter in sessionStorage for later validation
 * @param state The state parameter to store
 */
const storeState = (state: string): void => {
  sessionStorage.setItem(STATE_STORAGE_KEY, state)
}

/**
 * Retrieves the stored state parameter from sessionStorage
 * @returns The stored state parameter, or null if not found
 */
const getStoredState = (): string | null => {
  return sessionStorage.getItem(STATE_STORAGE_KEY)
}

/**
 * Clears the stored state parameter from sessionStorage
 */
const clearStoredState = (): void => {
  sessionStorage.removeItem(STATE_STORAGE_KEY)
}

/**
 * Checks if cached credentials have expired
 * @returns true if credentials are expired or not cached, false if still valid
 */
const areCredentialsExpired = (): boolean => {
  if (!cachedCredentials || !cachedCredentialsExpiration) {
    return true
  }
  // Check if expiration time has passed (with 1 second buffer for safety)
  return Date.now() >= cachedCredentialsExpiration - 1000
}

/**
 * Validates that the provided state matches the stored state
 * @param state The state parameter to validate
 * @returns true if state is valid, false otherwise
 */
const validateState = (state: string | null): boolean => {
  if (!state) {
    return false
  }
  const storedState = getStoredState()
  return state === storedState
}

export const authService = {
  getLoginUrl(): string {
    const config = getConfig()
    const state = generateState()
    storeState(state)
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      scope: 'openid email',
      redirect_uri: config.redirectUri,
      state: state
    })
    return `https://${config.cognitoDomain}/oauth2/authorize?${params.toString()}`
  },

  async exchangeCodeForToken(code: string): Promise<string> {
    const config = getConfig()
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      code,
      redirect_uri: config.redirectUri
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(`https://${config.cognitoDomain}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString(),
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error('Failed to exchange code for token')
      }

      const data = await response.json()
      return data.id_token
    } catch (error) {
      if ((error as any)?.name === 'AbortError') {
        throw new Error('Token exchange request timed out after 10 seconds')
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  },

  /**
   * Validates the state parameter from the OAuth2 callback
   * @param state The state parameter from the URL
   * @throws Error if state is invalid or missing
   */
  validateStateParameter(state: string | null): void {
    if (!validateState(state)) {
      clearStoredState()
      throw new Error('Invalid authorization state')
    }
    clearStoredState()
  },

  setIdToken(token: string) {
    cachedIdToken = token
    cachedCredentials = null
    cachedCredentialsExpiration = null
    const decoded = decodeToken(token)
    cachedUserId = decoded.sub
  },

  getUserId(): string {
    if (!cachedUserId) {
      throw new Error('Not authenticated')
    }
    return cachedUserId
  },

  async getCredentials() {
    // Check if cached credentials are still valid
    if (!areCredentialsExpired()) {
      return cachedCredentials
    }

    if (!cachedIdToken) {
      throw new Error('Not authenticated')
    }

    const config = getConfig()
    const credentials = fromCognitoIdentityPool({
      clientConfig: {
        region: config.region
      },
      identityPoolId: config.identityPoolId,
      logins: {
        [`cognito-idp.${config.region}.amazonaws.com/${config.userPoolId}`]: cachedIdToken
      }
    })

    cachedCredentials = await credentials()
    
    // Store the expiration time from the credentials
    if (cachedCredentials && cachedCredentials.expiration) {
      cachedCredentialsExpiration = cachedCredentials.expiration.getTime()
    }
    
    return cachedCredentials
  },

  clearCredentials() {
    cachedCredentials = null
    cachedCredentialsExpiration = null
    cachedIdToken = null
    cachedUserId = null
    // Use dynamic import to avoid circular dependency
    import('./s3Service').then(module => {
      module.s3Service.clearS3Client()
    }).catch(() => {
      // Silently fail if s3Service is not available
    })
  },

  isAuthenticated(): boolean {
    return cachedIdToken !== null
  }
}
