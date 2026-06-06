# drive

A React web application for managing files in AWS S3 with Cognito authentication.

> **Note**: This project is fully generated using [Kiro](https://kiro.dev).

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local`:
```bash
cp .env.example .env.local
```

3. Configure AWS credentials in `.env.local`

4. Start the dev server:
```bash
npm run dev
```

## Build

```bash
npm run build
```

Deploy the `dist/` folder. Update `public/config.json` with production AWS configuration before building.

## Features

- List, upload, download, and delete files in S3
- Cognito Identity Pool authentication
- Per-user file isolation via S3 prefixes
- Signed URLs for secure file access
