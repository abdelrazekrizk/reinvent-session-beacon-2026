# Data Model

This describes the target DynamoDB model

## Target Tables

### `sessions`

- **Partition key:** `id` (required; no sort key).
- **Attributes:** `source_event_id` and `source_session_id` are optional source attributes, not required keys. Source fields are optional and retain provenance; independently sourced enrichments are labeled.
- **GSIs:** `track` / `start_time_local`; optional `source_event_id` / `source_session_id` where both index attributes exist.
- **Expiry:** The design mentions `expires_at` with a 90-day cache-invalidation policy. Whether catalog records themselves should expire is unresolved; do not apply TTL to canonical catalog data without confirming intended semantics.

### `attendee_profiles`

- **Partition key:** `attendee_id` (validated Cognito subject).
- **Attributes:** role, experience level, interests, skills, timezone, and creation/update timestamps.

### `teams`

- **Partition key:** `id`; **sort key:** `created_at`.
- **Attributes:** name, team lead, members, invite code, and member limit.
- **GSIs:** team lead / creation time; invite code.

### `team_itinerary_entries`

- **Partition key:** `team_id`; **sort key:** `session_id`.
- **Attributes:** shared attendee IDs, `added_by`, timestamp, and Session-Beacon plan status. Reservation status, if collected, remains hidden from the team unless that attendee separately opts in to share it for that team.
- A confirmed team itinerary entry is not an AWS Events API reservation.

### `websocket_connections`

- **Partition key:** `connection_id`; **sort key:** validated `attendee_id`.
- **Attributes:** optional room ID/type, display name, connection/activity timestamps.
- **GSI:** room ID / connection timestamp.
- **Expiry:** 30-minute idle-connection target, represented by an expiry attribute; actual cleanup behavior is unverified.

### `ai_recommendations`

- **Partition key:** `attendee_id`; **sort key:** `generated_at`.
- **Attributes:** recommendations, confidence score, optional fallback strategy, `expires_at`.
- **Expiry:** 24-hour recommendation-cache TTL target.

### `analytics_events`

- **Partition key:** `event_id` (UUID); attendee ID is an optional attribute, not a key.
- **Attributes:** event type, optional team/session/attendee IDs, metadata, server-assigned timestamp, source and consent basis where applicable.
- **GSIs:** attendee ID / timestamp; event type / timestamp; team ID / timestamp.
- **Expiry:** design target is 90 days for retained/anonymized data; personal data must be deleted or anonymized within 30 days, which takes precedence.

## Other Target Entities

The specs also describe teams' votes, personal profiles/schedules, insights, venues/amenities, rooms, virtual tables, chat messages, discussion threads, agent tasks, and engagement metrics. They do not all have finalized DynamoDB key definitions, and the task list includes additional tables (such as `session_votes`) not in the original seven-table set. Treat these as target entities only; do not infer keys, GSIs, or provisioning status. Resolve schema gaps before implementation.

## Retention, Encryption, and Deletion

- Personal data, including linked thread content and analytics, must be deleted or anonymized within 30 days of a valid request across active stores, replicas, archives, and backups. Backups need explicit expiry or a documented cryptographic-erasure process that meets the same deadline.
- Non-PII audit records are retained for one year unless a documented legal requirement requires longer. Personal identifiers in audit records must be removable/anonymizable within 30 days.
- DynamoDB encryption at rest uses KMS. Personal-only data uses user-scoped data keys; shared team itinerary and voting data use team-scoped data keys with KMS envelope encryption. Authorization and current team membership are checked for every protected operation.
- TTL is asynchronous expiry, not a substitute for the 30-day deletion workflow. Do not claim deletion or cryptographic erasure until verified across each copy and key path.
