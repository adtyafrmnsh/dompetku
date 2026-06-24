# Security Specification for DompetKu (Firebase)

## Data Invariants

1. **User Invarient**: A user profile document is only read/written by its owner where `request.auth.uid == userId`.
2. **Transaction Integrity**: Every financial transaction must be bound to the authentic logged-in user (`userId == request.auth.uid`). No guest or other user can read or modify another user's transactions.
3. **Savings Target Invarient**: A savings target document belongs exclusively to the user (`userId == request.auth.uid`).

---

## The "Dirty Dozen" Attack Payloads

Below are twelve malicious payloads that must return `PERMISSION_DENIED` under the rules:

### Collection: `/users`
1. **Identity Theft (Write as other ID)**:
   - *Attempt*: Create `/users/victim_user_123`
   - *Payload*: `{"id": "victim_user_123", "username": "malicious", "email": "mal@bad.com", "fullName": "Malicious"}`
   - *Result*: Denied because `request.auth.uid` is `attacker_456` but requested path ID is `victim_user_123`.

2. **Email Hijacking / Spoofing**:
   - *Attempt*: Update email of `/users/attacker_456` to target a different unverified email.
   - *Result*: Denied since custom profile editing has bounds and requires specific constraints or matching types.

3. **Ghost Field Poisoning (Shadow Write)**:
   - *Attempt*: Add field `"isAdmin": true` or `"role": "admin"`.
   - *Payload*: `{"id": "attacker_455", "username": "attacker", "email": "att@example.com", "fullName": "Attacker", "role": "admin"}`
   - *Result*: Denied by strict keys count/blueprint check.

### Collection: `/transactions`
4. **Foreign Transaction Creation (Spoofing Host UID)**:
   - *Attempt*: Transaction created under another user's UID.
   - *Payload*: `{"id": "tx1", "userId": "victim_id_12", "amount": 500000, "type": "expense", "category": "Makanan", "date": "2026-06-20"}`
   - *Result*: Denied as `userId` does not match auth UID tracking.

5. **Size Limit Poisoning (Denial of Wallet)**:
   - *Attempt*: Category with a massive payload (e.g. 1MB base64 string).
   - *Result*: Denied because class size check fails for the text inputs.

6. **Invalid Numeric Range (Negative Amount)**:
   - *Attempt*: Expense or Income with negative value to skew cascading math statistics.
   - *Payload*: `{"id": "tx2", "userId": "attacker_456", "amount": -10000, "type": "income", "category": "Gaji", "date": "2026-06-20"}`
   - *Result*: Denied since amount must be `is number` and `amount >= 0`.

7. **Invalid Type Enum Escape**:
   - *Attempt*: Transaction type set to `"borrow"` or some unexpected action.
   - *Result*: Denied by `.type in ['income', 'expense']` validator rules.

8. **Blanket Query / Multi-User Scraping**:
   - *Attempt*: Client queries collection `/transactions` without limiting where clause to owner.
   - *Result*: Denied as listing requires `resource.data.userId == request.auth.uid`.

### Collection: `/targets`
9. **Target Goal Spoofing**:
   - *Attempt*: Mutating `userId` during an progress update.
   - *Result*: Denied because `userId` is immutable.

10. **Shadow Savings Target Entry**:
    - *Attempt*: Injecting shadow keys `"fakeProgress": 999999`.
    - *Result*: Denied by exact size key validation constraints.

11. **Negative Savings Progress**:
    - *Attempt*: Assigning negative value to current progress.
    - *Result*: Denied by `currentProgress >= 0`.

12. **Foreign Target Deletion**:
    - *Attempt*: Deleting target of owner `victim_id_12` by `attacker_456`.
    - *Result*: Denied because owner verification checks fail.
