# Deployment and Infrastructure Status

## Safe Repository Inspection (PowerShell)

From ``, these are read-only checks:

```powershell
Test-Path .\infra\cloudformation\dev-stack.yaml
Test-Path .\infra\cloudformation\prod-stack.yaml
Test-Path .\infra\lib\app.ts
Get-Content .\infra\cdk.json
Get-Content .\infra\cloudformation\dev-stack.yaml
```

The root manifest declares the following scripts; running them may still fail because app/package source entry points and tests were not found:

```powershell
npm run build
npm run test
npm run lint
npm run type-check
```

No build, synth, or deployment was run for this documentation update. CDK synth/deploy and production deployment are blocked until the missing entry points, handlers, dependency wiring, templates, and validated deployment configuration are supplied. Do not treat the dev template as a full-stack deployment recipe.

The infra package declares `cdk:synth`; the command is shown only for reference and is currently blocked by the missing CDK app/handler. Do not deploy or destroy stacks from this scaffold.

```powershell
Push-Location .\infra
npm run cdk:synth
Pop-Location
```

local synthesis

infrastructure scaffold is in a valid local synthesis state.

I verified it with:

Set-Location '.\infra'; npm run build; npm run cdk:synth -- --json > cdk-synth-output.json; $LASTEXITCODE

and it completed with:

Successfully synthesized to G:\Session-Beacon-2026\infra\cdk.out
exit code 0

## Development Deployment

```bash
cd infra
npm run cdk:synth
aws cloudformation create-stack \
  --stack-name Session-Beacon-dev \
  --template-body file://cdk.out/Session-Beacon-dev.template.json \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Production Deployment

```bash
npm run build
aws cloudformation create-stack \
  --stack-name Session-Beacon-prod \
  --template-body file://infra/cloudformation/prod-stack.yaml \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameters ParameterKey=Environment,ParameterValue=prod \
  --region us-east-1
```

## Cleanup

```bash
aws cloudformation delete-stack \
  --stack-name Session-Beacon-dev \
  --region us-east-1
```

## Scaling Considerations

DynamoDB: On-demand or provisioned capacity
Lambda: Concurrent execution limits
WebSocket: Connection limits and fan-out optimization
Bedrock: Request rate limits

## Deployment Readiness and Follow-up

Before any deployment, implement and validate the application and infrastructure entry points, define least-privilege roles and parameters, add environment-specific templates, confirm regions/quotas, and run a reviewed non-production synth/deployment workflow. Production deployment, multi-region failover, backup/deletion controls, WebSocket routes/authorizer, and complete HTTP API integration are not verified or provisioned. No credentials or live AWS resources were accessed.
