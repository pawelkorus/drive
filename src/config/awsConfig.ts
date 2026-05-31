import { AWSConfig } from '../types'

let cachedConfig: AWSConfig | null = null

/**
 * Validates that a configuration field is a non-empty string
 * @param value - The value to validate
 * @param fieldName - The name of the field being validated
 * @returns The field name if invalid, null if valid
 */
const validateField = (value: unknown, fieldName: string): string | null => {
  if (typeof value !== 'string' || value.trim() === '') {
    return fieldName
  }
  return null
}

/**
 * Validates all required configuration fields
 * @param config - The configuration object to validate
 * @throws Error if any required fields are missing or empty
 */
const validateConfig = (config: AWSConfig): void => {
  const missingFields: string[] = []

  // Validate all 7 required fields
  const regionError = validateField(config.region, 'region')
  if (regionError) missingFields.push(regionError)

  const identityPoolIdError = validateField(config.identityPoolId, 'identityPoolId')
  if (identityPoolIdError) missingFields.push(identityPoolIdError)

  const bucketNameError = validateField(config.bucketName, 'bucketName')
  if (bucketNameError) missingFields.push(bucketNameError)

  const cognitoDomainError = validateField(config.cognitoDomain, 'cognitoDomain')
  if (cognitoDomainError) missingFields.push(cognitoDomainError)

  const clientIdError = validateField(config.clientId, 'clientId')
  if (clientIdError) missingFields.push(clientIdError)

  const redirectUriError = validateField(config.redirectUri, 'redirectUri')
  if (redirectUriError) missingFields.push(redirectUriError)

  const userPoolIdError = validateField(config.userPoolId, 'userPoolId')
  if (userPoolIdError) missingFields.push(userPoolIdError)

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required AWS configuration fields: ${missingFields.join(', ')}`
    )
  }
}

export const loadConfig = async (): Promise<AWSConfig> => {
  if (cachedConfig) {
    return cachedConfig
  }

  try {
    // Try to load from config.json first (production)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)
      
      const response = await fetch('/config.json', { signal: controller.signal })
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const config: AWSConfig = await response.json()
        validateConfig(config)
        cachedConfig = config
        return config
      }
    } catch (fetchError) {
      // config.json not found or fetch failed, continue to env vars
      if (fetchError instanceof Error && fetchError.name !== 'AbortError') {
        console.debug('config.json not found, falling back to environment variables')
      }
    }

    // Fall back to environment variables (development)
    const config: AWSConfig = {
      region: (import.meta as any).env.VITE_AWS_REGION || 'us-east-1',
      identityPoolId: (import.meta as any).env.VITE_COGNITO_IDENTITY_POOL_ID || '',
      bucketName: (import.meta as any).env.VITE_S3_BUCKET_NAME || '',
      cognitoDomain: (import.meta as any).env.VITE_COGNITO_DOMAIN || '',
      clientId: (import.meta as any).env.VITE_CLIENT_ID || '',
      redirectUri: (import.meta as any).env.VITE_REDIRECT_URI || '',
      userPoolId: (import.meta as any).env.VITE_USER_POOL_ID || ''
    }

    validateConfig(config)
    cachedConfig = config
    return config
  } catch (error) {
    throw new Error(
      `Failed to load AWS configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export const getConfig = (): AWSConfig => {
  if (!cachedConfig) {
    throw new Error('Configuration not loaded. Call loadConfig() first.')
  }
  return cachedConfig
}
