# Session Beacon

**Find your signal. Plan your week. Meet your people.**

An unofficial AWS re:Invent 2026 attendee-first event planner for session discovery, personal schedules, team coordination, AI-powered insights, and real-time virtual networking.

## ?? Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Development](#development)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Specifications](#specifications)
- [Contributing](#contributing)
- [License](#license)

## ?? Overview

Session-Beacon helps AWS re:Invent attendees maximize their experience by:

- **Discovering** relevant sessions through AI-powered recommendations
- **Planning** personal and team schedules with intelligent conflict detection
- **Collaborating** with teammates through shared itineraries and voting
- **Networking** via real-time breakout rooms and topic-based virtual tables
- **Analyzing** engagement patterns with personalized dashboards

### Key Statistics

- **Node.js Version**: 24.22.2 LTS (Active Support until April 2028)
- **Technology Stack**: TypeScript, React, Lambda, DynamoDB, Bedrock
- **Monorepo**: 7 npm workspaces with Turbo build cache
- **APIs**: RESTful HTTP API + WebSocket real-time
- **Authentication**: Cognito + AWS Builder ID PKCE
- **AI**: Amazon Bedrock (Claude 3 Sonnet) with 4-tier fallback strategy

## ? Features

### 1. Session Discovery (Phase 1 - Foundation)
- Browse all re:Invent sessions by track, format, duration, and level
- Full-text search across session titles, abstracts, speaker names, and topics
- Personalized recommendations via Claude/Bedrock with confidence scoring
- Source-aware catalog with provenance tracking (AWS Events API + enrichments)

### 2. Team Planning (Phase 2 - Planning)
- Create teams and invite colleagues via email
- Build shared team itineraries with member attribution
- Session voting with quorum and consensus calculation
- Automatic conflict detection within team schedules
- Team coverage analysis identifying topic gaps

### 3. Real-Time Networking (Phase 3 - Networking)
- **Breakout Rooms**: 10-person sync discussion spaces (WebSocket)
- **Virtual Tables**: Topic-based 25-person tables with auto-create at 85% capacity
- **Discussion Threads**: Post-session conversations (public, searchable, archived)
- **Presence Tracking**: Real-time participant lists with typing indicators

### 4. Analytics & Insights (Phase 3 - Networking)
- Personal engagement dashboard (sessions viewed, added, team participation)
- Organizer-level insights (trending topics, session popularity)
- Team compatibility analysis based on shared interests
- Immutable activity tracking (90-day retention)

### 5. Intelligent Scheduling (Phase 4 - AI & Scale)
- AI-driven schedule optimization via Claude (travel time, buffering, interest alignment)
- Conflict resolution with priority hierarchy (personal > team > tentative)
- Bedrock integration with 4-tier fallback (cache ? rule-based ? empty)
- Schedule reconciliation with attendee's personal Events API schedule

## ??? Architecture

### System Components

```
+---------------------------------------------------------+
�  Frontend Layer                                          �
�  - React/Vite SPA (TypeScript)                          �
�  - Cognito JWT authentication                           �
�  - Real-time WebSocket connections                      �
�  - Zustand state management                             �
+---------------------------------------------------------+
           ? HTTPS + Cognito JWT
+---------------------------------------------------------+
�  API Layer (AWS)                                         �
�  - API Gateway (HTTP + WebSocket)                       �
�  - Lambda Functions (TypeScript)                        �
�  - Cognito Authorizer                                   �
�  - X-Ray Tracing                                        �
+---------------------------------------------------------+
           ? AWS SDK
+---------------------------------------------------------+
�  Data Layer                                              �
�  - DynamoDB (7 tables)                                  �
�  - ElastiCache (optional: popular queries)              �
�  - EventBridge (async events)                           �
�  - SQS (background jobs)                                �
�  - S3 (reports, exports)                                �
+---------------------------------------------------------+
           ? AWS SDK
+---------------------------------------------------------+
�  External Services                                       �
�  - Amazon Bedrock (Claude 3 Sonnet)                     �
�  - Amazon SES (email notifications)                     �
�  - AWS Events API (via local companion)                 �
�  - CloudWatch (observability)                           �
+---------------------------------------------------------+

+---------------------------------------------------------+
�  Local Events API Companion (Attendee Device)            �
�  - Node.js local process                                �
�  - AWS Builder ID OAuth 2.0 PKCE                        �
�  - Direct HTTPS to api.awsevents.com                    �
�  - OS keychain token storage (secure, no logs)          �
+---------------------------------------------------------+
```

### Two Authentication Boundaries

**Boundary 1: Session-Beacon Platform (Cognito)**
- Platform identity and authorization
- JWT-based API access
- Platform-owned data (teams, itineraries, analytics)

**Boundary 2: AWS Events API (Local Companion)**
- Local attendee authentication (AWS Builder ID PKCE)
- Direct HTTPS to pi.awsevents.com
- Tokens stored in OS keychain (never sent to Session-Beacon)
- Consented metadata sync only

**Critical Rule**: AWS credentials never cross into Session-Beacon; Session-Beacon JWTs never sent to Events API.

### Core Services

| Service | Purpose | Tech |
|---------|---------|------|
| **DiscoveryService** | Session catalog, search, filtering | Lambda + DynamoDB |
| **RecommendationEngine** | Bedrock recommendations + fallback | Lambda + Bedrock |
| **TeamService** | Team CRUD, membership, invitations | Lambda + DynamoDB |
| **ItineraryService** | Shared sessions, conflict detection, coverage | Lambda + DynamoDB |
| **ScheduleOptimizer** | Claude-driven schedule suggestions | Lambda + Bedrock |
| **ConnectionManager** | WebSocket lifecycle (, ) | Lambda |
| **MessageRouter** | WebSocket message fan-out | Lambda |
| **AnalyticsAggregator** | Event collection, metric aggregation | Lambda + DynamoDB |
| **EmailSender** | SES-based notifications | Lambda + SES |

## ?? Quick Start

### Prerequisites

- **Node.js**: 24.22.2 LTS (check with
ode --version)
- **npm**: =10.0.0
- **AWS Account**: For Bedrock, DynamoDB, Lambda, etc.
- **AWS CLI**: v2 configured with appropriate credentials
- **Git**: For version control

### Installation

1. **Clone the repository**

  ```bash
   git clone https://github.com/team/Session-Beacon-2026.git
   cd Session-Beacon
   ```

2. **Install dependencies**

  ```bash
   npm install
   ```

3. **Verify Node.js version**

  ```bash
   node --version  # Must be v24.22.2
   nvm use 24.22.2 # If using nvm
   ```

4. **Configure environment variables**

   Create .env.local files in each app:

   **apps/web/.env.local**:
   `env
   VITE_API_URL=http://localhost:3001
   VITE_COGNITO_CLIENT_ID=your-cognito-client-id
   VITE_COGNITO_DOMAIN=your-cognito-domain
   VITE_COGNITO_REDIRECT_URI=http://localhost:5173/auth/callback
   ```

   **apps/api/.env.local**:
   ```env
   AWS_REGION=us-east-1
   DYNAMODB_TABLE_PREFIX=Session-Beacon-dev
   BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
   BEDROCK_REGION=us-east-1
   COGNITO_USER_POOL_ID=your-pool-id
   COGNITO_CLIENT_ID=your-client-id
   ```

5. **Start development servers**

   Open three terminal windows:

  ```bash
   # Terminal 1: React web app (http://localhost:5173)
   npm run dev --workspace @Session-Beacon/web

   # Terminal 2: Lambda API (http://localhost:3001)
   npm run dev --workspace @Session-Beacon/api

   # Terminal 3: Events API companion
   npm run dev --workspace @Session-Beacon/events-companion
   ```

6. **Access the application**

   - Web app: http://localhost:5173
   - API: http://localhost:3001
   - WebSocket: ws://localhost:3001/chat

## ?? Development

### Available Commands

```bash
npm run dev              # Start all dev servers (requires 3 terminals)
npm run build            # Build all workspaces (TypeScript compilation)
npm run test             # Run all unit and integration tests (Vitest)
npm run test:watch       # Run tests in watch mode
npm run lint             # Lint TypeScript files (ESLint)
npm run format           # Format code (Prettier)
npm run format:check     # Check code formatting
npm run type-check       # Type-check all TypeScript (no emit)
npm run clean            # Remove dist/, .turbo/, build artifacts
```

### Workspace-Specific Commands

```bash
# Web app (React/Vite)
npm run dev --workspace @Session-Beacon/web
npm run build --workspace @Session-Beacon/web

# API (Lambda)
npm run dev --workspace @Session-Beacon/api
npm run test --workspace @Session-Beacon/api

# Events companion
npm run dev --workspace @Session-Beacon/events-companion

# Shared packages
npm run test --workspace @Session-Beacon/domain
npm run build --workspace @Session-Beacon/contracts

# Infrastructure (CDK)
cd infra
npm run cdk:synth        # Synthesize CloudFormation
npm run cdk:deploy       # Deploy to AWS
npm run cdk:diff         # Preview changes
```

### Project Structure

```
Session-Beacon/
+-- apps/
|   +-- web/                 # React/Vite SPA
|   +-- api/                 # Lambda API handlers
|   +-- events-companion/    # Local OAuth companion
|   +-- realtime/            # WebSocket handlers
+-- packages/
|   +-- contracts/           # OpenAPI + Zod schemas
|   +-- domain/              # Business logic
+-- infra/                   # AWS CDK infrastructure
+-- docs/                    # Documentation
+-- README.md               # This file
```

## ?? Deployment

### Development Environment

Deploy to AWS using CloudFormation:

```bash
cd infra

# 1. Synthesize CDK to CloudFormation
npm run cdk:synth

# 2. Deploy stack
aws cloudformation create-stack \
  --stack-name Session-Beacon-dev \
  --template-body file://cdk.out/Session-Beacon-dev.template.json \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --region us-east-1

# 3. Monitor stack creation
aws cloudformation describe-stacks \
  --stack-name Session-Beacon-dev \
  --region us-east-1
```

### Production Deployment

```bash
# 1. Build all artifacts
npm run build

# 2. Deploy infrastructure
aws cloudformation create-stack \
  --stack-name Session-Beacon-prod \
  --template-body file://infra/cloudformation/prod-stack.yaml \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameters ParameterKey=Environment,ParameterValue=prod \
  --region us-east-1

# 3. Deploy application code
# Web: Upload dist/ to S3, invalidate CloudFront
# API: Package Lambda, upload to S3, update function code
# See docs/DEPLOYMENT.md for detailed procedures
```

### Cleanup

```bash
# Delete stack and all resources
aws cloudformation delete-stack \
  --stack-name Session-Beacon-dev \
  --region us-east-1
```

## ?? Documentation

Complete documentation is available in the docs/ directory:

- **[SETUP.md](./docs/SETUP.md)** � Local development environment setup
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** � Detailed system architecture and design decisions
- **[API_REFERENCE.md](./docs/API_REFERENCE.md)** � Complete API endpoint documentation
- **[DATA_MODEL.md](./docs/DATA_MODEL.md)** � DynamoDB schema and data structures
- **[SECURITY.md](./docs/SECURITY.md)** � Authentication, authorization, and compliance
- **[TESTING.md](./docs/TESTING.md)** � Testing strategy and property-based testing
- **[OBSERVABILITY.md](./docs/OBSERVABILITY.md)** � CloudWatch, X-Ray, and monitoring setup
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** � Deployment procedures and scaling
- **[RUNBOOK.md](./docs/RUNBOOK.md)** � Operational procedures and troubleshooting

## ?? Specifications

### Complete Feature Specification

The project includes comprehensive feature specifications:

- **[requirements.md](../.kiro/specs/Session-Beacon/requirements.md)** � 8 patterns, 10 requirements, 8 assumptions, glossary
- **[design.md](../.kiro/specs/Session-Beacon/design.md)** � Architecture, APIs, data models, 10 correctness properties
- **[tasks.md](../.kiro/specs/Session-Beacon/tasks.md)** � 127 implementation tasks, 5 phases, 29 execution waves

### Delivery Roadmap

**Phase 1: Foundation** (6-8 weeks)
- Session catalog & search
- Cognito authentication
- Local Events API companion (OAuth, quota enforcement)
- Attendee profiles & preferences
- ? Checkpoint 1: Foundation tests passing

**Phase 2: Planning** (4-6 weeks)
- Team management & collaboration
- Shared itineraries & voting
- Conflict detection & optimization
- ? Checkpoint 2: Planning tests passing

**Phase 3: Networking & Analytics** (4-6 weeks)
- WebSocket real-time rooms/tables
- Discussion threads & archival
- Analytics collection & dashboards
- Email notifications
- ? Checkpoint 3: Networking tests passing

**Phase 4: AI & Scale** (4-6 weeks)
- Bedrock recommendations with fallback
- Q&A agent (optional)
- AgentCore integration (optional)
- Load testing & horizontal scaling
- ? Checkpoint 4: AI & scale tests passing

## ?? Testing

### Test Coverage

- **Unit Tests**: Business logic, utilities, domain models
- **Integration Tests**: API endpoints, DynamoDB operations, Bedrock integration
- **Property-Based Tests**: Correctness properties validation
- **E2E Tests**: WebSocket flows, real-time networking

### Running Tests

```bash
# All tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific workspace
npm run test --workspace @Session-Beacon/api
```

### Correctness Properties

Session-Beacon enforces 10 core correctness properties:

1. **Source-Aware Data Integrity** � Sessions include source provenance
2. **Conflict Detection Scope** � Conflicts detected only within team itinerary
3. **Token Isolation** � AWS tokens never appear in Session-Beacon API
4. **Fallback Correctness** � Bedrock unavailability triggers tiered fallback
5. **Recommendation Determinism** � Same profile ? same recommendations
6. **Team Itinerary Consistency** � All session IDs reference valid sessions
7. **WebSocket Lifecycle** � Connections enter/exit correctly
8. **Pagination Independence** � Session-Beacon pagination independent of Events API
9. **Analytics Immutability** � Events immutable after creation
10. **Bedrock Timeout Resilience** � 5s timeout max; exponential backoff

## ?? Security

### Authentication & Authorization

- **Cognito User Pool**: Platform sign-in, JWT validation
- **AWS Builder ID PKCE**: Local companion OAuth (not Cognito)
- **API Gateway Authorizer**: Validates JWT on all endpoints
- **Token Isolation**: AWS credentials never forwarded externally

### Data Protection

- **TLS 1.2+**: All communications encrypted
- **DynamoDB Encryption**: AES-256 at rest
- **Token Storage**: OS keychain (not localStorage for AWS tokens)
- **PII Minimization**: Audit trails via CloudTrail
- **Bedrock Guardrails**: Content and safety controls

### Compliance

- **GDPR**: Consent for activity tracking, data export/deletion
- **SOC 2**: Audit trails and access logging
- **Well-Architected**: Security pillar best practices

## ?? Contributing

This is an educational open-source project. Contributions are welcome!

### Getting Started

1. Create a feature branch: git checkout -b feature/your-feature
2. Make changes and commit: git commit -am "Add feature"
3. Run tests:
pm run test
4. Format code:
pm run format
5. Submit a pull request

### Code Standards

- **TypeScript**: Strict mode, no ny
- **Functions**: Fully typed, no implicit returns
- **Tests**: Unit tests for all logic, integration tests for APIs
- **Documentation**: JSDoc for public APIs, ADR for decisions
- **Commits**: Clear messages following conventional commits

## ?? Support & Issues

- **Documentation**: See ./docs/ directory
- **Bug Reports**: GitHub Issues
- **Discussions**: GitHub Discussions
- **AWS Support**: AWS Support plan for infrastructure

## ?? License

MIT License - See LICENSE file for details

## ?? Acknowledgments

- AWS re:Invent organizers and attendees
- AWS Events API team
- Anthropic for Claude models
- AWS open-source community

---

**Status**: MVP Development | **Node.js**: 24.22.2 LTS | **Region**: us-east-1 | **Last Updated**: 2026-11-06
