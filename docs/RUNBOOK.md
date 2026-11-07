# Operational Runbook

## First Checks: Repository / Deployment Blockers

For a local repository triage, from `G:\Session-Beacon-2026`:

```powershell
Test-Path .\infra\cloudformation\dev-stack.yaml
Test-Path .\infra\cloudformation\prod-stack.yaml
Test-Path .\infra\lib\app.ts
Test-Path .\apps\api\src
Test-Path .\apps\realtime\src
```

The missing production template and CDK app/handler are known blockers. The dev CloudFormation artifact is limited; do not infer that API routes, WebSocket infrastructure, or application code exist. Refer to `DEPLOYMENT.md` and `ARCHITECTURE.md` before proposing a deployment.

## Incident Triage

### HTTP API errors or elevated latency

1. Establish affected route, time window, request IDs, status codes, and impact.
2. Compare measured HTTP p95 with the target of ≤500 ms (Bedrock excluded); inspect API/Lambda and datastore spans when instrumentation exists.
3. Check recent approved changes and dependency health. Preserve logs without collecting tokens or unnecessary PII.
4. Escalate to the service owner. Roll back only using a known-good, reviewed artifact and an approved deployment procedure; none is currently documented as runnable.

### WebSocket connection or delivery failures

1. Separate `$connect` authorization failures from route handling, room membership, and fan-out failures.
2. Confirm identity comes from the validated Cognito subject; do not ask users to put credentials in URLs.
3. Measure end-to-end p95 from sender submission to receipt by every intended recipient; target ≤100 ms. Check connection state and stale-connection handling if those systems exist.
4. WebSocket routes, integrations, and authorizer are not verified in the current stack; escalate as an implementation/deployment blocker rather than treating this as a live-service fault.

### Bedrock recommendation degradation

1. Confirm whether a valid cache response was served and whether `force_refresh` was requested.
2. Review timeout/fallback telemetry, quota, and the shared five-second end-to-end budget if implemented.
3. Do not expose prompts or attendee PII in incident notes. Use the approved degraded-mode response; no live fallback path is verified.

### DynamoDB throttling or data inconsistency

1. Identify table/index, operation, throttling window, and affected requests before changing capacity.
2. Check request patterns and index access before proposing a schema/capacity change.
3. For suspected data loss, stop nonessential writes only under an approved incident decision; preserve evidence and validate restore points in a non-production environment. No restore procedure or production table set is verified.

### Privacy deletion request or suspected token exposure

1. Route deletion requests through the designated privacy owner and track completion within the 30-day requirement across active stores, replicas, archives, and backups.
2. Never copy tokens, authorization codes, or personal schedule details into logs or tickets. Revoke/contain exposed credentials using the provider's approved process; do not request credentials in incident notes.
3. Non-PII audit records may be retained for one year unless a documented legal requirement applies; linked personal identifiers must remain removable/anonymizable within 30 days.

## Readiness Gaps Before Operations

Assign service ownership and escalation contacts; define SLO-backed alert thresholds; implement telemetry; create reviewed deployment/rollback and regional failover procedures; test backup restoration and deletion across replicas/backups; and validate each procedure in a non-production environment. Related targets: `OBSERVABILITY.md`, `SECURITY.md`, `DATA_MODEL.md`, and `DEPLOYMENT.md`.
