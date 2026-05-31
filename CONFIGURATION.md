# Configuration Guide

This guide provides comprehensive instructions for configuring the Drive application in both development and production environments.

## Table of Contents

- [Overview](#overview)
- [Configuration Methods](#configuration-methods)
- [Development Setup](#development-setup)
- [Production Setup](#production-setup)
- [AWS Credentials Setup](#aws-credentials-setup)
- [Configuration Reference](#configuration-reference)
- [Troubleshooting](#troubleshooting)

## Overview

The Drive application requires AWS credentials and configuration to function. It supports two configuration methods:

1. **Environment Variables** (recommended for development)
2. **Runtime Configuration File** (`public/config.json`, recommended for production)

The application automatically attempts to load `config.json` first. If not found or if the fetch times out (2 seconds), it falls back to environment variables.

## Configuration Methods

### Method 1: Environment Variables (Development)

Environment variables are loaded at build time by Vite and are ideal for local development.

**Advantages:**
- Easy to manage per developer
- Not committed to version control
- Quick to change without rebuilding

**Disadvantages:**
- Requires rebuild to change values
- Not suitable for production deployments

### Method 2: Runtime Configuration File (Production)

The `public/config.json` file is loaded at runtime and is ideal for production deployments.

**Advantages:**
- Can be changed without rebuilding the application
- Supports multiple environments with same build
- Loaded dynamically at application startup

**Disadvantages:**
- Must be created during deployment
- Requires careful handling to avoid committing secrets

## Development Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Create Environment File

Create a `.env.local` file in the project root (this file is gitignored):

```bash
touch .env.local
```

### Step 3: Configure Environment Variables

Add the following variables to `.env.local`:

```env
# AWS Region (e.g., us-east-1, eu-central-1)
VITE_AWS_REGION=us-east-1

# Cognito Identity Pool ID (format: region:uuid)
VITE_COGNITO_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# S3 Bucket Name
VITE_S3_BUCKET_NAME=your-bucket-name

# Cognito Domain (without https://)
VITE_COGNITO_DOMAIN=your-domain.auth.us-east-1.amazoncognito.com

# Cognito App Client ID
VITE_CLIENT_ID=your-client-id

# OAuth2 Redirect URI (must match Cognito configuration)
VITE_REDIRECT_URI=https://localhost:8080

# Cognito User Pool ID (format: region_alphanumeric)
VITE_USER_POOL_ID=us-east-1_xxxxxxxxx
```

### Step 4: Start Development Server

```bash
npm run dev
```

The application will start at `https://localhost:8080` with HTTPS enabled.

### Development Configuration Example

See `config.example.json` for a complete example with all required fields.

## Production Setup

### Step 1: Build the Application

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

### Step 2: Create Production Configuration

Create a `config.json` file with your production AWS credentials:

```json
{
  "region": "us-east-1",
  "identityPoolId": "us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "bucketName": "your-production-bucket",
  "cognitoDomain": "your-domain.auth.us-east-1.amazoncognito.com",
  "clientId": "your-production-client-id",
  "redirectUri": "https://yourdomain.com",
  "userPoolId": "us-east-1_xxxxxxxxx"
}
```

### Step 3: Deploy Configuration File

Copy `config.json` to the `dist/` folder or your web server's public directory:

```bash
cp config.json dist/config.json
```

**Important:** The `config.json` file must be accessible at the root URL path (`/config.json`) of your deployed application.

### Step 4: Deploy Application

Deploy the contents of the `dist/` folder to your web server, CDN, or static hosting service:

**Examples:**
- AWS S3 + CloudFront
- Netlify
- Vercel
- Nginx/Apache web server

### Production Deployment Checklist

- [ ] Build application with `npm run build`
- [ ] Create `config.json` with production credentials
- [ ] Copy `config.json` to deployment directory
- [ ] Verify `config.json` is accessible at `/config.json`
- [ ] Update Cognito redirect URI to match production domain
- [ ] Configure HTTPS for production domain
- [ ] Test authentication flow in production
- [ ] Verify S3 file operations work correctly

## AWS Credentials Setup

### Prerequisites

- AWS Account
- AWS CLI installed (optional, but recommended)
- Basic understanding of AWS IAM, Cognito, and S3

### Step 1: Create S3 Bucket

1. Go to AWS S3 Console
2. Click "Create bucket"
3. Choose a unique bucket name (e.g., `my-drive-app-files`)
4. Select your preferred region
5. Keep default settings or adjust as needed
6. Click "Create bucket"

### Step 2: Configure S3 CORS (Optional)

If you need direct browser uploads, configure CORS on your S3 bucket:

1. Go to your bucket in S3 Console
2. Navigate to "Permissions" tab
3. Scroll to "Cross-origin resource sharing (CORS)"
4. Add the following CORS configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "https://localhost:8080",
      "https://yourdomain.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

**Note:** Replace `https://yourdomain.com` with your actual production domain.

### Step 3: Create Cognito User Pool

1. Go to AWS Cognito Console
2. Click "Create user pool"
3. Configure sign-in options (email, username, etc.)
4. Configure security requirements (password policy, MFA)
5. Configure sign-up experience
6. Configure message delivery (email/SMS)
7. Integrate your app:
   - App client name: `drive-app`
   - Generate a client secret: **No** (public client)
   - Authentication flows: Select "ALLOW_USER_PASSWORD_AUTH" and "ALLOW_REFRESH_TOKEN_AUTH"
8. Review and create user pool
9. Note the **User Pool ID** (format: `region_xxxxxxxxx`)

### Step 4: Configure Cognito App Client

1. In your User Pool, go to "App integration" tab
2. Click on your app client
3. Configure OAuth 2.0 settings:
   - **Allowed callback URLs**: Add your redirect URIs
     - Development: `https://localhost:8080`
     - Production: `https://yourdomain.com`
   - **Allowed sign-out URLs**: Same as callback URLs
   - **OAuth 2.0 grant types**: Select "Authorization code grant"
   - **OpenID Connect scopes**: Select "openid" and "email"
4. Save changes
5. Note the **App Client ID**
6. Note the **Cognito Domain** (under "Domain" in App integration)

### Step 5: Create Cognito Identity Pool

1. Go to AWS Cognito Console
2. Click "Create identity pool" (or "Federated Identities")
3. Enter identity pool name (e.g., `drive-identity-pool`)
4. Enable "Authenticated identities"
5. Configure authentication providers:
   - Select "Cognito"
   - User Pool ID: Enter your User Pool ID
   - App Client ID: Enter your App Client ID
6. Create identity pool
7. Note the **Identity Pool ID** (format: `region:uuid`)

### Step 6: Configure IAM Roles

When you create an Identity Pool, AWS automatically creates two IAM roles:
- Authenticated role (for logged-in users)
- Unauthenticated role (for guest access)

#### Configure Authenticated Role

1. Go to AWS IAM Console
2. Find the authenticated role (e.g., `Cognito_driveAuth_Role`)
3. Attach the following inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name",
      "Condition": {
        "StringLike": {
          "s3:prefix": ["${cognito-identity.amazonaws.com:sub}/*"]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/${cognito-identity.amazonaws.com:sub}/*"
    }
  ]
}
```

**Important:** Replace `your-bucket-name` with your actual S3 bucket name.

This policy ensures:
- Users can only list files in their own prefix (`userId/`)
- Users can only read, write, and delete files in their own prefix
- User isolation is enforced at the IAM level

### Step 7: Test AWS Setup

Use the AWS CLI to verify your setup:

```bash
# Test S3 bucket access
aws s3 ls s3://your-bucket-name

# Test Cognito User Pool
aws cognito-idp describe-user-pool --user-pool-id us-east-1_xxxxxxxxx

# Test Cognito Identity Pool
aws cognito-identity describe-identity-pool --identity-pool-id us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Step 8: Gather Configuration Values

Collect all the values you'll need for configuration:

- **Region**: AWS region where resources are created (e.g., `us-east-1`)
- **Identity Pool ID**: From Step 5 (e.g., `us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
- **Bucket Name**: From Step 1 (e.g., `my-drive-app-files`)
- **Cognito Domain**: From Step 4 (e.g., `my-app.auth.us-east-1.amazoncognito.com`)
- **Client ID**: From Step 4 (e.g., `1234567890abcdefghijklmnop`)
- **Redirect URI**: Your application URL (e.g., `https://localhost:8080` or `https://yourdomain.com`)
- **User Pool ID**: From Step 3 (e.g., `us-east-1_xxxxxxxxx`)

## Configuration Reference

### Required Configuration Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `region` | string | AWS region where resources are located | `us-east-1` |
| `identityPoolId` | string | Cognito Identity Pool ID for credential exchange | `us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `bucketName` | string | S3 bucket name for file storage | `my-drive-app-files` |
| `cognitoDomain` | string | Cognito domain for OAuth2 endpoints (without https://) | `my-app.auth.us-east-1.amazoncognito.com` |
| `clientId` | string | Cognito App Client ID | `1234567890abcdefghijklmnop` |
| `redirectUri` | string | OAuth2 redirect URI (must match Cognito configuration) | `https://localhost:8080` |
| `userPoolId` | string | Cognito User Pool ID | `us-east-1_xxxxxxxxx` |

### Configuration Validation

The application validates all configuration fields on startup:

- All fields must be non-empty strings
- Missing or empty fields will cause the application to fail with a descriptive error message
- Configuration is cached after first successful load

### Configuration Loading Behavior

1. **Application starts** → Calls `loadConfig()`
2. **Attempts to fetch** `/config.json` with 2-second timeout
3. **If successful** → Validates and caches configuration
4. **If fails or times out** → Falls back to environment variables
5. **Validates configuration** → Ensures all required fields are present
6. **Caches configuration** → Subsequent calls to `getConfig()` return cached value

### Environment Variable Defaults

- `VITE_AWS_REGION`: Defaults to `us-east-1` if not set
- All other variables: No defaults, must be explicitly set

## Troubleshooting

### Common Issues

#### Issue: "Missing required AWS configuration fields"

**Cause:** One or more required configuration fields are missing or empty.

**Solution:**
1. Check your `.env.local` file (development) or `config.json` (production)
2. Ensure all 7 required fields are present and non-empty:
   - `region` / `VITE_AWS_REGION`
   - `identityPoolId` / `VITE_COGNITO_IDENTITY_POOL_ID`
   - `bucketName` / `VITE_S3_BUCKET_NAME`
   - `cognitoDomain` / `VITE_COGNITO_DOMAIN`
   - `clientId` / `VITE_CLIENT_ID`
   - `redirectUri` / `VITE_REDIRECT_URI`
   - `userPoolId` / `VITE_USER_POOL_ID`
3. Restart the development server or redeploy

#### Issue: "Failed to load AWS configuration"

**Cause:** Configuration file is malformed or network error occurred.

**Solution:**
1. Verify `config.json` is valid JSON (use a JSON validator)
2. Check that `config.json` is accessible at `/config.json`
3. Check browser console for detailed error messages
4. Verify network connectivity

#### Issue: "Configuration not loaded. Call loadConfig() first."

**Cause:** Attempting to use `getConfig()` before configuration is loaded.

**Solution:**
- This is a developer error. Ensure `loadConfig()` is called in `App.tsx` on mount
- Check that the application waits for configuration to load before rendering components

#### Issue: Authentication fails with "Invalid authorization state"

**Cause:** OAuth2 state parameter mismatch or CSRF attack attempt.

**Solution:**
1. Clear browser cookies and local storage
2. Try logging in again
3. Verify `redirectUri` matches exactly in both configuration and Cognito settings
4. Check that your application URL matches the configured redirect URI

#### Issue: "Access Denied" when accessing S3

**Cause:** IAM role permissions are insufficient or incorrectly configured.

**Solution:**
1. Verify IAM role attached to Identity Pool has correct S3 permissions
2. Check that the policy uses `${cognito-identity.amazonaws.com:sub}` for user isolation
3. Verify bucket name in IAM policy matches your actual bucket
4. Test IAM policy with AWS Policy Simulator

#### Issue: Files from other users are visible

**Cause:** IAM policy not enforcing user isolation correctly.

**Solution:**
1. Review IAM policy for authenticated role
2. Ensure policy uses `${cognito-identity.amazonaws.com:sub}` variable
3. Verify `Condition` block in ListBucket permission
4. Test with multiple user accounts to confirm isolation

#### Issue: CORS errors when uploading files

**Cause:** S3 bucket CORS configuration is missing or incorrect.

**Solution:**
1. Add CORS configuration to S3 bucket (see AWS Credentials Setup)
2. Ensure your application domain is in `AllowedOrigins`
3. Include all necessary methods: GET, PUT, POST, DELETE, HEAD
4. Clear browser cache and try again

#### Issue: "Failed to exchange code for token"

**Cause:** OAuth2 token exchange failed.

**Solution:**
1. Verify `clientId` is correct
2. Check that Cognito domain is correct (without `https://`)
3. Ensure redirect URI matches exactly in Cognito configuration
4. Check Cognito User Pool is active and not deleted
5. Verify network connectivity to Cognito endpoints

#### Issue: Development server won't start with HTTPS

**Cause:** SSL certificate issues with Vite's basicSsl plugin.

**Solution:**
1. Accept the self-signed certificate in your browser
2. Navigate to `https://localhost:8080` and accept the security warning
3. Alternatively, configure a custom SSL certificate in `vite.config.ts`

#### Issue: Configuration changes not taking effect

**Cause:** Configuration is cached or build is stale.

**Solution:**

**For development:**
1. Stop the development server
2. Update `.env.local`
3. Restart the development server with `npm run dev`

**For production:**
1. Update `config.json` in your deployment
2. Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Configuration is loaded at runtime, no rebuild needed

### Debugging Tips

#### Enable Debug Logging

Check browser console for configuration loading messages:
- "config.json not found, falling back to environment variables"
- Configuration validation errors
- AWS SDK errors

#### Verify Configuration Loading

Add this to browser console to check loaded configuration:

```javascript
// This will show the cached configuration (after app loads)
// Note: This is for debugging only, don't expose in production
console.log('Current config:', window.__DEBUG_CONFIG__)
```

#### Test AWS Credentials

Use AWS CLI to test credentials independently:

```bash
# Test S3 access
aws s3 ls s3://your-bucket-name --region us-east-1

# Test Cognito Identity Pool
aws cognito-identity get-id \
  --identity-pool-id us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
  --region us-east-1
```

#### Verify Cognito Configuration

1. Go to Cognito Console
2. Check User Pool → App integration → App client settings
3. Verify callback URLs match your configuration
4. Verify OAuth 2.0 flows are enabled
5. Verify scopes include "openid" and "email"

### Getting Help

If you're still experiencing issues:

1. Check the browser console for error messages
2. Review AWS CloudWatch logs for Lambda/Cognito errors
3. Verify all AWS resources are in the same region
4. Test with a fresh browser profile (no cache/cookies)
5. Consult AWS documentation for Cognito and S3
6. Check GitHub issues for similar problems

### Security Best Practices

1. **Never commit secrets**: Keep `.env.local` and production `config.json` out of version control
2. **Use HTTPS**: Always use HTTPS in production (required for Cognito OAuth2)
3. **Rotate credentials**: Regularly rotate AWS credentials and Cognito secrets
4. **Limit IAM permissions**: Use least-privilege principle for IAM roles
5. **Enable MFA**: Enable multi-factor authentication for AWS console access
6. **Monitor access**: Use AWS CloudTrail to monitor API calls
7. **Use separate environments**: Use different AWS resources for dev/staging/production

## Additional Resources

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS IAM Documentation](https://docs.aws.amazon.com/iam/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [OAuth 2.0 Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/)

## Summary

This configuration guide covers:
- ✅ Development and production configuration methods
- ✅ Step-by-step AWS credentials setup
- ✅ Complete configuration reference
- ✅ Comprehensive troubleshooting guide
- ✅ Security best practices

For quick reference, see `config.example.json` for a complete configuration example.
