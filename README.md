# drive

A React web application for managing files in AWS S3 with Cognito authentication.

## Features

- List files in S3 bucket
- Upload multiple files
- Download files with signed URLs
- Delete files
- Cognito Identity Pool authentication
- Environment-based configuration for dev/prod

## Setup

### Prerequisites

- Node.js 18+
- AWS Account with:
  - S3 bucket created
  - Cognito Identity Pool configured
  - IAM role with S3 permissions attached to the identity pool

### Installation

1. Install dependencies:
```bash
npm install
```

### Development

1. Create `.env.local` from `.env.example`:
```bash
cp .env.example .env.local
```

2. Configure your AWS credentials in `.env.local`:
```
VITE_AWS_REGION=us-east-1
VITE_COGNITO_IDENTITY_POOL_ID=us-east-1:your-actual-pool-id
VITE_S3_BUCKET_NAME=your-actual-bucket-name
```

3. Start the dev server:
```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Build

```bash
npm run build
```

## AWS Configuration

### Development (localhost)

Use environment variables in `.env.local`:
- `VITE_AWS_REGION`: AWS region
- `VITE_COGNITO_IDENTITY_POOL_ID`: Cognito Identity Pool ID
- `VITE_S3_BUCKET_NAME`: S3 bucket name

### Production (deployment)

Update `public/config.json` before building:
```json
{
  "region": "us-east-1",
  "identityPoolId": "us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "bucketName": "your-bucket-name"
}
```

Then deploy the `dist` folder to your web server.

1. Create an Identity Pool in AWS Cognito
2. Configure authentication providers (optional for unauthenticated access)
3. Create an IAM role with S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

4. Attach the role to your Identity Pool

### S3 Bucket Setup

1. Create an S3 bucket
2. Configure CORS if needed for direct uploads:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

## Environment Variables

- `VITE_AWS_REGION`: AWS region (default: us-east-1)
- `VITE_COGNITO_IDENTITY_POOL_ID`: Cognito Identity Pool ID
- `VITE_S3_BUCKET_NAME`: S3 bucket name for file storage

## Architecture

- **Components**: React components for UI (FileUpload, FileList, App)
- **Services**: S3 and Auth service layers for AWS interactions
- **Config**: Centralized AWS configuration from environment variables
- **Types**: TypeScript interfaces for type safety

## File Operations

- **List**: Retrieves all objects from the S3 bucket
- **Upload**: Puts files to S3 with content type detection
- **Download**: Generates signed URLs for secure file access
- **Delete**: Removes files from S3 bucket
