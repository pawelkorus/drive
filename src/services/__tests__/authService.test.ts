import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { authService } from '../authService'

// Mock the config module
vi.mock('../../config/awsConfig', () => ({
  getConfig: () => ({
    region: 'us-east-1',
    identityPoolId: 'test-pool-id',
    bucketName: 'test-bucket',
    cognitoDomain: 'test.auth.us-east-1.amazoncognito.com',
    clientId: 'test-client-id',
    redirectUri: 'http://localhost:3000/callback',
    userPoolId: 'us-east-1_test123'
  })
}))

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear cached credentials before each test
    authService.clearCredentials()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('exchangeCodeForToken', () => {
    it('should successfully exchange code for token', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.signature'
      
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id_token: mockToken })
      })

      const token = await authService.exchangeCodeForToken('test-code')
      
      expect(token).toBe(mockToken)
      expect(global.fetch).toHaveBeenCalledOnce()
    })

    it('should throw timeout error when fetch is aborted', async () => {
      const abortError = new DOMException('The operation was aborted', 'AbortError')
      
      global.fetch = vi.fn().mockRejectedValueOnce(abortError)

      await expect(authService.exchangeCodeForToken('test-code')).rejects.toThrow('Token exchange request timed out after 10 seconds')
    })

    it('should throw error when response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false
      })

      await expect(authService.exchangeCodeForToken('test-code')).rejects.toThrow('Failed to exchange code for token')
    })

    it('should pass correct parameters to fetch', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.signature'
      
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id_token: mockToken })
      })

      await authService.exchangeCodeForToken('test-code')
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.auth.us-east-1.amazoncognito.com/oauth2/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
      )
    })

    it('should include abort signal in fetch request', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.signature'
      
      let capturedOptions: any
      global.fetch = vi.fn().mockImplementationOnce((_url, options) => {
        capturedOptions = options
        return Promise.resolve({
          ok: true,
          json: async () => ({ id_token: mockToken })
        })
      })

      await authService.exchangeCodeForToken('test-code')
      
      expect(capturedOptions).toBeDefined()
      expect(capturedOptions.signal).toBeDefined()
      expect(capturedOptions.signal).toBeInstanceOf(AbortSignal)
    })
  })

  describe('token decoding', () => {
    it('should decode valid JWT token', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.signature'
      
      authService.setIdToken(mockToken)
      
      expect(authService.getUserId()).toBe('user-123')
    })

    it('should throw error for invalid token format', () => {
      const invalidToken = 'invalid.token'
      
      expect(() => {
        authService.setIdToken(invalidToken)
      }).toThrow('Invalid token format')
    })
  })

  describe('authentication state', () => {
    it('should return false for isAuthenticated when no token set', () => {
      expect(authService.isAuthenticated()).toBe(false)
    })

    it('should return true for isAuthenticated after setting token', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.signature'
      
      authService.setIdToken(mockToken)
      
      expect(authService.isAuthenticated()).toBe(true)
    })

    it('should clear credentials on logout', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.signature'
      
      authService.setIdToken(mockToken)
      expect(authService.isAuthenticated()).toBe(true)
      
      authService.clearCredentials()
      
      expect(authService.isAuthenticated()).toBe(false)
    })
  })

  describe('OAuth2 state parameter validation', () => {
    beforeEach(() => {
      // Clear sessionStorage before each test
      sessionStorage.clear()
    })

    describe('state generation', () => {
      it('should generate a state parameter', () => {
        const loginUrl = authService.getLoginUrl()
        
        expect(loginUrl).toContain('state=')
      })

      it('should generate different state values on each call', () => {
        sessionStorage.clear()
        const url1 = authService.getLoginUrl()
        const state1 = new URL(url1).searchParams.get('state')
        
        sessionStorage.clear()
        const url2 = authService.getLoginUrl()
        const state2 = new URL(url2).searchParams.get('state')
        
        expect(state1).not.toBe(state2)
      })

      it('should generate state with sufficient entropy (at least 32 characters)', () => {
        const loginUrl = authService.getLoginUrl()
        const state = new URL(loginUrl).searchParams.get('state')
        
        expect(state).toBeDefined()
        expect(state!.length).toBeGreaterThanOrEqual(32)
      })

      it('should generate state with valid base64url characters only', () => {
        const loginUrl = authService.getLoginUrl()
        const state = new URL(loginUrl).searchParams.get('state')
        
        // Base64url alphabet: A-Z, a-z, 0-9, -, _
        const base64urlRegex = /^[A-Za-z0-9_-]+$/
        expect(state).toMatch(base64urlRegex)
      })
    })

    describe('state storage', () => {
      it('should store state in sessionStorage when getLoginUrl is called', () => {
        sessionStorage.clear()
        authService.getLoginUrl()
        
        const storedState = sessionStorage.getItem('oauth2_state')
        expect(storedState).toBeDefined()
        expect(storedState).not.toBeNull()
      })

      it('should store state that matches the URL state parameter', () => {
        sessionStorage.clear()
        const loginUrl = authService.getLoginUrl()
        const urlState = new URL(loginUrl).searchParams.get('state')
        const storedState = sessionStorage.getItem('oauth2_state')
        
        expect(storedState).toBe(urlState)
      })

      it('should overwrite previous state on new getLoginUrl call', () => {
        const url1 = authService.getLoginUrl()
        const state1 = new URL(url1).searchParams.get('state')
        
        const url2 = authService.getLoginUrl()
        const state2 = new URL(url2).searchParams.get('state')
        
        const storedState = sessionStorage.getItem('oauth2_state')
        expect(storedState).toBe(state2)
        expect(storedState).not.toBe(state1)
      })
    })

    describe('state validation', () => {
      it('should validate matching state parameter', () => {
        const loginUrl = authService.getLoginUrl()
        const state = new URL(loginUrl).searchParams.get('state')
        
        expect(() => {
          authService.validateStateParameter(state)
        }).not.toThrow()
      })

      it('should throw error for null state parameter', () => {
        authService.getLoginUrl()
        
        expect(() => {
          authService.validateStateParameter(null)
        }).toThrow('Invalid authorization state')
      })

      it('should throw error for undefined state parameter', () => {
        authService.getLoginUrl()
        
        expect(() => {
          authService.validateStateParameter(undefined as any)
        }).toThrow('Invalid authorization state')
      })

      it('should throw error for mismatched state parameter', () => {
        authService.getLoginUrl()
        
        expect(() => {
          authService.validateStateParameter('wrong-state-value')
        }).toThrow('Invalid authorization state')
      })

      it('should throw error for empty string state parameter', () => {
        authService.getLoginUrl()
        
        expect(() => {
          authService.validateStateParameter('')
        }).toThrow('Invalid authorization state')
      })

      it('should throw error when no state was previously stored', () => {
        sessionStorage.clear()
        
        expect(() => {
          authService.validateStateParameter('some-state')
        }).toThrow('Invalid authorization state')
      })
    })

    describe('state clearing', () => {
      it('should clear state from sessionStorage after successful validation', () => {
        const loginUrl = authService.getLoginUrl()
        const state = new URL(loginUrl).searchParams.get('state')
        
        authService.validateStateParameter(state)
        
        const storedState = sessionStorage.getItem('oauth2_state')
        expect(storedState).toBeNull()
      })

      it('should clear state from sessionStorage after failed validation', () => {
        authService.getLoginUrl()
        
        try {
          authService.validateStateParameter('wrong-state')
        } catch (e) {
          // Expected to throw
        }
        
        const storedState = sessionStorage.getItem('oauth2_state')
        expect(storedState).toBeNull()
      })

      it('should prevent state reuse after validation', () => {
        const loginUrl = authService.getLoginUrl()
        const state = new URL(loginUrl).searchParams.get('state')
        
        // First validation should succeed
        authService.validateStateParameter(state)
        
        // Second validation with same state should fail
        expect(() => {
          authService.validateStateParameter(state)
        }).toThrow('Invalid authorization state')
      })
    })

    describe('state parameter in login URL', () => {
      it('should include state parameter in authorization URL', () => {
        const loginUrl = authService.getLoginUrl()
        
        expect(loginUrl).toContain('state=')
        expect(loginUrl).toContain('client_id=test-client-id')
        expect(loginUrl).toContain('response_type=code')
        expect(loginUrl).toContain('redirect_uri=')
      })

      it('should use correct Cognito domain in authorization URL', () => {
        const loginUrl = authService.getLoginUrl()
        
        expect(loginUrl).toContain('https://test.auth.us-east-1.amazoncognito.com/oauth2/authorize')
      })

      it('should include openid and email scopes', () => {
        const loginUrl = authService.getLoginUrl()
        
        expect(loginUrl).toContain('scope=openid+email')
      })
    })
  })

  describe('credential caching and expiration', () => {
    it('should clear credentials expiration on logout', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.signature'
      
      authService.setIdToken(mockToken)
      authService.clearCredentials()
      
      // After logout, isAuthenticated should be false
      expect(authService.isAuthenticated()).toBe(false)
    })

    it('should throw error when getting credentials without authentication', async () => {
      authService.clearCredentials()
      
      await expect(authService.getCredentials()).rejects.toThrow('Not authenticated')
    })

    it('should clear credentials expiration when setting new token', () => {
      const mockToken1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.signature'
      const mockToken2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTQ1NiIsImVtYWlsIjoidGVzdDJAZXhhbXBsZS5jb20ifQ.signature'
      
      authService.setIdToken(mockToken1)
      authService.setIdToken(mockToken2)
      
      // After setting new token, credentials should be cleared
      expect(authService.getUserId()).toBe('user-456')
    })
  })
})
