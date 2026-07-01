# Security Specification: Clients Database

## 1. Data Invariants
- Each client document has a unique string ID conforming to `^[a-zA-Z0-9_\-]+$`.
- A client must be owned by a user: `userId` in the document data must match the authenticated user's UID (`request.auth.uid`).
- A client cannot be created without a name and an address.
- `createdAt` must be the server time at creation: `request.time`.
- `updatedAt` must be the server time at update: `request.time`.
- Users can only read, create, update, or delete their own clients. No public reading of client lists.
- Email verification may be required if user is signed in.

## 2. The "Dirty Dozen" Payloads (Deny Cases)
1. **Unauthenticated Write**: Creating a client when not signed in.
2. **Identity Spoofing (Create)**: Creating a client where `userId` is set to another user's UID.
3. **Identity Spoofing (Update)**: Attempting to modify the `userId` field to another user's UID.
4. **Foreign Client Read**: Authenticated user trying to read a client belonging to a different user.
5. **Foreign Client Delete**: Authenticated user trying to delete a client belonging to a different user.
6. **Missing Required Name**: Client payload where `name` is missing or empty.
7. **Missing Required Address**: Client payload where `address` is missing or empty.
8. **Malicious ID injection**: Document ID is massive (e.g., 200 characters) or contains forbidden symbols to trigger indexing/resource-exhaustion.
9. **Payload Size Flood**: Creating a client with a `name` larger than 256 characters.
10. **Temporal Hijacking (createdAt)**: Setting a manual client-side timestamp on `createdAt` instead of `request.time`.
11. **Temporal Hijacking (updatedAt)**: Setting a manual client-side timestamp on `updatedAt` instead of `request.time`.
12. **Ghost Field / Shadow Field injection**: Adding extra unapproved fields to the document (e.g., `isAdmin: true`).

## 3. Mock Test Runner (TDD)
Below is the outline of `firestore.rules.test.ts` representing the test runner verifying that all "Dirty Dozen" payloads are rejected.

```typescript
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";

// The test runner verifies that permissions are denied for the Dirty Dozen:
// - Creating without auth fails.
// - Creating with invalid userId fails.
// - Updating someone else's client fails.
// - Inserting shadow fields fails.
```
