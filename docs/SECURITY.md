# Security Architecture

## Identity and Authorization Boundaries

### Session-Beacon hosted APIs

- Cognito authenticates Session-Beacon users. Hosted HTTP APIs require a valid Cognito JWT.
- Validate signature and expiry; derive the caller from the validated `sub`.
- For any caller-supplied attendee ID, require a match to the validated subject or an explicitly authorized role/scope. Do not trust a body/path ID by itself.
- Team data requires current membership and operation-specific role authorization. Organizer analytics require organizer authorization.
- The separate WebSocket API uses a Lambda authorizer on `$connect`; derive identity server-side from the validated Cognito subject.

### Local Events API companion

- The local companion uses AWS Builder ID authorization-code-with-PKCE and calls the AWS Events API directly over HTTPS.
- Keep tokens local: browser client tokens in memory; native companion tokens in OS keychain or equivalent user-only secure storage.
- Authorization codes and refresh tokens go only to the provider-documented token endpoint; access tokens go only to the Events API resource server. Never forward them to Session-Beacon.
- AWS Event registration is external. Companion operations must respect provider access rules and per-attendee quotas.

## Token and WebSocket Rules

**Never log tokens, authorization codes, passwords, or reusable credentials**—including in “secure” or audited logs. Do not place reusable credentials in URLs or query strings. The companion must not include AWS credentials in platform telemetry or hosted API requests. The Session-Beacon Cognito token is not sent to the Events API.

For WebSocket upgrades, use a supported secure non-URL credential transport (the target spec calls for a Secure, HttpOnly, SameSite cookie for browsers, or an Authorization header for compatible clients). Verify transport support before implementation. The `$connect` authorizer validates the session; ignore any client-supplied attendee identity.

## Consent and Data Boundaries

- Personal schedule synchronization is off by default. It requires explicit, revocable opt-in, sends only minimum necessary data for the caller, and does not expose a private schedule to a team unless separately authorized.
- Catalog metadata sync is separate from personal schedule sync. Reservation/cancellation requires attendee confirmation; Session-Beacon team itinerary is separate platform state, not an Events API booking.
- Bedrock/agent use must follow attendee opt-in and authorized scope. Redact or anonymize sensitive personal data before model calls as required by the specs.

## Encryption, Access, and Retention

- Use HTTPS/TLS for hosted API traffic and KMS-backed encryption at rest.
- Personal-only data, including private itinerary data, uses user-scoped data keys. Shared team itinerary and voting data use team-scoped data keys protected by KMS envelope encryption.
- Check current team membership and role before every protected read, write, or decryption. Removal/revocation denies future platform access; do not claim it erases copies already obtained.
- Delete or anonymize personal data within 30 days across active stores, replicas, archives, and backups. Backups require expiry or documented cryptographic erasure meeting the same deadline.
- Retain non-PII audit records for one year unless a documented legal requirement requires longer; personal identifiers in audit records remain removable/anonymizable within 30 days.
- Bedrock Guardrails, if implemented, must be attached to the relevant model interactions; their presence is not verified.

## Verification Required

Before launch, test Cognito `sub` ownership checks, role/team authorization, WebSocket `$connect` authorization and URL-credential rejection, token nonappearance in logs/requests, opt-in and revocation behavior, KMS key scoping, and deletion across replicas/backups. See `TESTING.md`, `DATA_MODEL.md`, and `RUNBOOK.md`.
