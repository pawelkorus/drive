import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { S3File } from '../types'
import { getConfig } from '../config/awsConfig'
import { authService } from './authService'

let s3Client: S3Client | null = null

const getS3Client = async () => {
  if (!s3Client) {
    const config = getConfig()
    const credentials = await authService.getCredentials()
    s3Client = new S3Client({
      region: config.region,
      credentials
    })
  }
  return s3Client
}

const getUserPrefix = (): string => {
  return authService.getUserId() + '/'
}

export const s3Service = {
  async listFiles(): Promise<S3File[]> {
    const client = await getS3Client()
    const config = getConfig()
    const prefix = getUserPrefix()
    const command = new ListObjectsV2Command({
      Bucket: config.bucketName,
      Prefix: prefix
    })

    const response = await client.send(command)
    return (response.Contents || []).map(obj => ({
      key: obj.Key || '',
      size: obj.Size || 0,
      lastModified: obj.LastModified || new Date()
    }))
  },

  async uploadFile(file: File): Promise<void> {
    const client = await getS3Client()
    const config = getConfig()
    const prefix = getUserPrefix()
    const arrayBuffer = await file.arrayBuffer()

    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: prefix + file.name,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type
    })

    await client.send(command)
  },

  async downloadFile(key: string): Promise<void> {
    const client = await getS3Client()
    const config = getConfig()
    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key
    })

    const url = await getSignedUrl(client, command, { expiresIn: 3600 })
    window.open(url, '_blank')
  },

  async deleteFile(key: string): Promise<void> {
    const client = await getS3Client()
    const config = getConfig()
    const command = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key
    })

    await client.send(command)
  },

  /**
   * Clears the cached S3Client instance
   * This should be called on logout to ensure a new client is created with fresh credentials
   */
  clearS3Client(): void {
    s3Client = null
  }
}
