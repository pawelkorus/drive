# Product Overview

## What is Drive?

Drive is a React web application that provides a user-friendly interface for managing files stored in AWS S3. It combines AWS Cognito authentication with S3 file operations to create a secure, cloud-based file management system.

## Core Purpose

Enable users to securely authenticate and manage their files in AWS S3 through a web browser, with per-user file isolation and signed URL downloads.

## Key Features

- **Authentication**: Cognito Identity Pool-based authentication with OAuth2 flow
- **File Management**: List, upload, download, and delete files in S3
- **User Isolation**: Each user's files are stored in a separate S3 prefix (user ID-based)
- **Secure Downloads**: Signed URLs for time-limited file access
- **Environment Configuration**: Support for both development and production deployments

## Target Users

Developers and end-users who need a simple web interface to manage files in AWS S3 with authentication.

## Deployment Model

- **Development**: Local development server with HTTPS (via Vite + basicSsl plugin)
- **Production**: Static site deployment (dist folder) with runtime configuration via `public/config.json`
