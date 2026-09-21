# KM-OUTCOME-REGISTRY-1.0

Date: 2026-09-21
Status: develop / Phase 12
Validation contract: KM-VALIDATION-1.0

## Purpose

KM-OUTCOME-REGISTRY-1.0 is the local persistence layer for point-in-time validation snapshots and later observed outcomes.

It is intentionally separate from:

- activity history;
- shared-result links;
- KM-CASE-1.0;
- AI diagnostics;
- user-facing reading history.

## Storage policy

The registry stores one sanitized prediction snapshot per request fingerprint and at most one observed outcome per record.

It does not store:

- raw question text;
- AI prose;
- birth date;
- uploaded evidence document;
- chat transcript.

An evidence source is represented by sourceKind plus compact sourceRef. The registry does not persist free-text outcome notes; late-occurrence references are opaque as well.

## Default file

If QIMEN_OUTCOME_REGISTRY is set, that path is used.

Otherwise, when QIMEN_APP_ROOT exists:

<QIMEN_APP_ROOT>/outcome-registry.json

Fallback:

~/.local/state/kymon/outcome-registry.json

This prevents the develop preview and production runtime from sharing the same registry by default.

## File safety

- parent directory mode is private when created;
- file mode is 0600 when written;
- write uses temporary file plus rename;
- invalid file version or invalid record fails closed;
- duplicate record IDs fail closed;
- duplicate request fingerprints fail closed;
- duplicate evaluation units fail closed;
- maximum records: 10,000.

This protects normal application integrity but is not an external cryptographic notarization system.

## API-level immutability

registerPrepared:

- creates a sanitized snapshot;
- reuses the existing record if requestFingerprint already exists;
- rejects a second different request for the same evaluationUnitRef.

recordOutcome:

- accepts one outcome;
- refuses overwrite after outcome is attached;
- delegates temporal and evidence checks to KM-VALIDATION-1.0.

## Metrics

report returns KM-VALIDATION-1.0 aggregate metrics.

Only closed observation windows are used by aggregate selective metrics.

## Privacy boundary

The registry is opt-in.

Normal /api/read traffic does not automatically create records.

Policy values:

- autoRegisterReadings=false
- autoCollectOutcomes=false
- storesQuestionText=false
- storesBirthDate=false
- writesCaseLibrary=false

## Case Engine boundary

The registry never mutates CASE_LIBRARY.

No observed outcome becomes a reusable case without a separate manual review outside this registry.
