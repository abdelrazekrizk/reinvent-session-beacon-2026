# Observability

## Monitoring

### CloudWatch Logs

- Lambda function logs
- API Gateway access logs
- Error tracking

### CloudWatch Metrics

- API latency (p50, p95, p99)
- Lambda duration and errors
- DynamoDB read/write capacity
- Bedrock invocation time
- WebSocket connections

### X-Ray Tracing
- Distributed trace correlation
- Service map visualization
- Performance bottleneck identification

### Alarms

- Error rates (>5%)
- Latency (p95 >200ms)
- DynamoDB throttles
- Bedrock timeouts
- WebSocket disconnects

## Key Metrics

| Metric | Target |
|--------|--------|
| API p95 latency | <200ms |
| Bedrock timeout | <5s (3-tier fallback) |
| WebSocket fan-out | <500ms |
| DynamoDB throttles | <1% |

## Required Measurements

| Signal | Target / definition | Current status |
| --- | --- | --- |
| HTTP API latency | p95 ≤500 ms, excluding Bedrock invocation | Not measured; instrumentation unverified |
| Session search latency | ≤200 ms over the full catalog | Not measured; search implementation not found |
| WebSocket message and presence delivery | p95 ≤100 ms end-to-end, from sender submission to receipt by every intended connected recipient | Not measured; WebSocket routes/integrations not found |
| Recommendation generation | ≤5 seconds end-to-end, including retries and fallback; valid cache result ≤100 ms | Not measured; Bedrock path unverified |
| Catalog synchronization | Retrieved catalog data synchronized within 5 minutes while companion is online and authorized | No companion/sync implementation found |
| Analytics processing | EventBridge events available to analytics within 5 minutes | No pipeline implementation found |
| Availability | 99.9% over 30 days (approximately 43 minutes maximum downtime) | No service or availability measurement verified |

Measure WebSocket latency at the end-to-end boundary above; gateway or Lambda duration alone is not equivalent. Report test profile, recipient count, sample window, and percentiles. Do not claim scale or availability from an unrepresentative load test.

## Planned Telemetry

When implemented, use privacy-conscious structured logs, CloudWatch metrics/logs, and X-Ray traces for API and worker boundaries. Candidate signals include request/error counts, latency percentiles, Lambda errors/duration, DynamoDB throttles, Bedrock duration/timeouts/fallback selection, active WebSocket connections, fan-out delivery latency/failures, catalog freshness, deletion-workflow completion, and queue age/retries. Never include tokens, authorization codes, or unnecessary PII in telemetry.

## Alarms and Runbooks

No alarm thresholds or paging policy are verified. Establish thresholds from the approved SLOs and measured baselines, then link each alarm to a tested procedure in `RUNBOOK.md`. Do not treat former generic thresholds as current requirements.
