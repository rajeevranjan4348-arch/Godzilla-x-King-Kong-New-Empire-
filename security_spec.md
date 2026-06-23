# Security Specification for Firestore Security Rules

## 1. Data Invariants

1. **User Ownership (Identity Isolation)**: Users can only read and write their own profile document under `/users/{userId}`. They are locked out of other users' profile documents completely.
2. **Strict Nested Ownership**: Tasks are stored under a user-keyed nested subcollection `/users/{userId}/tasks/{taskId}`. A user can only read, create, update, or delete tasks within their own subcollection directory.
3. **Task Integrity (Validation Guards)**:
   - A Task must match the required schema: `id`, `userId`, `title`, `priority`, `completed`, and `createdAt` are mandatory fields.
   - `priority` must be one of the enum values: `["Low", "Medium", "High"]`.
   - `userId` in the document must match the authenticated user's UID (`request.auth.uid`).
   - `createdAt` is immutable and cannot be modified after initial creation.
4. **ID Poisoning Prevention**: Document paths must use valid IDs constrained in length and allowed characters.

---

## 2. The "Dirty Dozen" Security Violations (Vulnerability Payloads)

We test the security boundaries using the following 12 attack vectors representing identity spoofing, value poisoning, and structure tampering:

1. **V1: Identity Spoofing (Users)**: Attempting to create a user profile document under `/users/attacker-uid` using an authenticated session representing `victim-uid`.
2. **V2: Cross-User Task Creation**: Authenticating as `user-A` but trying to insert a task object in `/users/user-B/tasks/task-1`.
3. **V3: Email Spoofing Hack**: Authenticated with unverified email but pretending to request access blocks where email verification is required.
4. **V4: Value Poisoning (Priority enum violation)**: Attempting to write a task with `priority: "ExtremelyHigh"`.
5. **V5: Value Poisoning (Giant ID)**: Triggering denial-of-wallet or storage attacks by injecting a 10KB string as `taskId`.
6. **V6: Structure Tampering (Missing title)**: Creating a task without the required field `title` to cause UI/UX parsing crashes.
7. **V7: Structure Tampering (Ghost/Shadow Field injection)**: Creating a task with an unmodeled parameter `isAdminCheat: true` to test lack of key boundaries.
8. **V8: Type Poisoning (String instead of Boolean)**: Writing a task with a string `"true"` instead of a proper boolean `true` for `completed` field.
9. **V9: Immortal Field Manipulation**: Updating the immutable field `createdAt` post-creation on an existing task.
10. **V10: Temporal Integrity Violation**: Attempting to set `createdAt` or `updatedAt` to a historical or future client-side date rather than the strict `request.time` (server timestamp) where applicable.
11. **V11: Task Owner Mutability Bypass**: Attempting to rewrite the ownership field `userId` to a target victim's UID.
12. **V12: Unauthenticated Access (Blanket Dump)**: Attempting to read a listing of all users or all tasks as an unauthenticated external crawler.

---

## 3. Test Verification Plan

All of these scenarios are strictly protected by our `firestore.rules` and validation blocks. Any attempt to send such payloads will result in a standard `PERMISSION_DENIED` error.
