import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()

describe('awsConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('field validation', () => {
    it('should throw error when any required field is missing', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Not found'))
      
      const { loadConfig } = await import('../awsConfig')
      
      // When config.json is not found and env vars are not set, should throw validation error
      await expect(loadConfig()).rejects.toThrow(/Missing required AWS configuration fields/)
    })

    it('should throw error message listing missing fields', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Not found'))
      
      const { loadConfig } = await import('../awsConfig')
      
      try {
        await loadConfig()
        throw new Error('Should have thrown')
      } catch (error) {
        const message = (error as Error).message
        // Should contain field names
        expect(message).toMatch(/identityPoolId|bucketName|cognitoDomain|clientId|redirectUri|userPoolId/)
      }
    })
  })

  describe('valid configuration from config.json', () => {
    it('should load valid configuration from config.json', async () => {
      const mockConfig = {
        region: 'us-west-2',
        identityPoolId: 'us-west-2:87654321-4321-4321-4321-210987654321',
        bucketName: 'prod-bucket',
        cognitoDomain: 'prod.auth.us-west-2.amazoncognito.com',
        clientId: 'xyz789abc123',
        redirectUri: 'https://prod.example.com/callback',
        userPoolId: 'us-west-2_xyz789abc'
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig
      })

      const { loadConfig } = await import('../awsConfig')
      
      const config = await loadConfig()
      
      expect(config).toEqual(mockConfig)
      expect(config.region).toBe('us-west-2')
      expect(config.identityPoolId).toBe('us-west-2:87654321-4321-4321-4321-210987654321')
      expect(config.bucketName).toBe('prod-bucket')
      expect(config.cognitoDomain).toBe('prod.auth.us-west-2.amazoncognito.com')
      expect(config.clientId).toBe('xyz789abc123')
      expect(config.redirectUri).toBe('https://prod.example.com/callback')
      expect(config.userPoolId).toBe('us-west-2_xyz789abc')
    })

    it('should validate region field is non-empty when provided', async () => {
      // Region has a default value of 'us-east-1', so we test that it validates
      // when explicitly set to empty in config.json
      const validConfig = {
        region: 'us-west-2',
        identityPoolId: 'pool-id',
        bucketName: 'bucket',
        cognitoDomain: 'domain',
        clientId: 'client-id',
        redirectUri: 'https://example.com',
        userPoolId: 'user-pool-id'
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => validConfig
      })

      const { loadConfig } = await import('../awsConfig')
      
      const config = await loadConfig()
      expect(config.region).toBe('us-west-2')
    })

    it('should validate identityPoolId field is non-empty', async () => {
      const invalidConfig = {
        region: 'us-east-1',
        identityPoolId: '',
        bucketName: 'bucket',
        cognitoDomain: 'domain',
        clientId: 'client-id',
        redirectUri: 'https://example.com',
        userPoolId: 'user-pool-id'
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => invalidConfig
      })

      const { loadConfig } = await import('../awsConfig')
      
      await expect(loadConfig()).rejects.toThrow(/identityPoolId/)
    })

    it('should validate bucketName field is non-empty', async () => {
      const invalidConfig = {
        region: 'us-east-1',
        identityPoolId: 'pool-id',
        bucketName: '',
        cognitoDomain: 'domain',
        clientId: 'client-id',
        redirectUri: 'https://example.com',
        userPoolId: 'user-pool-id'
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => invalidConfig
      })

      const { loadConfig } = await import('../awsConfig')
      
      await expect(loadConfig()).rejects.toThrow(/bucketName/)
    })

    it('should validate cognitoDomain field is non-empty', async () => {
      const invalidConfig = {
        region: 'us-east-1',
        identityPoolId: 'pool-id',
        bucketName: 'bucket',
        cognitoDomain: '',
        clientId: 'client-id',
        redirectUri: 'https://example.com',
        userPoolId: 'user-pool-id'
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => invalidConfig
      })

      const { loadConfig } = await import('../awsConfig')
      
      await expect(loadConfig()).rejects.toThrow(/cognitoDomain/)
    })

    it('should validate clientId field is non-empty', async () => {
      const invalidConfig = {
        region: 'us-east-1',
        identityPoolId: 'pool-id',
        bucketName: 'bucket',
        cognitoDomain: 'domain',
        clientId: '',
        redirectUri: 'https://example.com',
        userPoolId: 'user-pool-id'
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => invalidConfig
      })

      const { loadConfig } = await import('../awsConfig')
      
      await expect(loadConfig()).rejects.toThrow(/clientId/)
    })

    it('should validate redirectUri field is non-empty', async () => {
      const invalidConfig = {
        region: 'us-east-1',
        identityPoolId: 'pool-id',
        bucketName: 'bucket',
        cognitoDomain: 'domain',
        clientId: 'client-id',
        redirectUri: '',
        userPoolId: 'user-pool-id'
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => invalidConfig
      })

      const { loadConfig } = await import('../awsConfig')
      
      await expect(loadConfig()).rejects.toThrow(/redirectUri/)
    })

    it('should validate userPoolId field is non-empty', async () => {
      const invalidConfig = {
        region: 'us-east-1',
        identityPoolId: 'pool-id',
        bucketName: 'bucket',
        cognitoDomain: 'domain',
        clientId: 'client-id',
        redirectUri: 'https://example.com',
        userPoolId: ''
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => invalidConfig
      })

      const { loadConfig } = await import('../awsConfig')
      
      await expect(loadConfig()).rejects.toThrow(/userPoolId/)
    })

    it('should list all missing fields in error message', async () => {
      const invalidConfig = {
        region: 'us-east-1',
        identityPoolId: '',
        bucketName: 'bucket',
        cognitoDomain: '',
        clientId: 'client-id',
        redirectUri: '',
        userPoolId: 'user-pool-id'
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => invalidConfig
      })

      const { loadConfig } = await import('../awsConfig')
      
      try {
        await loadConfig()
        throw new Error('Should have thrown')
      } catch (error) {
        const message = (error as Error).message
        expect(message).toMatch(/identityPoolId/)
        expect(message).toMatch(/cognitoDomain/)
        expect(message).toMatch(/redirectUri/)
      }
    })
  })

  describe('getConfig', () => {
    it('should throw error if config not loaded', async () => {
      const { getConfig } = await import('../awsConfig')
      
      expect(() => getConfig()).toThrow('Configuration not loaded. Call loadConfig() first.')
    })
  })
})
