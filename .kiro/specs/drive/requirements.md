# Requirements Document: Drive - AWS S3 File Management Application

## Introduction

Drive is a React web application that provides secure file management for AWS S3 storage. This requirements document formalizes the system's behavior based on the approved design document. The system enables users to authenticate via AWS Cognito, upload files to S3, list their files with per-user isolation, download files via signed URLs, and delete files. The application supports both development and production deployments through environment-based configuration.

## Glossary

- **System**: The Drive application (React frontend + AWS services)
- **User**: An authenticated end-user accessing the Drive application
- **S3**: Amazon Simple Storage Service for file storage
- **Cognito**: AWS Cognito service for authentication and identity management
- **OAuth2**: Industry-standard authorization protocol used for authentication
- **ID Token**: JWT token issued by Cognito containing user identity information
- **AWS Credentials**: Temporary access credentials (AccessKeyId, SecretKey, SessionToken) obtained from Cognito Identity Pool
- **S3 Prefix**: A path-like string used to organize files in S3 (e.g., "user-id/")
- **User Isolation**: Mechanism ensuring each user can only access their own files
- **Signed URL**: Time-limited URL that grants temporary access to S3 objects
- **Configuration**: AWS settings (region, bucket name, Cognito IDs, etc.) loaded at application startup
- **Session**: A user's authenticated state during a browser session
- **Credential Caching**: Storing AWS credentials in memory to avoid repeated credential exchanges
- **S3 Client**: AWS SDK client instance used to perform S3 operations
- **File Metadata**: Information about a file (key, size, last modified date)
- **Authorization Code**: Temporary code issued by Cognito during OAuth2 flow, exchanged for ID token

## Requirements

### Requirement 1: OAuth2 Authorization Code Flow

**User Story:** As a user, I want to authenticate using AWS Cognito, so that I can securely access my files.

#### Acceptance Criteria

1. WHEN a user clicks the "Login with Cognito" button, THE System SHALL redirect to the Cognito authorize endpoint with client_id, response_type="code", scope="openid email", redirect_uri, and state parameters
2. WHEN the user enters valid credentials in Cognito, THE Cognito service SHALL redirect back to the application with an authorization code in the URL
3. WHEN the application receives an authorization code, THE System SHALL validate the state parameter matches the stored state value
4. WHEN the state parameter is invalid, THE System SHALL display an error message "Invalid authorization state" and remain on the login page
5. WHEN the application receives a valid authorization code, THE System SHALL exchange it for an ID token by calling the Cognito token endpoint with a 10-second timeout
6. WHEN the token exchange succeeds, THE System SHALL store the ID token in memory and mark the user as authenticated
7. IF the token exchange fails or times out, THEN THE System SHALL display an error message and remain on the login page
8. WHEN a user is authenticated, THE System SHALL clear the authorization code and state from the URL using browser history API
9. WHEN the token exchange fails, THE System SHALL allow the user to retry login by clicking the login button again
10. IF the Cognito service is unreachable, THEN THE System SHALL display an error message with a retry option

### Requirement 2: Token Decoding and User ID Extraction

**User Story:** As the system, I want to extract user identity from the ID token, so that I can isolate files per user.

#### Acceptance Criteria

1. WHEN an ID token is received, THE System SHALL validate that the token is a non-empty string
2. IF the token is null or empty, THEN THE System SHALL throw an error "Invalid token: token is required"
3. WHEN a non-empty token is received, THE System SHALL decode the JWT token by splitting on "." and decoding the payload (second part) from base64
4. IF the token format is invalid (not 3 parts), THEN THE System SHALL throw an error "Invalid token format: JWT must have 3 parts"
5. WHEN the token is decoded, THE System SHALL extract the "sub" claim which contains the unique user ID
6. IF the "sub" claim is missing or empty, THEN THE System SHALL throw an error "Invalid token: missing or empty sub claim"
7. WHEN the token is decoded successfully, THE System SHALL cache the user ID in memory for subsequent file operations
8. WHEN a user logs out, THE System SHALL clear the cached user ID
9. WHEN a new token is set, THE System SHALL replace the previously cached user ID with the new one

### Requirement 3: Credential Caching and Reuse

**User Story:** As the system, I want to cache AWS credentials, so that file operations are performant and don't require repeated credential exchanges.

#### Acceptance Criteria

1. WHEN getCredentials() is called for the first time, THE System SHALL exchange the ID token with Cognito Identity Pool for AWS credentials
2. WHEN getCredentials() is called subsequently within the credential lifetime, THE System SHALL return the cached credentials without calling Cognito Identity Pool again
3. WHEN credentials are cached, THE System SHALL store them in memory with their expiration time
4. WHEN a user logs out, THE System SHALL clear the cached credentials
5. WHEN credentials expire (expiration time is reached), THE System SHALL allow them to be re-fetched on the next getCredentials() call
6. IF credential exchange fails, THEN THE System SHALL throw an error and not cache invalid credentials
7. WHEN credentials are successfully obtained, THE System SHALL verify they contain AccessKeyId, SecretKey, and SessionToken before caching

### Requirement 4: Session Management and Logout

**User Story:** As a user, I want to log out, so that my session is terminated and credentials are cleared.

#### Acceptance Criteria

1. WHEN a user clicks the "Logout" button, THE System SHALL clear the cached ID token from memory
2. WHEN a user clicks the "Logout" button, THE System SHALL clear the cached AWS credentials from memory
3. WHEN a user clicks the "Logout" button, THE System SHALL clear the cached user ID from memory
4. WHEN a user logs out, THE System SHALL redirect to the login page within 100 milliseconds
5. WHEN a user closes the browser tab, THE System SHALL clear all credentials (no persistent storage) due to in-memory storage only
6. IF logout fails to clear credentials, THEN THE System SHALL display an error message "Logout failed" and allow the user to retry

### Requirement 5: List Files with User Isolation

**User Story:** As a user, I want to list my files, so that I can see what files I have uploaded.

#### Acceptance Criteria

1. WHEN a user requests to list files, THE System SHALL construct an S3 prefix using the user's ID: "{userId}/"
2. WHEN the System calls ListObjectsV2Command, THE System SHALL pass the user's prefix to ensure only that user's files are returned
3. WHEN S3 returns file objects, THE System SHALL map each object to an S3File interface containing key, size, and lastModified
4. WHEN no files exist under the user's prefix, THE System SHALL return an empty array
5. WHEN a user is not authenticated, THE System SHALL throw an error "Not authenticated"
6. WHEN S3 access is denied, THE System SHALL propagate the S3 error to the UI
7. WHEN a network error occurs, THE System SHALL propagate the network error to the UI

### Requirement 6: Upload File to User Prefix

**User Story:** As a user, I want to upload files, so that I can store them in S3.

#### Acceptance Criteria

1. WHEN a user selects one or more files, THE System SHALL read each file as an ArrayBuffer
2. WHEN a file is ready to upload, THE System SHALL construct the S3 key as "{userId}/{filename}"
3. WHEN uploading, THE System SHALL call PutObjectCommand with the bucket name, S3 key, file content as Uint8Array, and ContentType
4. WHEN the upload succeeds, THE System SHALL trigger a file list refresh
5. WHEN the upload fails, THE System SHALL display an error message to the user
6. WHEN a user is not authenticated, THE System SHALL throw an error "Not authenticated"
7. WHEN multiple files are selected, THE System SHALL upload them sequentially
8. WHEN an upload is in progress, THE System SHALL disable the file input and show "Uploading..." status

### Requirement 7: Download File with Signed URL

**User Story:** As a user, I want to download files, so that I can access my stored files.

#### Acceptance Criteria

1. WHEN a user clicks the download button for a file, THE System SHALL create a GetObjectCommand with the bucket and file key
2. WHEN the download is initiated, THE System SHALL generate a signed URL valid for 3600 seconds (1 hour)
3. WHEN the signed URL is generated, THE System SHALL open it in a new browser tab
4. WHEN the signed URL is opened, THE browser SHALL download the file directly from S3
5. WHEN a user is not authenticated, THE System SHALL throw an error "Not authenticated"
6. WHEN the file does not exist, THE System SHALL propagate the S3 error to the UI
7. WHEN S3 access is denied, THE System SHALL propagate the S3 error to the UI

### Requirement 8: Delete File with Confirmation

**User Story:** As a user, I want to delete files, so that I can remove files I no longer need.

#### Acceptance Criteria

1. WHEN a user clicks the delete button for a file, THE System SHALL display a confirmation dialog with the filename
2. WHEN the user confirms deletion, THE System SHALL call DeleteObjectCommand with the bucket and file key
3. WHEN the user cancels deletion, THE System SHALL take no action
4. WHEN the deletion succeeds, THE System SHALL refresh the file list
5. WHEN the deletion fails, THE System SHALL display an error message to the UI
6. WHEN a user is not authenticated, THE System SHALL throw an error "Not authenticated"
7. WHEN the file does not exist, THE S3 service SHALL return success (idempotent operation)

### Requirement 9: Configuration Loading from config.json

**User Story:** As a system administrator, I want to configure the application via config.json, so that the application can be deployed to production without code changes.

#### Acceptance Criteria

1. WHEN the application starts, THE System SHALL attempt to fetch /config.json with a 2-second timeout
2. WHEN config.json is successfully fetched, THE System SHALL parse it as JSON and validate it contains all required fields
3. WHEN config.json is valid, THE System SHALL cache the configuration in memory
4. WHEN config.json is not found or the fetch times out, THE System SHALL fall back to environment variables
5. WHEN config.json is invalid JSON, THE System SHALL throw an error and display it to the user
6. WHEN config.json is missing required fields, THE System SHALL throw an error "Missing required AWS configuration in config.json"
7. WHEN configuration is loaded, THE System SHALL cache it for the application lifetime (getConfig() returns same object)

### Requirement 10: Configuration Fallback to Environment Variables

**User Story:** As a developer, I want to configure the application via environment variables, so that I can develop locally without creating config.json.

#### Acceptance Criteria

1. WHEN config.json is not available, THE System SHALL read configuration from environment variables
2. WHEN reading environment variables, THE System SHALL use VITE_AWS_REGION, VITE_COGNITO_IDENTITY_POOL_ID, VITE_S3_BUCKET_NAME, VITE_COGNITO_DOMAIN, VITE_CLIENT_ID, VITE_REDIRECT_URI, and VITE_USER_POOL_ID
3. WHEN VITE_AWS_REGION is not set, THE System SHALL default to "us-east-1"
4. WHEN required variables are missing, THE System SHALL throw an error with instructions to set them
5. WHEN environment variables are valid, THE System SHALL cache the configuration in memory

### Requirement 11: Configuration Validation

**User Story:** As the system, I want to validate configuration, so that missing or invalid configuration is caught early.

#### Acceptance Criteria

1. WHEN configuration is loaded, THE System SHALL verify that region is not empty
2. WHEN configuration is loaded, THE System SHALL verify that identityPoolId is not empty
3. WHEN configuration is loaded, THE System SHALL verify that bucketName is not empty
4. WHEN configuration is loaded, THE System SHALL verify that cognitoDomain is not empty
5. WHEN configuration is loaded, THE System SHALL verify that clientId is not empty
6. WHEN configuration is loaded, THE System SHALL verify that redirectUri is not empty
7. WHEN configuration is loaded, THE System SHALL verify that userPoolId is not empty
8. WHEN any required field is missing, THE System SHALL throw an error with a descriptive message

### Requirement 12: Application Initialization

**User Story:** As a user, I want the application to load properly, so that I can use it without errors.

#### Acceptance Criteria

1. WHEN the application mounts, THE System SHALL call loadConfig() to initialize configuration
2. WHEN configuration is loading, THE System SHALL display "Loading configuration..." message
3. WHEN configuration loads successfully, THE System SHALL display the login page if not authenticated
4. WHEN configuration fails to load, THE System SHALL display an error message with the configuration error
5. WHEN a user is authenticated, THE System SHALL display the file management interface (upload and file list)

### Requirement 13: Login Interface

**User Story:** As a user, I want to see a login interface, so that I can authenticate.

#### Acceptance Criteria

1. WHEN the application loads and the user is not authenticated, THE System SHALL display the login page
2. WHEN the login page is displayed, THE System SHALL show the application title "drive"
3. WHEN the login page is displayed, THE System SHALL show a "Login with Cognito" button
4. WHEN the user clicks the login button, THE System SHALL redirect to the Cognito authorize endpoint
5. WHEN the user is authenticated, THE System SHALL hide the login page and show the file management interface

### Requirement 14: File Upload Interface

**User Story:** As a user, I want to upload files, so that I can store them in S3.

#### Acceptance Criteria

1. WHEN the user is authenticated, THE System SHALL display a file upload section with title "Upload Files"
2. WHEN the upload section is displayed, THE System SHALL show a file input that accepts multiple files
3. WHEN a user selects files, THE System SHALL enable the upload process
4. WHEN files are uploading, THE System SHALL disable the file input and show "Uploading..." status
5. WHEN upload succeeds, THE System SHALL clear the file input and trigger a file list refresh
6. WHEN upload fails, THE System SHALL display an error message
7. WHEN upload completes, THE System SHALL re-enable the file input

### Requirement 15: File List Interface

**User Story:** As a user, I want to see my files, so that I can manage them.

#### Acceptance Criteria

1. WHEN the user is authenticated, THE System SHALL display a file list section with title "Files (count)"
2. WHEN the file list is loading, THE System SHALL display "Loading files..." message
3. WHEN no files exist, THE System SHALL display "No files uploaded yet" message
4. WHEN files exist, THE System SHALL display a table with columns: Name, Size, Modified, Actions
5. WHEN files are displayed, THE System SHALL show the file key (name) in the Name column
6. WHEN files are displayed, THE System SHALL show the file size in KB in the Size column
7. WHEN files are displayed, THE System SHALL show the last modified date in the Modified column
8. WHEN files are displayed, THE System SHALL show Download and Delete buttons in the Actions column
9. WHEN the file list fails to load, THE System SHALL display an error message

### Requirement 16: File Download Action

**User Story:** As a user, I want to download files, so that I can access my stored files.

#### Acceptance Criteria

1. WHEN a user clicks the Download button for a file, THE System SHALL generate a signed URL
2. WHEN the signed URL is generated, THE System SHALL open it in a new browser tab
3. WHEN the download fails, THE System SHALL display an error message
4. WHEN the download succeeds, THE browser SHALL download the file to the user's default download location

### Requirement 17: File Delete Action

**User Story:** As a user, I want to delete files, so that I can remove files I no longer need.

#### Acceptance Criteria

1. WHEN a user clicks the Delete button for a file, THE System SHALL display a confirmation dialog
2. WHEN the user confirms deletion, THE System SHALL delete the file from S3
3. WHEN the user cancels deletion, THE System SHALL take no action
4. WHEN deletion succeeds, THE System SHALL refresh the file list
5. WHEN deletion fails, THE System SHALL display an error message

### Requirement 18: Logout Functionality

**User Story:** As a user, I want to log out, so that I can end my session.

#### Acceptance Criteria

1. WHEN the user is authenticated, THE System SHALL display a "Logout" button in the header
2. WHEN a user clicks the Logout button, THE System SHALL clear all credentials
3. WHEN a user logs out, THE System SHALL redirect to the login page
4. WHEN a user logs out, THE System SHALL clear the authentication state

### Requirement 19: Error Handling for Authentication

**User Story:** As the system, I want to handle authentication errors gracefully, so that users understand what went wrong.

#### Acceptance Criteria

1. WHEN token exchange fails, THE System SHALL throw an error "Failed to exchange code for token"
2. WHEN token format is invalid, THE System SHALL throw an error "Invalid token format"
3. WHEN a user is not authenticated, THE System SHALL throw an error "Not authenticated"
4. WHEN authentication errors occur, THE System SHALL display the error message to the user
5. WHEN an authentication error occurs, THE System SHALL allow the user to retry login

### Requirement 20: Error Handling for S3 Operations

**User Story:** As the system, I want to handle S3 errors gracefully, so that users understand what went wrong.

#### Acceptance Criteria

1. WHEN S3 access is denied, THE System SHALL propagate the S3 error message to the UI
2. WHEN a file is not found, THE System SHALL propagate the S3 error message to the UI
3. WHEN the bucket does not exist, THE System SHALL propagate the S3 error message to the UI
4. WHEN a network error occurs, THE System SHALL propagate the network error message to the UI
5. WHEN an S3 error occurs, THE System SHALL display the error message to the user

### Requirement 21: Error Handling for Configuration

**User Story:** As the system, I want to handle configuration errors gracefully, so that administrators understand what went wrong.

#### Acceptance Criteria

1. WHEN config.json is missing required fields, THE System SHALL throw an error with field names
2. WHEN environment variables are incomplete, THE System SHALL throw an error with instructions
3. WHEN configuration fails to load, THE System SHALL display the error message to the user
4. WHEN configuration errors occur, THE System SHALL prevent the application from loading

### Requirement 22: S3 Client Initialization

**User Story:** As the system, I want to initialize the S3 client efficiently, so that file operations are performant.

#### Acceptance Criteria

1. WHEN the first S3 operation is requested, THE System SHALL create an S3Client instance with the configured region and credentials
2. WHEN subsequent S3 operations are requested, THE System SHALL reuse the existing S3Client instance
3. WHEN credentials are cleared (logout), THE System SHALL allow the S3Client to be recreated on next authentication

### Requirement 23: User Isolation via S3 Prefix

**User Story:** As the system, I want to isolate files per user, so that users cannot access other users' files.

#### Acceptance Criteria

1. WHEN a user performs any file operation, THE System SHALL use the user's ID as an S3 prefix
2. WHEN listing files, THE System SHALL only return files under the user's prefix
3. WHEN uploading a file, THE System SHALL store it under the user's prefix
4. WHEN downloading a file, THE System SHALL only allow access to files under the user's prefix
5. WHEN deleting a file, THE System SHALL only allow deletion of files under the user's prefix
6. WHEN two different users authenticate, THE System SHALL use different prefixes for each user

### Requirement 24: Signed URL Expiration

**User Story:** As the system, I want to generate signed URLs with expiration, so that downloads are time-limited.

#### Acceptance Criteria

1. WHEN a signed URL is generated for download, THE System SHALL set the expiration time to 3600 seconds (1 hour)
2. WHEN a signed URL expires, THE System SHALL no longer allow access to the file via that URL
3. WHEN a user requests a new download, THE System SHALL generate a new signed URL

### Requirement 25: File Metadata Display

**User Story:** As a user, I want to see file metadata, so that I can understand my files.

#### Acceptance Criteria

1. WHEN files are listed, THE System SHALL display the file key (name) for each file
2. WHEN files are listed, THE System SHALL display the file size in kilobytes (KB)
3. WHEN files are listed, THE System SHALL display the last modified date in local date format
4. WHEN a file size is calculated, THE System SHALL divide the byte size by 1024 and round to 2 decimal places

### Requirement 26: File List Refresh

**User Story:** As the system, I want to refresh the file list, so that users see the latest files.

#### Acceptance Criteria

1. WHEN a file is uploaded successfully, THE System SHALL trigger a file list refresh
2. WHEN a file is deleted successfully, THE System SHALL trigger a file list refresh
3. WHEN the file list is refreshed, THE System SHALL call listFiles() to get the latest file list
4. WHEN the file list is refreshed, THE System SHALL update the UI with the new file list

### Requirement 27: Development Environment Configuration

**User Story:** As a developer, I want to configure the application for development, so that I can test locally.

#### Acceptance Criteria

1. WHEN the application runs in development, THE System SHALL read configuration from environment variables
2. WHEN environment variables are set, THE System SHALL use them to configure AWS services
3. WHEN the application starts, THE System SHALL display "Loading configuration..." while loading
4. WHEN configuration loads successfully, THE System SHALL proceed to the login page

### Requirement 28: Production Environment Configuration

**User Story:** As a system administrator, I want to configure the application for production, so that it can be deployed without code changes.

#### Acceptance Criteria

1. WHEN the application runs in production, THE System SHALL attempt to load configuration from /config.json
2. WHEN config.json is successfully loaded, THE System SHALL use it to configure AWS services
3. WHEN config.json is not available, THE System SHALL fall back to environment variables
4. WHEN configuration loads successfully, THE System SHALL proceed to the login page

### Requirement 29: HTTPS Support

**User Story:** As a developer, I want HTTPS support in development, so that I can test secure connections.

#### Acceptance Criteria

1. WHEN the development server starts, THE System SHALL use HTTPS (via Vite basicSsl plugin)
2. WHEN the development server is accessed, THE browser SHALL accept the self-signed certificate
3. WHEN the application runs, THE System SHALL communicate with AWS services over HTTPS

### Requirement 30: Application Header

**User Story:** As a user, I want to see the application title, so that I know what application I'm using.

#### Acceptance Criteria

1. WHEN the application loads, THE System SHALL display a header with the title "drive"
2. WHEN the user is authenticated, THE System SHALL display the "Logout" button in the header
3. WHEN the user is not authenticated, THE System SHALL not display the "Logout" button

### Requirement 31: Drag and Drop File Upload

**User Story:** As a user, I want to drag and drop files onto the upload area, so that I can upload files more conveniently without using the file picker.

#### Acceptance Criteria

1. WHEN the user is authenticated, THE System SHALL display a drag-and-drop zone in the file upload section
2. WHEN a user drags files over the drag-and-drop zone, THE System SHALL highlight the zone to indicate it is active
3. WHEN a user drags files over the drag-and-drop zone, THE System SHALL display visual feedback (e.g., border highlight or background color change)
4. WHEN a user drops files on the drag-and-drop zone, THE System SHALL accept the files and initiate upload
5. WHEN files are dropped on the drag-and-drop zone, THE System SHALL read each file as an ArrayBuffer
6. WHEN files are dropped on the drag-and-drop zone, THE System SHALL construct the S3 key as "{userId}/{filename}" for each file
7. WHEN files are dropped on the drag-and-drop zone, THE System SHALL upload files sequentially to S3
8. WHEN files are dropped on the drag-and-drop zone, THE System SHALL disable the drag-and-drop zone and show "Uploading..." status
9. WHEN upload succeeds, THE System SHALL clear the drag-and-drop zone and trigger a file list refresh
10. WHEN upload fails, THE System SHALL display an error message and re-enable the drag-and-drop zone
11. WHEN a user drags files over the drag-and-drop zone, THE System SHALL prevent the default browser behavior (file opening)
12. WHEN a user drops files on the drag-and-drop zone, THE System SHALL prevent the default browser behavior (file opening)
13. WHEN the drag-and-drop zone is active, THE System SHALL accept multiple files in a single drop operation
14. WHEN files are dropped on the drag-and-drop zone, THE System SHALL filter out non-file items (e.g., folders, text)
15. WHEN a user is not authenticated, THE System SHALL not display the drag-and-drop zone

