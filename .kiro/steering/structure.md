# Project Structure

## Directory Layout

```
drive/
├── .devcontainer/           # Dev container configuration
│   └── devcontainer.json
├── .kiro/                   # Kiro configuration
│   └── steering/            # Steering documents
├── .vscode/                 # VS Code settings
├── public/                  # Static assets & runtime config
│   ├── config.json          # Production AWS configuration
│   └── index.html           # HTML entry point
├── src/                     # Source code
│   ├── components/          # React components
│   │   ├── App.tsx          # Main app component
│   │   ├── FileList.tsx     # File listing component
│   │   ├── FileUpload.tsx   # File upload component
│   │   └── Login.tsx        # Authentication component
│   ├── config/              # Configuration
│   │   └── awsConfig.ts     # AWS config loader
│   ├── services/            # Business logic services
│   │   ├── authService.ts   # Cognito authentication
│   │   └── s3Service.ts     # S3 file operations
│   ├── types/               # TypeScript interfaces
│   │   └── index.ts         # Shared type definitions
│   ├── index.css            # Global styles
│   └── index.tsx            # React entry point
├── node_modules/            # Dependencies (not committed)
├── dist/                    # Build output (generated)
├── package.json             # Dependencies & scripts
├── package-lock.json        # Locked dependency versions
├── tsconfig.json            # TypeScript configuration
├── tsconfig.node.json       # TypeScript config for build tools
├── vite.config.ts           # Vite build configuration
└── README.md                # Project documentation
```

## Key Directories

### `/src/components`
React functional components for UI. Each component:
- Uses React hooks (useState, useEffect)
- Accepts props with TypeScript interfaces
- Handles user interactions and state management
- Delegates business logic to services

### `/src/services`
Service layer for external integrations:
- **authService.ts**: Cognito OAuth2 flow, token management, credential caching
- **s3Service.ts**: S3 operations (list, upload, download, delete), signed URL generation

### `/src/config`
Configuration management:
- **awsConfig.ts**: Loads AWS config from environment variables (dev) or `public/config.json` (prod)
- Exports `getConfig()` function used throughout the app

### `/src/types`
Centralized TypeScript interfaces:
- `S3File` - File metadata from S3
- `AWSConfig` - AWS configuration object
- `AuthState` - Authentication state
- `CognitoUser` - User information

### `/public`
Static assets served as-is:
- **index.html**: React app entry point
- **config.json**: Production AWS configuration (created at deployment time)

## Data Flow

1. **App Component** loads config and manages auth state
2. **Login Component** handles Cognito OAuth2 flow via authService
3. **FileUpload Component** uploads files via s3Service
4. **FileList Component** lists and manages files via s3Service
5. **Services** handle AWS SDK interactions and credential management
6. **Types** ensure type safety across all layers

## Configuration Loading

- **Development**: Reads from `.env.local` via Vite's `import.meta.env`
- **Production**: Reads from `public/config.json` at runtime
- Both flows converge to `getConfig()` function

## Build Output

- **Development**: Served by Vite dev server from memory
- **Production**: Built to `dist/` folder, ready for static hosting
- TypeScript compiled to ES2020 JavaScript
- Assets bundled and optimized by Vite

## File Naming Conventions

- **Components**: PascalCase (e.g., `FileUpload.tsx`)
- **Services**: camelCase with Service suffix (e.g., `authService.ts`)
- **Types**: Exported from `types/index.ts`
- **Config**: camelCase (e.g., `awsConfig.ts`)
