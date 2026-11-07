# Local Development Setup

## Validated Repository Prerequisites

- Node.js `24.22.2` and npm `>=10` (root manifest requirements).
- AWS CLI v2
- AWS Account
- Docker are not required for the currently verifiable root-level inspection.

## Root Workflow (Manifest-Declared, Unverified)

From the repository root in PowerShell:

```powershell
npm install
npm run dev
npm run lint
npm run test
npm run build
npm run type-check
```
## Installation

1. Clone repository
2. Run: npm install
3. Configure .env.local files
4. Start dev servers in 3 terminals

## Environment Variables

### apps/web/.env.local
VITE_API_URL=http://localhost:3001
VITE_COGNITO_CLIENT_ID=your-id
VITE_COGNITO_DOMAIN=your-domain

### apps/api/.env.local
AWS_REGION=us-east-1
DYNAMODB_TABLE_PREFIX=Session-Beacon-dev
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
