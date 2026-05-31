export interface S3File {
  key: string
  size: number
  lastModified: Date
}

export interface AWSConfig {
  region: string
  identityPoolId: string
  bucketName: string
  cognitoDomain: string
  clientId: string
  redirectUri: string
  userPoolId: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: CognitoUser | null
  loading: boolean
  error: string | null
}

export interface CognitoUser {
  username: string
  email?: string
}

/**
 * Strips the user prefix from an S3 key for display purposes.
 * S3 keys are stored as "{userId}/{filename}", this function returns just the filename.
 * 
 * @param key - The full S3 key including user prefix (e.g., "user-123/document.pdf")
 * @returns The filename without user prefix (e.g., "document.pdf")
 * @throws Error if key is empty or doesn't contain a slash
 */
export const stripUserPrefix = (key: string): string => {
  if (!key) {
    throw new Error('Key cannot be empty')
  }
  
  const parts = key.split('/')
  if (parts.length < 2) {
    throw new Error('Invalid S3 key format: expected "{userId}/{filename}"')
  }
  
  // Return everything after the first slash (handles filenames with slashes)
  return parts.slice(1).join('/')
}
