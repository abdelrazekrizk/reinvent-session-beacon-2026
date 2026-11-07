# Session-Beacon API Reference

## Status and Base URL

This document describes the **target API contract**.

Base path: `https://{configured_api_host}/api/v1`

All hosted HTTP requests require a valid Session-Beacon Cognito JWT. The server validates the token and derives the caller from its validated `sub`; any caller-supplied attendee ID must match that identity unless an explicitly authorized role or scope permits otherwise. Team and organizer operations additionally require their respective authorization.

## HTTP Conventions

- JSON request and response bodies use `{ status, data, error? }`; errors use `{ status: "error", error: { code, message, details? } }`.
- Session listing uses `page` (default 1), `limit` (default 20, maximum 100), and optional `track`, `format`, and `search`. A page beyond available results returns an empty list and the pagination metadata.
- Source-backed catalog fields are optional. Return provenance for sourced or enriched values where available; do not imply that missing source fields exist.
- Expected errors include `400` invalid input, `401` missing/invalid authentication, `403` forbidden, `404` not found, and `500` unexpected server failure. These are contract targets, not verified runtime responses.

## Catalog and Team Planning

| Method and route | Target purpose | Authorization |
| --- | --- | --- |
| `GET /api/v1/sessions` | Browse/search catalog; `page`, `limit`, `track`, `format`, `search` | Cognito attendee |
| `GET /api/v1/sessions/{id}` | Read catalog details and available source metadata | Cognito attendee |
| `POST /api/v1/teams` | Create a team | Cognito attendee |
| `GET /api/v1/teams/{id}` | Read a team | Current team member |
| `POST /api/v1/teams/{id}/members/invite` | Invite a member | Team lead / authorized team role |
| `DELETE /api/v1/teams/{id}/members/{attendee_id}` | Remove a member | Team lead / authorized team role |
| `POST /api/v1/teams/{id}/itinerary` | Add a session to the Session-Beacon team plan | Current team member |
| `GET /api/v1/teams/{id}/itinerary` | Read shared itinerary and coverage | Current team member |

Team itinerary state is Session-Beacon-owned; it is not an AWS Events API reservation. Private schedule data and reservation status are not shared with a team by default.

## Insights and Analytics

| Method and route | Target purpose | Authorization |
| --- | --- | --- |
| `POST /api/v1/insights/recommendations` | Return recommendations; optional `{ "force_refresh": true }` | Cognito caller; own profile/context |
| `POST /api/v1/insights/team-analysis` | Analyze authorized team data | Current team member; team lead for lead-only actions |
| `POST /api/v1/insights/qa` | Answer a catalog question | Cognito caller; server-derived caller identity |
| `GET /api/v1/insights/organizer/analytics` | Read aggregate, provenance-labeled organizer analytics | Organizer |
| `GET /api/v1/analytics/attendee/{id}` | Read personal analytics | `{id}` must match validated `sub` or authorized scope |
| `GET /api/v1/analytics/team/{id}` | Read shared team analytics | Current team member / authorized role |

Scores use the spec-defined scales: recommendation relevance and evidence confidence are 0–1; team compatibility is 0–100. Return up to 10 recommendations with relevance ≥0.7. Team-analysis session suggestions require evidence confidence ≥0.75; below that threshold, report a supported gap without suggesting sessions. Confidence is not a calibrated probability unless calibration is established. Recommendations must not auto-add sessions to a team itinerary. Analytics must distinguish Session-Beacon activity from explicitly authorized or independently verified sources; omit unavailable measurements.

## Schedule, Venue, and Threads

| Method and route | Target purpose | Authorization / boundary |
| --- | --- | --- |
| `GET /api/v1/schedule/{attendee_id}/conflicts` | Detect conflicts in the caller's Session-Beacon plan and any separately synced own schedule | Caller ID checked against validated `sub` |
| `POST /api/v1/schedule/{attendee_id}/optimize` | Suggest schedule options; does not commit changes | Caller ID checked; attendee approval required for personal changes |
| `POST /api/v1/schedule/sync` | Receive minimum necessary own-schedule data from companion | Companion sync is off by default; explicit, revocable opt-in; no AWS token accepted |
| `GET /api/v1/venues/navigation?from_session={id}&to_session={id}` | Return navigation only when verified venue data supports it | Cognito attendee; unavailable data is not inferred |
| `GET /api/v1/threads` | Search/list threads; supports session, track, keyword, and pagination filters | Cognito attendee; content subject to deletion policy |
| `POST /api/v1/threads/{id}/messages` | Add a reply; author is derived from validated `sub` | Cognito attendee with thread access |

The companion performs Builder ID PKCE and AWS Events API catalog/schedule operations locally and directly with the provider. Catalog metadata synchronization and personal schedule synchronization are separate flows. Personal schedule sync is **off by default**, minimal, caller-only, explicitly authorized, and revocable. Reservation/cancellation requires an explicit confirmation for each operation. AWS access/refresh tokens and authorization codes must never be sent to this API.

## WebSocket API

The WebSocket API is separate from the HTTP API. Target endpoints:

- Breakout room: `wss://{configured_api_host}/v1/rooms/{room_id}/stream`
- Virtual table: `wss://{configured_api_host}/v1/tables/{table_id}/stream`

The `$connect` Lambda authorizer validates the Cognito session using a supported secure **non-URL** credential transport. For browser clients the spec calls for a Secure, HttpOnly, SameSite cookie; other clients may use a secure Authorization header where supported. Transport compatibility must be verified before implementation. Never place tokens or reusable credentials in a URL/query string. Derive attendee identity from the validated Cognito subject and ignore client-supplied identity.

Target message actions include `join_room`, `leave_room`, and `message`; room membership and authorization are server-validated. Virtual-table creation follows the spec: trigger at 85% (21/25), only if enabled and below five tables per track. If disabled or capped, do not auto-create another table.

## Performance and Privacy Boundaries

- HTTP API: p95 ≤500 ms, excluding Bedrock; search ≤200 ms.
- WebSocket message and presence delivery: p95 ≤100 ms end-to-end, from sender submission to receipt by every intended connected recipient.
- Personal data: delete/anonymize within 30 days, including replicas, archives, and backups; non-PII audit records: one year unless a documented legal requirement requires longer.

These are specification targets, not measured service levels. See `ARCHITECTURE.md`, `SECURITY.md`, and `OBSERVABILITY.md` for current implementation gaps.
