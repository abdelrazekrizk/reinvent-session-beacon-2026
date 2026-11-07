# Testing Strategy

## Manifest-Declared Commands

Run from the repository root in PowerShell:

```powershell
npm run test
npm run build
npm run lint
npm run type-check
```

## Planned Test Coverage

When implementation exists, add focused unit, integration, and end-to-end tests for:

- **Catalog and source metadata:** optional upstream fields, provenance, independent pagination, empty pages, and safe enrichment.
- **Authorization:** Cognito JWT validation; caller ID must match validated `sub` or authorized scope; team membership/role and organizer access.
- **Companion privacy:** PKCE/token isolation; no token, auth code, or PII leakage to hosted requests/logs; personal schedule sync off by default, explicit/revocable, minimal, caller-only; reservation confirmation and reconciliation.
- **Data integrity:** sessions keyed by `id` only; optional source IDs; analytics keyed by `event_id`; append-only events and server-assigned timestamps.
- **Recommendations:** 0–1 relevance score and ≥0.7 qualifying threshold, cache behavior, bounded five-second end-to-end fallback, and no claim that model output is deterministic.
- **Team planning:** separate team itinerary state, conflict scope, caller authorization, opt-in before sharing any personal reservation status, and no automatic itinerary changes.
- **Realtime:** `$connect` Lambda authorizer, server-derived identity, reject credentials in URLs, room authorization, fan-out, and ≤100 ms p95 end-to-end delivery to every intended recipient.
- **Virtual tables:** 85% trigger at 21/25, auto-create only when enabled and under five per track; disabled/capped behavior.
- **Routes and analytics:** canonical insights/analytics/thread routes, venue navigation parameters `from_session`/`to_session`, provenance, consent, pagination and error contracts.
- **Privacy lifecycle and SLOs:** deletion/anonymization within 30 days including backups/replicas; non-PII audit retention one year; HTTP p95 ≤500 ms excluding Bedrock; search ≤200 ms; availability 99.9% over 30 days.

Keep planned coverage separate from executed results. A load test validates only the documented test profile; it does not by itself prove 50,000-user scale, 10,000 WebSocket connections, or 99.9% availability.
