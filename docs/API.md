# Packerz REST API Design

**Status:** Draft  
**API style:** REST over HTTPS with JSON  
**Public base path:** `/api/v1`  
**Technology:** Next.js App Router, PHP 8.3/GnuBoard5, MySQL, JWT, S3  
**Sources:** [PRD.md](./PRD.md), [DATABASE.md](./DATABASE.md), [IA.md](./IA.md), [USER_FLOW.md](./USER_FLOW.md)

## 1. Scope

This document defines the complete v1 HTTP contract for:

- Authentication
- Users
- Guests
- Cart and checkout
- Quotes
- Boxes and reference catalog
- Dielines and exports
- Orders
- Payments
- Production and QC
- Shipping
- Administration

The MVP sells one custom unprinted box structure for samples, mockups, and low-volume production. The API does not expose sticker or printing options.

The v1 `boxes` resource combines the PRD’s logical box project and its versioned configuration: `designKey` identifies the project, while `boxId` identifies one immutable configuration revision.

## 2. Runtime Responsibilities

### Nginx

- Terminates TLS.
- Routes `/api/v1/*` to the Next.js application.
- Limits request size and request rate.
- Does not make authorization decisions beyond network/security controls.

### Next.js App Router

- Exposes the public `/api/v1` contract through Route Handlers.
- Parses and validates HTTP input.
- Extracts JWT/cookie identity and applies resource authorization.
- Provides browser-oriented aggregation where useful.
- Orchestrates dieline generation, preview, and S3 signed-download responses.
- Does not trust browser totals, prices, payment results, production states, or object keys.

### PHP 8.3 / GnuBoard5 service

- Owns GnuBoard member and staff identity integration.
- Issues/revokes customer and admin JWT sessions.
- Owns authoritative MySQL transactions for users, carts, checkout, orders, payments, production, shipping, coupons, and audit history.
- Exposes a private service API to Next.js using service authentication.
- Is not directly accessible from the public internet.

### MySQL

- Is the system of record described in [DATABASE.md](./DATABASE.md).
- Must not be independently mutated by Next.js and PHP for the same transaction.
- Transaction ownership belongs to the PHP business service; Node-based generators return results that the service validates and records.

## 3. Versioning

- The major API version is in the URI: `/api/v1`.
- Every JSON response includes `"apiVersion": "v1"`.
- Additive fields and new optional query parameters are non-breaking v1 changes.
- Removing/renaming fields, changing field meaning, or narrowing accepted values requires `/api/v2`.
- Deprecated endpoints return:
  - `Deprecation: true`
  - `Sunset: <HTTP date>`
  - `Link: <migration-guide>; rel="deprecation"`
- Clients must ignore unknown response fields.
- Every endpoint in this document is **Version: v1**.

## 4. Authentication and Authorization

### JWT types

| Token | `typ` claim | Audience | Typical lifetime | Use |
|---|---|---|---|---|
| Customer access JWT | `customer_access` | `packerz-api` | 15 minutes | Registered customer APIs |
| Guest access JWT | `guest_access` | `packerz-api` | 24 hours, bounded by guest expiry | Guest box/cart/checkout APIs |
| Order access JWT | `order_access` | `packerz-api` | 30 minutes | One verified guest order |
| Admin access JWT | `admin_access` | `packerz-admin` | 15 minutes | Staff APIs |
| Refresh JWT | `refresh` | `packerz-auth` | 14 days | Rotating session renewal |
| Service JWT | `service` | Private service audience | 5 minutes | Next.js → PHP internal calls |

### Required claims

```json
{
  "iss": "https://packerz.example",
  "aud": "packerz-api",
  "sub": "01JUSERPUBLICID0000000000",
  "typ": "customer_access",
  "scope": ["boxes:write", "cart:write", "orders:read"],
  "jti": "01JTOKENID00000000000000",
  "iat": 1760000000,
  "exp": 1760000900
}
```

### Token transport

- Browser default: `Secure`, `HttpOnly`, `SameSite=Lax` cookies.
- API clients: `Authorization: Bearer <JWT>`.
- Mutation requests using cookies require `Origin` validation and a CSRF token.
- Tokens must never be stored in browser `localStorage`.
- Refresh tokens rotate on every use; reused or revoked tokens invalidate the session family.

### Ownership rules

- “Customer or Guest JWT” means the resource owner must match the JWT subject.
- “Order-scoped JWT” grants access only to the one `orderId` in the token.
- Admin access uses least privilege:
  - `support`: order read and customer-safe notes
  - `operator`: assigned production/QC work
  - `production_manager`: production, QC, and shipment management
  - `admin`: catalog, rules, coupons, staff, audit, refunds, and all operational access

## 5. Request and Response Standards

### Headers

| Header | Requirement |
|---|---|
| `Content-Type: application/json` | Required for JSON request bodies |
| `Accept: application/json` | Recommended |
| `Authorization: Bearer <JWT>` | Required when not using auth cookies |
| `Idempotency-Key` | Required for order, payment, refund, shipment creation, and other specified POST operations |
| `If-Match` | Required for version-sensitive draft/admin PATCH operations |
| `X-CSRF-Token` | Required for cookie-authenticated mutations |
| `X-Request-Id` | Optional client correlation ID; server returns its accepted/generated ID |

### Success envelope

```json
{
  "apiVersion": "v1",
  "data": {
    "id": "01JRESOURCE000000000000000"
  },
  "meta": {
    "requestId": "req_01JREQUEST0000000000000"
  }
}
```

### Error envelope

```json
{
  "apiVersion": "v1",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "fields": [
      {
        "field": "widthMm",
        "code": "OUT_OF_RANGE",
        "message": "Width is outside the supported range."
      }
    ]
  },
  "meta": {
    "requestId": "req_01JREQUEST0000000000000"
  }
}
```

### Types and formats

- IDs are 26-character public ULIDs; internal MySQL IDs are never exposed.
- Time is ISO 8601 UTC, for example `2026-07-24T08:30:00.000Z`.
- Money and dimensions are decimal strings, not JSON floating-point numbers.
- Currency is ISO 4217, initially `KRW`.
- Phone numbers are normalized to E.164.
- Pagination uses `limit` and opaque `cursor`.
- List responses return `meta.nextCursor`; absent/null means the end.
- S3 object keys are never accepted from a public client and are not normally returned.

## 6. Common Error Codes

| Error code | HTTP | Meaning |
|---|---:|---|
| `INVALID_JSON` | 400 | Malformed JSON body |
| `VALIDATION_ERROR` | 422 | Field or business validation failed |
| `UNAUTHENTICATED` | 401 | Missing, invalid, expired, or revoked JWT |
| `TOKEN_REUSE_DETECTED` | 401 | Rotated refresh token was reused |
| `FORBIDDEN` | 403 | Authenticated identity lacks permission |
| `RESOURCE_NOT_FOUND` | 404 | Resource absent or hidden by authorization |
| `METHOD_NOT_ALLOWED` | 405 | Unsupported method |
| `RESOURCE_CONFLICT` | 409 | State conflict or duplicate unique value |
| `VERSION_CONFLICT` | 409 | `If-Match` does not match current revision |
| `IDEMPOTENCY_CONFLICT` | 409 | Key reused with a different request |
| `PRECONDITION_REQUIRED` | 428 | Required `If-Match` or idempotency header missing |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `PAYLOAD_TOO_LARGE` | 413 | Body/file metadata exceeds limit |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `SERVICE_UNAVAILABLE` | 503 | Required downstream service unavailable |

## 7. Authentication Endpoints

### 7.1 `POST /api/v1/auth/register`

- **Purpose:** Create a registered customer and optionally transfer the current guest-owned drafts/cart.
- **Authentication:** Public; optional valid Guest JWT.
- **Request:** Body with `email`, `password`, `name`, optional `phone`, and `acceptTerms`.
- **Validation:** Unique normalized email; password policy; valid phone; current terms accepted; guest transfer must belong to the caller.
- **Response:** New user and access/refresh session. Browser delivery should use HttpOnly cookies.
- **HTTP status:** `201 Created`.
- **Error codes:** `VALIDATION_ERROR`, `EMAIL_ALREADY_EXISTS`, `GUEST_TRANSFER_CONFLICT`, `RATE_LIMITED`.
- **Versioning:** v1; additive profile fields allowed.
- **Example JSON:**

```json
{
  "request": {
    "email": "buyer@example.com",
    "password": "a-long-password",
    "name": "Park Buyer",
    "phone": "+821012345678",
    "acceptTerms": true
  },
  "response": {
    "apiVersion": "v1",
    "data": {
      "user": {"id": "01JUSER00000000000000000", "email": "buyer@example.com", "name": "Park Buyer"},
      "accessToken": "eyJhbGciOiJSUzI1NiIs...",
      "expiresIn": 900
    },
    "meta": {"requestId": "req_register_01"}
  }
}
```

### 7.2 `POST /api/v1/auth/login`

- **Purpose:** Authenticate a registered customer.
- **Authentication:** Public.
- **Request:** `email`, `password`.
- **Validation:** Normalized email, non-empty password, active account, rate/lockout policy.
- **Response:** Customer summary and access/refresh session.
- **HTTP status:** `200 OK`.
- **Error codes:** `INVALID_CREDENTIALS`, `ACCOUNT_SUSPENDED`, `RATE_LIMITED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request": {"email": "buyer@example.com", "password": "a-long-password"},
  "response": {
    "apiVersion": "v1",
    "data": {"user": {"id": "01JUSER00000000000000000", "name": "Park Buyer"}, "accessToken": "eyJ...", "expiresIn": 900},
    "meta": {"requestId": "req_login_01"}
  }
}
```

### 7.3 `POST /api/v1/auth/admin/login`

- **Purpose:** Authenticate a staff user and issue an admin-audience JWT.
- **Authentication:** Public endpoint with strict staff rate limits; IP/MFA controls may be added.
- **Request:** `email`, `password`, optional `mfaCode`.
- **Validation:** Active staff record, credential verification, authorized role, required MFA.
- **Response:** Staff summary, role, access token, expiry.
- **HTTP status:** `200 OK`.
- **Error codes:** `INVALID_CREDENTIALS`, `MFA_REQUIRED`, `MFA_INVALID`, `ACCOUNT_DISABLED`, `RATE_LIMITED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request": {"email": "ops@packerz.example", "password": "staff-secret", "mfaCode": "123456"},
  "response": {
    "apiVersion": "v1",
    "data": {"admin": {"id": "01JADMIN0000000000000000", "name": "Ops Manager", "role": "production_manager"}, "accessToken": "eyJ...", "expiresIn": 900},
    "meta": {"requestId": "req_admin_login_01"}
  }
}
```

### 7.4 `POST /api/v1/auth/refresh`

- **Purpose:** Rotate a customer/admin refresh session and issue a new access token.
- **Authentication:** Valid refresh JWT cookie or body token; no access JWT required.
- **Request:** Empty body for cookie flow, otherwise `refreshToken`.
- **Validation:** Signature, `typ=refresh`, expiry, audience, session family, token hash, and non-reuse.
- **Response:** Rotated access/refresh tokens and expiry.
- **HTTP status:** `200 OK`.
- **Error codes:** `UNAUTHENTICATED`, `TOKEN_REUSE_DETECTED`, `SESSION_REVOKED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request": {},
  "response": {
    "apiVersion": "v1",
    "data": {"accessToken": "eyJ-new...", "expiresIn": 900},
    "meta": {"requestId": "req_refresh_01"}
  }
}
```

### 7.5 `POST /api/v1/auth/logout`

- **Purpose:** Revoke the current refresh session and clear auth cookies.
- **Authentication:** Customer/Admin access JWT or valid refresh session.
- **Request:** Optional `allDevices` boolean.
- **Validation:** `allDevices=true` requires a current authenticated identity.
- **Response:** Revocation confirmation.
- **HTTP status:** `200 OK`.
- **Error codes:** `UNAUTHENTICATED`, `FORBIDDEN`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request": {"allDevices": false},
  "response": {"apiVersion": "v1", "data": {"revoked": true}, "meta": {"requestId": "req_logout_01"}}
}
```

### 7.6 `POST /api/v1/auth/password/forgot`

- **Purpose:** Start password recovery without disclosing whether an account exists.
- **Authentication:** Public.
- **Request:** `email`.
- **Validation:** Valid email format and anti-abuse limits.
- **Response:** Generic accepted response.
- **HTTP status:** `202 Accepted`.
- **Error codes:** `VALIDATION_ERROR`, `RATE_LIMITED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request": {"email": "buyer@example.com"},
  "response": {"apiVersion": "v1", "data": {"accepted": true}, "meta": {"requestId": "req_forgot_01"}}
}
```

### 7.7 `POST /api/v1/auth/password/reset`

- **Purpose:** Reset a customer password using a one-time recovery token.
- **Authentication:** Public with recovery token.
- **Request:** `token`, `newPassword`.
- **Validation:** Valid unused unexpired token; password policy; invalidate existing sessions after success.
- **Response:** Reset confirmation.
- **HTTP status:** `200 OK`.
- **Error codes:** `RESET_TOKEN_INVALID`, `RESET_TOKEN_EXPIRED`, `VALIDATION_ERROR`, `RATE_LIMITED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request": {"token": "one-time-reset-token", "newPassword": "a-new-long-password"},
  "response": {"apiVersion": "v1", "data": {"passwordReset": true}, "meta": {"requestId": "req_reset_01"}}
}
```

### 7.8 `POST /api/v1/auth/email/verify`

- **Purpose:** Verify a registered customer email with a one-time token.
- **Authentication:** Public with verification token; Customer JWT optional.
- **Request:** `token`.
- **Validation:** Token signature/hash, purpose, expiry, non-reuse, and matching active user.
- **Response:** Verification state; existing sessions receive the updated claim after refresh.
- **HTTP status:** `200 OK`.
- **Error codes:** `VERIFICATION_TOKEN_INVALID`, `VERIFICATION_TOKEN_EXPIRED`, `ACCOUNT_SUSPENDED`, `RATE_LIMITED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"request":{"token":"one-time-email-token"},"response":{"apiVersion":"v1","data":{"emailVerified":true,"verifiedAt":"2026-07-24T09:05:00.000Z"},"meta":{"requestId":"req_email_verify_01"}}}
```

### 7.9 `POST /api/v1/auth/email/resend`

- **Purpose:** Send a replacement verification message without exposing account existence.
- **Authentication:** Customer JWT or public email-based request under stricter rate limits.
- **Request:** `email` for public flow; empty body for authenticated flow.
- **Validation:** Valid email, unverified eligible account, cooldown, anti-abuse policy.
- **Response:** Generic accepted response.
- **HTTP status:** `202 Accepted`.
- **Error codes:** `VALIDATION_ERROR`, `VERIFICATION_COOLDOWN`, `RATE_LIMITED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"request":{"email":"buyer@example.com"},"response":{"apiVersion":"v1","data":{"accepted":true},"meta":{"requestId":"req_email_resend_01"}}}
```

## 8. User Endpoints

### 8.1 `GET /api/v1/users/me`

- **Purpose:** Get the current registered customer profile.
- **Authentication:** Customer JWT.
- **Request:** No body.
- **Validation:** Active customer session.
- **Response:** Customer-safe profile and verification states.
- **HTTP status:** `200 OK`.
- **Error codes:** `UNAUTHENTICATED`, `ACCOUNT_SUSPENDED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":{"id":"01JUSER00000000000000000","email":"buyer@example.com","phone":"+821012345678","name":"Park Buyer","emailVerified":true},"meta":{"requestId":"req_user_me_01"}}
```

### 8.2 `PATCH /api/v1/users/me`

- **Purpose:** Update mutable customer profile fields.
- **Authentication:** Customer JWT.
- **Request:** Any of `name`, `phone`; email changes require a separate verification flow.
- **Validation:** At least one supported field; valid name/phone; `If-Match` profile ETag.
- **Response:** Updated profile and new ETag.
- **HTTP status:** `200 OK`.
- **Error codes:** `VALIDATION_ERROR`, `VERSION_CONFLICT`, `PRECONDITION_REQUIRED`, `UNAUTHENTICATED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request": {"name": "Park M. Buyer", "phone": "+821087654321"},
  "response": {"apiVersion":"v1","data":{"id":"01JUSER00000000000000000","name":"Park M. Buyer","phone":"+821087654321","version":3},"meta":{"requestId":"req_user_patch_01"}}
}
```

### 8.3 `GET /api/v1/users/me/boxes`

- **Purpose:** List box designs owned by the current customer.
- **Authentication:** Customer JWT.
- **Request:** Query: `status`, `limit` (1–100), `cursor`.
- **Validation:** Valid status and opaque cursor.
- **Response:** Latest revision summaries, paginated.
- **HTTP status:** `200 OK`.
- **Error codes:** `VALIDATION_ERROR`, `CURSOR_INVALID`, `UNAUTHENTICATED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":[{"id":"01JBOX000000000000000000","designKey":"01JDESIGN000000000000000","revision":2,"name":"Sample Box","status":"validated"}],"meta":{"requestId":"req_user_boxes_01","nextCursor":null}}
```

### 8.4 `GET /api/v1/users/me/orders`

- **Purpose:** List orders owned by the current registered customer.
- **Authentication:** Customer JWT.
- **Request:** Query: `status`, `from`, `to`, `limit`, `cursor`.
- **Validation:** Valid statuses/date range; max 100 results.
- **Response:** Paginated order summaries.
- **HTTP status:** `200 OK`.
- **Error codes:** `VALIDATION_ERROR`, `CURSOR_INVALID`, `UNAUTHENTICATED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":[{"id":"01JORDER0000000000000000","orderNumber":"PKZ-20260724-0001","status":"in_production","totalAmount":"88000.00","currency":"KRW","createdAt":"2026-07-24T08:30:00.000Z"}],"meta":{"requestId":"req_user_orders_01","nextCursor":null}}
```

### 8.5 `POST /api/v1/users/me/deletion-request`

- **Purpose:** Request account closure/anonymization while preserving legally required commercial history.
- **Authentication:** Customer JWT with recent authentication.
- **Request:** `reason` optional, `confirm: true`.
- **Validation:** Confirmation required; active payment/production obligations may delay completion.
- **Response:** Request state and effective handling notice.
- **HTTP status:** `202 Accepted`.
- **Error codes:** `VALIDATION_ERROR`, `RECENT_AUTH_REQUIRED`, `RESOURCE_CONFLICT`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request":{"confirm":true,"reason":"No longer needed"},
  "response":{"apiVersion":"v1","data":{"status":"scheduled","requestedAt":"2026-07-24T09:00:00.000Z"},"meta":{"requestId":"req_user_delete_01"}}
}
```

## 9. Guest Endpoints

### 9.1 `POST /api/v1/guests/sessions`

- **Purpose:** Create a guest identity/session for design, cart, and checkout.
- **Authentication:** Public.
- **Request:** Optional `locale`; no customer PII required.
- **Validation:** Supported locale; anti-abuse limits.
- **Response:** Guest ID, Guest JWT, and expiry; browser uses HttpOnly cookie.
- **HTTP status:** `201 Created`.
- **Error codes:** `VALIDATION_ERROR`, `RATE_LIMITED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request":{"locale":"ko-KR"},
  "response":{"apiVersion":"v1","data":{"guestId":"01JGUEST0000000000000000","accessToken":"eyJ...","expiresAt":"2026-07-25T09:00:00.000Z"},"meta":{"requestId":"req_guest_create_01"}}
}
```

### 9.2 `GET /api/v1/guests/session`

- **Purpose:** Get the current guest session state.
- **Authentication:** Guest JWT.
- **Request:** No body.
- **Validation:** Active, unexpired, non-converted guest.
- **Response:** Guest identity, expiry, cart summary.
- **HTTP status:** `200 OK`.
- **Error codes:** `UNAUTHENTICATED`, `GUEST_SESSION_EXPIRED`, `GUEST_ALREADY_CONVERTED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":{"guestId":"01JGUEST0000000000000000","expiresAt":"2026-07-25T09:00:00.000Z","cart":{"itemCount":1}},"meta":{"requestId":"req_guest_get_01"}}
```

### 9.3 `POST /api/v1/guests/session/refresh`

- **Purpose:** Extend an active guest session within the maximum retention window.
- **Authentication:** Guest JWT.
- **Request:** Empty body.
- **Validation:** Session active; maximum extension not exceeded; rate limit.
- **Response:** Rotated Guest JWT and new expiry.
- **HTTP status:** `200 OK`.
- **Error codes:** `UNAUTHENTICATED`, `GUEST_SESSION_EXPIRED`, `SESSION_EXTENSION_LIMIT`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"request":{},"response":{"apiVersion":"v1","data":{"accessToken":"eyJ-guest-new...","expiresAt":"2026-07-26T09:00:00.000Z"},"meta":{"requestId":"req_guest_refresh_01"}}}
```

### 9.4 `POST /api/v1/guests/session/convert`

- **Purpose:** Convert the current guest identity to a new or existing registered user and transfer eligible designs/cart.
- **Authentication:** Guest JWT; existing-account conversion also requires customer credentials.
- **Request:** `mode: "register" | "link"` plus registration or login fields.
- **Validation:** Guest active; target user authorized; resources not already transferred; email/password rules.
- **Response:** Customer session and transfer counts.
- **HTTP status:** `200 OK`.
- **Error codes:** `VALIDATION_ERROR`, `INVALID_CREDENTIALS`, `GUEST_ALREADY_CONVERTED`, `GUEST_TRANSFER_CONFLICT`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request":{"mode":"link","email":"buyer@example.com","password":"a-long-password"},
  "response":{"apiVersion":"v1","data":{"userId":"01JUSER00000000000000000","transferred":{"boxes":2,"carts":1},"accessToken":"eyJ..."},"meta":{"requestId":"req_guest_convert_01"}}
}
```

### 9.5 `DELETE /api/v1/guests/session`

- **Purpose:** End the browser guest session without deleting retained designs, carts, or business history.
- **Authentication:** Guest JWT.
- **Request:** No body.
- **Validation:** Active guest session; active checkout/payment may require explicit abandonment confirmation before logout.
- **Response:** No body and cleared guest cookie.
- **HTTP status:** `204 No Content`.
- **Error codes:** `UNAUTHENTICATED`, `ACTIVE_CHECKOUT_EXISTS`, `PAYMENT_ALREADY_PENDING`.
- **Versioning:** v1; DELETE ends the session, not the guest database record.
- **Example JSON:**

```json
{"request":{},"response":null}
```

## 10. Catalog and Box Endpoints

### 10.1 `GET /api/v1/catalog/box-templates`

- **Purpose:** List active customer-visible box templates; MVP returns one template.
- **Authentication:** Public.
- **Request:** Optional `active=true`.
- **Validation:** Only customer-visible fields and active versions are returned.
- **Response:** Template code, name, version, description, and supported purpose.
- **HTTP status:** `200 OK`.
- **Error codes:** `VALIDATION_ERROR`, `SERVICE_UNAVAILABLE`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":[{"id":"01JTEMPLATE00000000000000","code":"CUSTOM_BOX","version":1,"name":"Custom Box","purposes":["sample","mockup","low_volume"]}],"meta":{"requestId":"req_templates_01"}}
```

### 10.2 `GET /api/v1/catalog/board-types`

- **Purpose:** List active board constructions.
- **Authentication:** Public.
- **Request:** No body; optional pagination reserved for future use.
- **Validation:** Active records only.
- **Response:** Customer-safe board type list.
- **HTTP status:** `200 OK`.
- **Error codes:** `SERVICE_UNAVAILABLE`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":[{"id":"01JBOARD0000000000000000","code":"PAPERBOARD","name":"Paperboard","description":"Board for structural sample boxes."}],"meta":{"requestId":"req_boards_01"}}
```

### 10.3 `GET /api/v1/catalog/materials`

- **Purpose:** List active materials available for the selected template/board type.
- **Authentication:** Public.
- **Request:** Query: optional `boxTemplateId`, `boardTypeId`.
- **Validation:** Referenced catalog IDs must exist and be active.
- **Response:** Material code, thickness, board type, and customer description.
- **HTTP status:** `200 OK`.
- **Error codes:** `VALIDATION_ERROR`, `RESOURCE_NOT_FOUND`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":[{"id":"01JMATERIAL00000000000000","code":"SC350","name":"SC 350","thicknessMm":"0.450","boardType":{"code":"PAPERBOARD","name":"Paperboard"}}],"meta":{"requestId":"req_materials_01"}}
```

### 10.4 `GET /api/v1/catalog/glue-types`

- **Purpose:** Return the supported glue method; the MVP response is read-only and contains one default.
- **Authentication:** Public.
- **Request:** Optional `boxTemplateId`.
- **Validation:** Active template if supplied.
- **Response:** Customer-safe glue method with `customerSelectable: false`.
- **HTTP status:** `200 OK`.
- **Error codes:** `VALIDATION_ERROR`, `RESOURCE_NOT_FOUND`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":[{"id":"01JGLUE00000000000000000","code":"DEFAULT_GLUE","name":"Standard Glue","customerSelectable":false,"isDefault":true}],"meta":{"requestId":"req_glues_01"}}
```

### 10.5 `GET /api/v1/catalog/box-constraints`

- **Purpose:** Return customer-visible dimension, quantity, material, and template constraints.
- **Authentication:** Public.
- **Request:** Query: `boxTemplateId`, optional `materialId`.
- **Validation:** Active catalog IDs.
- **Response:** Rule version, ranges, units, and fixed production options.
- **HTTP status:** `200 OK`.
- **Error codes:** `VALIDATION_ERROR`, `RESOURCE_NOT_FOUND`, `RULESET_UNAVAILABLE`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":{"ruleVersion":"mfg-2026-07-01","dimensions":{"unit":"mm","width":{"min":"30.000","max":"400.000"},"depth":{"min":"20.000","max":"300.000"},"height":{"min":"10.000","max":"300.000"}},"quantity":{"min":1,"max":500}},"meta":{"requestId":"req_constraints_01"}}
```

### 10.6 `POST /api/v1/boxes`

- **Purpose:** Create revision 1 of a customer or guest box design.
- **Authentication:** Customer or Guest JWT.
- **Request:** Template, purpose, dimension basis/values, material, quantity, and optional name.
- **Validation:** Active template/material; fixed glue derived server-side; positive dimensions/quantity; no print fields accepted.
- **Response:** Draft box revision and ETag/version.
- **HTTP status:** `201 Created`.
- **Error codes:** `VALIDATION_ERROR`, `CATALOG_ITEM_INACTIVE`, `UNSUPPORTED_OPTION`, `UNAUTHENTICATED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request":{"name":"Product Sample Box","purpose":"sample","boxTemplateId":"01JTEMPLATE00000000000000","dimensionBasis":"internal","widthMm":"120.000","depthMm":"80.000","heightMm":"40.000","materialId":"01JMATERIAL00000000000000","quantity":10},
  "response":{"apiVersion":"v1","data":{"id":"01JBOX000000000000000000","designKey":"01JDESIGN000000000000000","revision":1,"status":"draft","glueType":{"code":"DEFAULT_GLUE","customerSelectable":false},"version":1},"meta":{"requestId":"req_box_create_01"}}
}
```

### 10.7 `GET /api/v1/boxes/{boxId}`

- **Purpose:** Get one box revision and its validation/dieline summary.
- **Authentication:** Owning Customer or Guest JWT; authorized Admin JWT.
- **Request:** Path `boxId`; no body.
- **Validation:** ULID format and resource ownership.
- **Response:** Full customer-safe box revision.
- **HTTP status:** `200 OK`.
- **Error codes:** `UNAUTHENTICATED`, `RESOURCE_NOT_FOUND`, `FORBIDDEN`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":{"id":"01JBOX000000000000000000","designKey":"01JDESIGN000000000000000","revision":1,"purpose":"sample","dimensions":{"basis":"internal","widthMm":"120.000","depthMm":"80.000","heightMm":"40.000"},"quantity":10,"validation":{"status":"pending"},"version":1},"meta":{"requestId":"req_box_get_01"}}
```

### 10.8 `PATCH /api/v1/boxes/{boxId}`

- **Purpose:** Update an unlocked draft revision without changing its identity.
- **Authentication:** Owning Customer or Guest JWT.
- **Request:** Mutable draft fields; `If-Match` required.
- **Validation:** Draft/unlocked only; active catalog; positive dimensions/quantity; fixed glue cannot be changed.
- **Response:** Updated draft with incremented version.
- **HTTP status:** `200 OK`.
- **Error codes:** `BOX_LOCKED`, `VERSION_CONFLICT`, `PRECONDITION_REQUIRED`, `VALIDATION_ERROR`, `RESOURCE_NOT_FOUND`.
- **Versioning:** v1; locked revisions use the revision endpoint instead.
- **Example JSON:**

```json
{
  "request":{"widthMm":"125.000","quantity":20},
  "response":{"apiVersion":"v1","data":{"id":"01JBOX000000000000000000","revision":1,"status":"draft","validation":{"status":"pending"},"version":2},"meta":{"requestId":"req_box_patch_01"}}
}
```

### 10.9 `POST /api/v1/boxes/{boxId}/revisions`

- **Purpose:** Create a new immutable design revision from an existing box.
- **Authentication:** Owning Customer or Guest JWT.
- **Request:** Changed configuration fields and optional `reason`.
- **Validation:** Source belongs to caller; changed fields valid; revision number allocated transactionally.
- **Response:** New draft revision linked by `supersedesBoxId`.
- **HTTP status:** `201 Created`.
- **Error codes:** `VALIDATION_ERROR`, `RESOURCE_NOT_FOUND`, `REVISION_CONFLICT`, `CATALOG_ITEM_INACTIVE`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request":{"widthMm":"130.000","quantity":25,"reason":"Product size changed"},
  "response":{"apiVersion":"v1","data":{"id":"01JBOXREV2000000000000000","designKey":"01JDESIGN000000000000000","revision":2,"supersedesBoxId":"01JBOX000000000000000000","status":"draft"},"meta":{"requestId":"req_box_revision_01"}}
}
```

### 10.10 `POST /api/v1/boxes/{boxId}/validate`

- **Purpose:** Validate an exact box revision against active manufacturing rules.
- **Authentication:** Owning Customer or Guest JWT; authorized Admin JWT.
- **Request:** Empty body; optional `force=false` for authorized staff.
- **Validation:** Complete configuration; active template/material/glue; revision not corrupted; force not allowed for customers.
- **Response:** Valid/invalid status, rule version, blocking issues, warnings, calculated dimensions.
- **HTTP status:** `200 OK` for valid or invalid business result; `422` for malformed/incomplete input.
- **Error codes:** `VALIDATION_ERROR`, `CATALOG_ITEM_INACTIVE`, `RULESET_UNAVAILABLE`, `RESOURCE_NOT_FOUND`.
- **Versioning:** v1; new issue types are additive.
- **Example JSON:**

```json
{
  "request":{},
  "response":{"apiVersion":"v1","data":{"boxId":"01JBOX000000000000000000","status":"valid","ruleVersion":"mfg-2026-07-01","issues":[],"warnings":[],"calculatedDimensions":{"externalWidthMm":"120.900","externalDepthMm":"80.900","externalHeightMm":"40.900"},"validatedAt":"2026-07-24T09:10:00.000Z"},"meta":{"requestId":"req_box_validate_01"}}
}
```

### 10.11 `POST /api/v1/boxes/{boxId}/recommendations`

- **Purpose:** Generate limited AI-assisted material/dimension explanations without silently changing the box.
- **Authentication:** Owning Customer or Guest JWT.
- **Request:** Optional `productDescription`, `productWeightGrams`, and `concerns`.
- **Validation:** Text/weight limits; content safety; box ownership; recommendation cannot introduce unsupported options.
- **Response:** Recommendations with rationale and explicit suggested patch.
- **HTTP status:** `200 OK` or `202 Accepted` if processed asynchronously.
- **Error codes:** `VALIDATION_ERROR`, `AI_SERVICE_UNAVAILABLE`, `RATE_LIMITED`, `RESOURCE_NOT_FOUND`.
- **Versioning:** v1; recommendation fields are advisory.
- **Example JSON:**

```json
{
  "request":{"productDescription":"Small ceramic sample","productWeightGrams":250,"concerns":["fragility"]},
  "response":{"apiVersion":"v1","data":{"recommendations":[{"type":"material","suggestedMaterialId":"01JMATERIAL00000000000000","reason":"This active material is suitable for the stated sample use."}],"applied":false},"meta":{"requestId":"req_box_recommend_01"}}
}
```

### 10.12 `DELETE /api/v1/boxes/{boxId}`

- **Purpose:** Archive a customer draft/design without physically deleting revision history.
- **Authentication:** Owning Customer or Guest JWT.
- **Request:** Path `boxId`; no body.
- **Validation:** Cannot archive a revision referenced by an active cart, checkout, or order unless another usable revision remains and policy permits.
- **Response:** No body.
- **HTTP status:** `204 No Content`.
- **Error codes:** `RESOURCE_NOT_FOUND`, `BOX_IN_USE`, `FORBIDDEN`, `UNAUTHENTICATED`.
- **Versioning:** v1; DELETE means archive, not database deletion.
- **Example JSON:**

```json
{"request":{},"response":null}
```

## 11. Quote Endpoints

### 11.1 `POST /api/v1/boxes/{boxId}/quotes`

- **Purpose:** Create a server-calculated expiring price and lead-time quote.
- **Authentication:** Owning Customer or Guest JWT.
- **Request:** `quantity`; optional `dielineId`; `Idempotency-Key` recommended.
- **Validation:** Box must be valid; quantity supported; dieline, when supplied, belongs to the same box; active pricing rules.
- **Response:** Quote totals, rule version, lead time, and expiry.
- **HTTP status:** `201 Created`.
- **Error codes:** `BOX_NOT_VALIDATED`, `QUOTE_UNAVAILABLE`, `DIELINE_BOX_MISMATCH`, `VALIDATION_ERROR`, `IDEMPOTENCY_CONFLICT`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request":{"quantity":10,"dielineId":"01JDIELINE00000000000000"},
  "response":{"apiVersion":"v1","data":{"id":"01JQUOTE0000000000000000","boxId":"01JBOX000000000000000000","quantity":10,"currency":"KRW","unitPrice":"8000.00","subtotal":"80000.00","taxEstimate":"8000.00","shippingEstimate":"0.00","totalEstimate":"88000.00","leadTimeDays":5,"expiresAt":"2026-07-25T09:15:00.000Z"},"meta":{"requestId":"req_quote_create_01"}}
}
```

### 11.2 `GET /api/v1/quotes/{quoteId}`

- **Purpose:** Get the current quote and expiry state.
- **Authentication:** Owning Customer or Guest JWT; authorized Admin JWT.
- **Request:** Path `quoteId`.
- **Validation:** ULID and ownership through the source box.
- **Response:** Quote calculation summary and `active`, `expired`, `superseded`, or `consumed` status.
- **HTTP status:** `200 OK`.
- **Error codes:** `RESOURCE_NOT_FOUND`, `FORBIDDEN`, `UNAUTHENTICATED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":{"id":"01JQUOTE0000000000000000","status":"active","quantity":10,"currency":"KRW","totalEstimate":"88000.00","pricingRuleVersion":"price-2026-07-01","expiresAt":"2026-07-25T09:15:00.000Z"},"meta":{"requestId":"req_quote_get_01"}}
```

### 11.3 `POST /api/v1/quotes/{quoteId}/refresh`

- **Purpose:** Recalculate an expired/superseded quote and create a new quote.
- **Authentication:** Owning Customer or Guest JWT.
- **Request:** Optional `quantity`; `Idempotency-Key` recommended.
- **Validation:** Source box still valid and active; quantity supported; latest pricing rules available.
- **Response:** New quote plus `replacesQuoteId`.
- **HTTP status:** `201 Created`.
- **Error codes:** `BOX_NOT_VALIDATED`, `QUOTE_UNAVAILABLE`, `VALIDATION_ERROR`, `IDEMPOTENCY_CONFLICT`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request":{"quantity":10},
  "response":{"apiVersion":"v1","data":{"id":"01JQUOTENEW00000000000000","replacesQuoteId":"01JQUOTE0000000000000000","status":"active","totalEstimate":"90000.00","currency":"KRW","expiresAt":"2026-07-26T09:15:00.000Z"},"meta":{"requestId":"req_quote_refresh_01"}}
}
```

## 12. Dieline Endpoints

### 12.1 `POST /api/v1/boxes/{boxId}/dielines`

- **Purpose:** Generate an idempotent dieline revision for a validated box.
- **Authentication:** Owning Customer or Guest JWT; authorized Admin JWT.
- **Request:** Optional `expectedGeneratorVersion`; `Idempotency-Key` required.
- **Validation:** Valid box; supported template/generator; matching generator version; no unsupported print/artwork data.
- **Response:** Dieline resource; `202` while generating or `201` if synchronously complete.
- **HTTP status:** `201 Created` or `202 Accepted`.
- **Error codes:** `BOX_NOT_VALIDATED`, `GENERATOR_UNAVAILABLE`, `GENERATOR_VERSION_MISMATCH`, `IDEMPOTENCY_CONFLICT`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request":{"expectedGeneratorVersion":"1.0.0"},
  "response":{"apiVersion":"v1","data":{"id":"01JDIELINE00000000000000","boxId":"01JBOX000000000000000000","revision":1,"status":"generating","statusUrl":"/api/v1/dielines/01JDIELINE00000000000000"},"meta":{"requestId":"req_dieline_create_01"}}
}
```

### 12.2 `GET /api/v1/dielines/{dielineId}`

- **Purpose:** Get generation, approval, geometry, and export availability.
- **Authentication:** Owning Customer or Guest JWT; Order-scoped JWT when ordered; authorized Admin JWT.
- **Request:** Path `dielineId`.
- **Validation:** Resource access through owner/order/job.
- **Response:** Dieline metadata without private S3 keys.
- **HTTP status:** `200 OK`.
- **Error codes:** `RESOURCE_NOT_FOUND`, `FORBIDDEN`, `UNAUTHENTICATED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":{"id":"01JDIELINE00000000000000","boxId":"01JBOX000000000000000000","revision":1,"status":"generated","generatorVersion":"1.0.0","sheet":{"widthMm":"460.000","heightMm":"250.000"},"exports":{"svg":true,"pdf":true},"customerApprovedAt":null},"meta":{"requestId":"req_dieline_get_01"}}
```

### 12.3 `GET /api/v1/dielines/{dielineId}/preview`

- **Purpose:** Return a short-lived authorized preview URL and metadata.
- **Authentication:** Same access as the dieline.
- **Request:** Optional `expiresIn` between 60 and 600 seconds.
- **Validation:** Dieline generated; preview available; authorized expiry.
- **Response:** Signed HTTPS URL and expiry.
- **HTTP status:** `200 OK`.
- **Error codes:** `DIELINE_NOT_READY`, `PREVIEW_UNAVAILABLE`, `RESOURCE_NOT_FOUND`, `FORBIDDEN`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":{"dielineId":"01JDIELINE00000000000000","url":"https://cdn.example/signed-preview","expiresAt":"2026-07-24T09:25:00.000Z"},"meta":{"requestId":"req_dieline_preview_01"}}
```

### 12.4 `GET /api/v1/dielines/{dielineId}/exports/{format}`

- **Purpose:** Return a short-lived authorized SVG or PDF download URL.
- **Authentication:** Same access as the dieline.
- **Request:** Path `format` is `svg` or `pdf`; optional `disposition=attachment`.
- **Validation:** Generated file exists; checksum recorded; caller authorized.
- **Response:** Signed URL, format, checksum, filename, and expiry.
- **HTTP status:** `200 OK`.
- **Error codes:** `FORMAT_UNSUPPORTED`, `DIELINE_NOT_READY`, `EXPORT_UNAVAILABLE`, `FORBIDDEN`.
- **Versioning:** v1; new formats require additive enum support.
- **Example JSON:**

```json
{"apiVersion":"v1","data":{"dielineId":"01JDIELINE00000000000000","format":"pdf","filename":"packerz-dieline-r1.pdf","sha256":"52f2...9a1c","url":"https://cdn.example/signed-pdf","expiresAt":"2026-07-24T09:25:00.000Z"},"meta":{"requestId":"req_dieline_export_01"}}
```

### 12.5 `POST /api/v1/dielines/{dielineId}/approve`

- **Purpose:** Record explicit customer approval of the exact dieline revision.
- **Authentication:** Owning Customer or Guest JWT.
- **Request:** `confirm: true`, `geometryHash`, optional `acknowledgements`.
- **Validation:** Dieline generated; hash matches; source box remains valid; approval not superseded.
- **Response:** Approval timestamp and immutable revision identifiers.
- **HTTP status:** `200 OK`.
- **Error codes:** `VALIDATION_ERROR`, `DIELINE_NOT_READY`, `GEOMETRY_HASH_MISMATCH`, `DIELINE_SUPERSEDED`, `RESOURCE_NOT_FOUND`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request":{"confirm":true,"geometryHash":"52f2...9a1c","acknowledgements":["dimensions_reviewed"]},
  "response":{"apiVersion":"v1","data":{"id":"01JDIELINE00000000000000","status":"approved","customerApprovedAt":"2026-07-24T09:20:00.000Z"},"meta":{"requestId":"req_dieline_approve_01"}}
}
```

## 13. Cart and Checkout Endpoints

### 13.1 `GET /api/v1/cart`

- **Purpose:** Get the caller’s active standard cart and calculated summary.
- **Authentication:** Customer or Guest JWT.
- **Request:** No body.
- **Validation:** Resolve exactly one active `source=cart` cart for the JWT owner.
- **Response:** Cart, active items, quote validity, coupon, and totals; empty cart is a successful response.
- **HTTP status:** `200 OK`.
- **Error codes:** `UNAUTHENTICATED`, `CART_STATE_INVALID`, `SERVICE_UNAVAILABLE`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":{"id":"01JCART00000000000000000","status":"active","currency":"KRW","items":[{"id":"01JCARTITEM0000000000000","boxId":"01JBOX000000000000000000","dielineId":"01JDIELINE00000000000000","quantity":10,"unitPrice":"8000.00","lineTotal":"80000.00","quoteStatus":"active"}],"coupon":null,"totals":{"subtotal":"80000.00","discount":"0.00","tax":"8000.00","shipping":"0.00","total":"88000.00"}},"meta":{"requestId":"req_cart_get_01"}}
```

### 13.2 `POST /api/v1/cart/items`

- **Purpose:** Add an exact approved box, dieline, and active quote to the active cart.
- **Authentication:** Customer or Guest JWT.
- **Request:** `boxId`, `dielineId`, `quoteId`, `quantity`; `Idempotency-Key` recommended.
- **Validation:** Same owner; box valid; dieline belongs to box and is approved; quote belongs to box/dieline, matches quantity, and is unexpired.
- **Response:** Created/merged cart item and recalculated totals.
- **HTTP status:** `201 Created` or `200 OK` when an identical line is merged.
- **Error codes:** `BOX_NOT_VALIDATED`, `DIELINE_NOT_APPROVED`, `DIELINE_BOX_MISMATCH`, `QUOTE_EXPIRED`, `QUOTE_QUANTITY_MISMATCH`, `IDEMPOTENCY_CONFLICT`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request":{"boxId":"01JBOX000000000000000000","dielineId":"01JDIELINE00000000000000","quoteId":"01JQUOTE0000000000000000","quantity":10},
  "response":{"apiVersion":"v1","data":{"item":{"id":"01JCARTITEM0000000000000","quantity":10,"lineTotal":"80000.00"},"cart":{"id":"01JCART00000000000000000","totalAmount":"88000.00","itemCount":1}},"meta":{"requestId":"req_cart_add_01"}}
}
```

### 13.3 `PATCH /api/v1/cart/items/{itemId}`

- **Purpose:** Change item quantity or replace the line with a newly approved box/dieline/quote revision.
- **Authentication:** Owning Customer or Guest JWT.
- **Request:** `quantity` plus matching `quoteId`, or replacement `boxId`, `dielineId`, `quoteId`; `If-Match` required.
- **Validation:** Active cart/item; exact quote match; valid/approved resources; positive quantity; current cart version.
- **Response:** Updated item, cart totals, and cart version.
- **HTTP status:** `200 OK`.
- **Error codes:** `VALIDATION_ERROR`, `VERSION_CONFLICT`, `PRECONDITION_REQUIRED`, `QUOTE_EXPIRED`, `RESOURCE_NOT_FOUND`, `CART_NOT_ACTIVE`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request":{"quantity":20,"quoteId":"01JQUOTEQTY20000000000000"},
  "response":{"apiVersion":"v1","data":{"item":{"id":"01JCARTITEM0000000000000","quantity":20,"lineTotal":"145000.00"},"cart":{"totalAmount":"159500.00","version":4}},"meta":{"requestId":"req_cart_item_patch_01"}}
}
```

### 13.4 `DELETE /api/v1/cart/items/{itemId}`

- **Purpose:** Soft-remove an item from the active cart and recalculate totals.
- **Authentication:** Owning Customer or Guest JWT.
- **Request:** Path `itemId`; `If-Match` required.
- **Validation:** Active cart; active item; current version.
- **Response:** Updated cart summary.
- **HTTP status:** `200 OK`.
- **Error codes:** `RESOURCE_NOT_FOUND`, `CART_NOT_ACTIVE`, `VERSION_CONFLICT`, `PRECONDITION_REQUIRED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"request":{},"response":{"apiVersion":"v1","data":{"cartId":"01JCART00000000000000000","itemCount":0,"totalAmount":"0.00","version":5},"meta":{"requestId":"req_cart_item_delete_01"}}}
```

### 13.5 `POST /api/v1/cart/coupon`

- **Purpose:** Apply one coupon to the active cart.
- **Authentication:** Customer or Guest JWT.
- **Request:** `code`.
- **Validation:** Coupon enabled/active/in date; cart minimum; item eligibility; global/owner usage limits; one coupon per cart.
- **Response:** Coupon application and recalculated totals.
- **HTTP status:** `200 OK`.
- **Error codes:** `COUPON_NOT_FOUND`, `COUPON_INACTIVE`, `COUPON_NOT_STARTED`, `COUPON_EXPIRED`, `COUPON_NOT_ELIGIBLE`, `COUPON_USAGE_LIMIT`, `CART_EMPTY`.
- **Versioning:** v1; endpoint can return `FEATURE_DISABLED` while coupons are not launched.
- **Example JSON:**

```json
{
  "request":{"code":"SAMPLE10"},
  "response":{"apiVersion":"v1","data":{"coupon":{"code":"SAMPLE10","discountType":"percentage","discountAmount":"8000.00"},"totals":{"subtotal":"80000.00","discount":"8000.00","tax":"7200.00","shipping":"0.00","total":"79200.00"}},"meta":{"requestId":"req_cart_coupon_01"}}
}
```

### 13.6 `DELETE /api/v1/cart/coupon`

- **Purpose:** Remove the active cart coupon.
- **Authentication:** Customer or Guest JWT.
- **Request:** No body; `If-Match` recommended.
- **Validation:** Active cart and applied coupon.
- **Response:** Recalculated cart totals.
- **HTTP status:** `200 OK`.
- **Error codes:** `CART_NOT_ACTIVE`, `COUPON_NOT_APPLIED`, `VERSION_CONFLICT`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"request":{},"response":{"apiVersion":"v1","data":{"coupon":null,"totals":{"subtotal":"80000.00","discount":"0.00","tax":"8000.00","shipping":"0.00","total":"88000.00"}},"meta":{"requestId":"req_cart_coupon_delete_01"}}}
```

### 13.7 `POST /api/v1/cart/reprice`

- **Purpose:** Revalidate every active item and replace expired quotes with current quotes.
- **Authentication:** Customer or Guest JWT.
- **Request:** `acceptChangedTotals` boolean; `Idempotency-Key` recommended.
- **Validation:** Cart active; all boxes/dielines still valid; coupon revalidated; changed totals require explicit acceptance before checkout.
- **Response:** Per-item quote result and new totals.
- **HTTP status:** `200 OK`; `409` when customer acceptance is required.
- **Error codes:** `CART_EMPTY`, `BOX_NOT_VALIDATED`, `DIELINE_SUPERSEDED`, `REPRICE_ACCEPTANCE_REQUIRED`, `QUOTE_UNAVAILABLE`, `COUPON_NOT_ELIGIBLE`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request":{"acceptChangedTotals":true},
  "response":{"apiVersion":"v1","data":{"items":[{"itemId":"01JCARTITEM0000000000000","oldQuoteId":"01JQUOTEOLD00000000000000","newQuoteId":"01JQUOTENEW00000000000000","changed":true}],"totals":{"total":"90000.00"},"accepted":true},"meta":{"requestId":"req_cart_reprice_01"}}
}
```

### 13.8 `POST /api/v1/checkout-sessions`

- **Purpose:** Start checkout from the active cart or from one Buy Now item.
- **Authentication:** Customer or Guest JWT.
- **Request:** `source: "cart" | "buy_now"`; for Buy Now include exact `boxId`, `dielineId`, `quoteId`, `quantity`; `Idempotency-Key` required.
- **Validation:** All items valid/approved; quotes active; caller owns resources; cart not empty; Buy Now does not mutate the standard cart.
- **Response:** Checkout session, item summaries, expiry, and validated totals.
- **HTTP status:** `201 Created`.
- **Error codes:** `CART_EMPTY`, `QUOTE_EXPIRED`, `DIELINE_NOT_APPROVED`, `CHECKOUT_ITEM_INVALID`, `IDEMPOTENCY_CONFLICT`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request":{"source":"cart"},
  "response":{"apiVersion":"v1","data":{"id":"01JCHECKOUT00000000000000","source":"cart","status":"started","itemCount":1,"currency":"KRW","totalAmount":"88000.00","expiresAt":"2026-07-24T10:30:00.000Z"},"meta":{"requestId":"req_checkout_create_01"}}
}
```

### 13.9 `GET /api/v1/checkout-sessions/{checkoutId}`

- **Purpose:** Get recoverable checkout state, items, quote validity, and customer/delivery data.
- **Authentication:** Owning Customer or Guest JWT.
- **Request:** Path `checkoutId`.
- **Validation:** Ownership and non-purged checkout.
- **Response:** Checkout summary; expired status is returned as data.
- **HTTP status:** `200 OK`.
- **Error codes:** `RESOURCE_NOT_FOUND`, `FORBIDDEN`, `UNAUTHENTICATED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":{"id":"01JCHECKOUT00000000000000","status":"started","customer":null,"shipping":null,"items":[{"boxId":"01JBOX000000000000000000","quantity":10}],"totalAmount":"88000.00","expiresAt":"2026-07-24T10:30:00.000Z"},"meta":{"requestId":"req_checkout_get_01"}}
```

### 13.10 `PATCH /api/v1/checkout-sessions/{checkoutId}`

- **Purpose:** Save customer, recipient, delivery, consent, and delivery-note data.
- **Authentication:** Owning Customer or Guest JWT.
- **Request:** `customer`, `shipping`, `consents`; `If-Match` required.
- **Validation:** Valid email/phone/postal/address; required legal versions accepted; checkout active; current ETag.
- **Response:** Updated checkout, completeness, and version.
- **HTTP status:** `200 OK`.
- **Error codes:** `VALIDATION_ERROR`, `CHECKOUT_EXPIRED`, `CHECKOUT_NOT_EDITABLE`, `VERSION_CONFLICT`, `PRECONDITION_REQUIRED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request":{"customer":{"name":"Park Buyer","email":"buyer@example.com","phone":"+821012345678"},"shipping":{"recipientName":"Park Buyer","recipientPhone":"+821012345678","postalCode":"06236","addressLine1":"123 Teheran-ro, Seoul","addressLine2":"Suite 10","deliveryNote":"Call on arrival"},"consents":[{"type":"terms","version":"2026-07-01","accepted":true},{"type":"privacy","version":"2026-07-01","accepted":true}]},
  "response":{"apiVersion":"v1","data":{"id":"01JCHECKOUT00000000000000","status":"ready","complete":true,"version":2,"totalAmount":"88000.00"},"meta":{"requestId":"req_checkout_patch_01"}}
}
```

### 13.11 `POST /api/v1/checkout-sessions/{checkoutId}/orders`

- **Purpose:** Create one pending order with immutable item/customer/address/pricing snapshots.
- **Authentication:** Owning Customer or Guest JWT.
- **Request:** `confirm: true`; `Idempotency-Key` required.
- **Validation:** Checkout complete/unexpired; all resource/quote/coupon validations repeated under transaction; totals match current server calculation.
- **Response:** Pending order and payment action URL.
- **HTTP status:** `201 Created`; repeat with same key returns `200 OK` and the same order.
- **Error codes:** `CHECKOUT_INCOMPLETE`, `CHECKOUT_EXPIRED`, `REPRICE_REQUIRED`, `COUPON_NOT_ELIGIBLE`, `IDEMPOTENCY_CONFLICT`, `ORDER_ALREADY_CREATED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request":{"confirm":true},
  "response":{"apiVersion":"v1","data":{"id":"01JORDER0000000000000000","orderNumber":"PKZ-20260724-0001","status":"payment_pending","paymentStatus":"unpaid","currency":"KRW","totalAmount":"88000.00","paymentUrl":"/api/v1/orders/01JORDER0000000000000000/payments"},"meta":{"requestId":"req_order_create_01"}}
}
```

## 14. Order Endpoints

### 14.1 `POST /api/v1/orders/lookup`

- **Purpose:** Verify a guest customer and issue a short-lived JWT scoped to one order.
- **Authentication:** Public; strongly rate-limited.
- **Request:** `orderNumber`, `email` or `phone`, plus optional one-time verification `code`.
- **Validation:** Exact normalized match; anti-enumeration response; OTP when policy requires.
- **Response:** Generic verification state or order-scoped JWT and order summary.
- **HTTP status:** `200 OK` when verified; `202 Accepted` when a code was sent.
- **Error codes:** `ORDER_LOOKUP_FAILED`, `VERIFICATION_REQUIRED`, `VERIFICATION_CODE_INVALID`, `RATE_LIMITED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request":{"orderNumber":"PKZ-20260724-0001","email":"buyer@example.com","code":"481201"},
  "response":{"apiVersion":"v1","data":{"verified":true,"orderId":"01JORDER0000000000000000","accessToken":"eyJ-order-scoped...","expiresIn":1800},"meta":{"requestId":"req_order_lookup_01"}}
}
```

### 14.2 `GET /api/v1/orders/{orderId}`

- **Purpose:** Get customer-safe order, items, payment summary, and aggregate fulfillment state.
- **Authentication:** Owning Customer JWT, matching Guest JWT before expiry, Order-scoped JWT, or authorized Admin JWT.
- **Request:** Path `orderId`.
- **Validation:** Resource authorization.
- **Response:** Order snapshot; admin callers use admin order endpoint for internal detail.
- **HTTP status:** `200 OK`.
- **Error codes:** `UNAUTHENTICATED`, `RESOURCE_NOT_FOUND`, `FORBIDDEN`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":{"id":"01JORDER0000000000000000","orderNumber":"PKZ-20260724-0001","status":"awaiting_review","paymentStatus":"paid","productionStatus":"awaiting_review","shippingStatus":"not_ready","currency":"KRW","totalAmount":"88000.00","items":[{"id":"01JORDERITEM000000000000","productName":"Custom Box","dimensions":{"basis":"internal","widthMm":"120.000","depthMm":"80.000","heightMm":"40.000"},"quantity":10}]},"meta":{"requestId":"req_order_get_01"}}
```

### 14.3 `GET /api/v1/orders/{orderId}/status`

- **Purpose:** Get the customer-safe production and shipment timeline.
- **Authentication:** Same customer/order access as Order Detail.
- **Request:** Optional `after` opaque event cursor.
- **Validation:** Order access and cursor.
- **Response:** Aggregate state and customer-visible events only.
- **HTTP status:** `200 OK`.
- **Error codes:** `RESOURCE_NOT_FOUND`, `FORBIDDEN`, `CURSOR_INVALID`.
- **Versioning:** v1; new customer-visible event types are additive.
- **Example JSON:**

```json
{"apiVersion":"v1","data":{"orderId":"01JORDER0000000000000000","currentStatus":"in_production","events":[{"type":"payment_confirmed","message":"Payment was confirmed.","at":"2026-07-24T09:40:00.000Z"},{"type":"in_production","message":"Your boxes are being produced.","at":"2026-07-25T02:00:00.000Z"}]},"meta":{"requestId":"req_order_status_01","nextCursor":null}}
```

### 14.4 `GET /api/v1/orders/{orderId}/documents`

- **Purpose:** List approved order documents and authorized download endpoints.
- **Authentication:** Same customer/order access as Order Detail.
- **Request:** No body.
- **Validation:** Documents must belong to an order item and approved dieline snapshot.
- **Response:** Document metadata and API export links, not raw S3 keys.
- **HTTP status:** `200 OK`.
- **Error codes:** `RESOURCE_NOT_FOUND`, `FORBIDDEN`, `DOCUMENT_UNAVAILABLE`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":[{"type":"dieline_svg","dielineId":"01JDIELINE00000000000000","revision":1,"download":"/api/v1/dielines/01JDIELINE00000000000000/exports/svg"},{"type":"dieline_pdf","dielineId":"01JDIELINE00000000000000","revision":1,"download":"/api/v1/dielines/01JDIELINE00000000000000/exports/pdf"}],"meta":{"requestId":"req_order_docs_01"}}
```

### 14.5 `POST /api/v1/orders/{orderId}/cancel`

- **Purpose:** Request or execute customer cancellation when the order state permits.
- **Authentication:** Owning Customer JWT, matching Guest/Order-scoped JWT.
- **Request:** `reason`; `confirm: true`; `Idempotency-Key` required.
- **Validation:** Order owner; cancellable state; no conflicting production/shipping transition; refund policy evaluated server-side.
- **Response:** Cancellation request/result and refund requirement.
- **HTTP status:** `200 OK` when cancelled; `202 Accepted` when staff/refund review is required.
- **Error codes:** `ORDER_NOT_CANCELLABLE`, `PRODUCTION_ALREADY_STARTED`, `SHIPMENT_ALREADY_CREATED`, `IDEMPOTENCY_CONFLICT`, `RESOURCE_NOT_FOUND`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request":{"reason":"Ordered by mistake","confirm":true},
  "response":{"apiVersion":"v1","data":{"orderId":"01JORDER0000000000000000","status":"refund_pending","cancellationAccepted":true,"refundRequired":true},"meta":{"requestId":"req_order_cancel_01"}}
}
```

## 15. Payment Endpoints

### 15.1 `POST /api/v1/orders/{orderId}/payments`

- **Purpose:** Create a provider payment attempt for the exact pending-order amount.
- **Authentication:** Owning Customer or Guest JWT.
- **Request:** `method`, `returnUrl`; `Idempotency-Key` required.
- **Validation:** Order unpaid/payment-pending; method supported; return URL allowlisted; amount/currency read from order; no active conflicting attempt.
- **Response:** Payment ID, provider checkout data/redirect URL, expiry.
- **HTTP status:** `201 Created`.
- **Error codes:** `ORDER_NOT_PAYABLE`, `PAYMENT_METHOD_UNSUPPORTED`, `PAYMENT_ALREADY_PENDING`, `IDEMPOTENCY_CONFLICT`, `PAYMENT_PROVIDER_UNAVAILABLE`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request":{"method":"card","returnUrl":"https://packerz.example/checkout/result"},
  "response":{"apiVersion":"v1","data":{"id":"01JPAYMENT00000000000000","orderId":"01JORDER0000000000000000","status":"ready","currency":"KRW","amount":"88000.00","provider":"example_pg","redirectUrl":"https://pay.example/checkout/token","expiresAt":"2026-07-24T10:00:00.000Z"},"meta":{"requestId":"req_payment_create_01"}}
}
```

### 15.2 `GET /api/v1/payments/{paymentId}`

- **Purpose:** Get customer-safe payment attempt status.
- **Authentication:** Order owner through Customer/Guest/Order-scoped JWT; authorized Admin JWT.
- **Request:** Path `paymentId`.
- **Validation:** Payment’s order is accessible.
- **Response:** Status, amount, method, provider reference when safe, and timestamps.
- **HTTP status:** `200 OK`.
- **Error codes:** `RESOURCE_NOT_FOUND`, `FORBIDDEN`, `UNAUTHENTICATED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":{"id":"01JPAYMENT00000000000000","orderId":"01JORDER0000000000000000","status":"pending","method":"card","currency":"KRW","requestedAmount":"88000.00","confirmedAmount":null},"meta":{"requestId":"req_payment_get_01"}}
```

### 15.3 `POST /api/v1/payments/{paymentId}/confirm`

- **Purpose:** Verify the provider result server-side and finalize payment exactly once.
- **Authentication:** Order owner JWT; confirmation still requires server-to-provider verification.
- **Request:** Provider-issued `paymentKey`/confirmation token and `orderId`; `Idempotency-Key` required.
- **Validation:** Payment/order match; signature/token valid; expected currency/amount; payable state; no prior conflicting capture.
- **Response:** Verified payment and order state; production creation is triggered idempotently.
- **HTTP status:** `200 OK`.
- **Error codes:** `PAYMENT_VERIFICATION_FAILED`, `PAYMENT_AMOUNT_MISMATCH`, `PAYMENT_ORDER_MISMATCH`, `PAYMENT_ALREADY_CONFIRMED`, `IDEMPOTENCY_CONFLICT`, `PAYMENT_PROVIDER_UNAVAILABLE`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request":{"orderId":"01JORDER0000000000000000","paymentKey":"provider-confirmation-key"},
  "response":{"apiVersion":"v1","data":{"payment":{"id":"01JPAYMENT00000000000000","status":"paid","confirmedAmount":"88000.00","confirmedAt":"2026-07-24T09:40:00.000Z"},"order":{"id":"01JORDER0000000000000000","status":"awaiting_review","paymentStatus":"paid"}},"meta":{"requestId":"req_payment_confirm_01"}}
}
```

### 15.4 `POST /api/v1/payments/{paymentId}/cancel`

- **Purpose:** Cancel an unconfirmed payment attempt and return checkout to a recoverable state.
- **Authentication:** Order owner JWT.
- **Request:** Optional `reason`; `Idempotency-Key` required.
- **Validation:** Payment is `ready` or cancellable `pending`; no confirmed capture.
- **Response:** Cancelled payment state.
- **HTTP status:** `200 OK`.
- **Error codes:** `PAYMENT_NOT_CANCELLABLE`, `PAYMENT_ALREADY_CONFIRMED`, `IDEMPOTENCY_CONFLICT`, `RESOURCE_NOT_FOUND`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"request":{"reason":"Customer returned to checkout"},"response":{"apiVersion":"v1","data":{"id":"01JPAYMENT00000000000000","status":"cancelled","orderId":"01JORDER0000000000000000"},"meta":{"requestId":"req_payment_cancel_01"}}}
```

### 15.5 `POST /api/v1/payments/webhooks/{provider}`

- **Purpose:** Receive, verify, deduplicate, and process provider payment events.
- **Authentication:** Provider signature and network/rate controls; no customer JWT.
- **Request:** Provider-specific signed JSON plus signature headers.
- **Validation:** Supported provider; signature; event ID; payload schema; payment/order/currency/amount; idempotent event key.
- **Response:** Acknowledgement only; duplicate valid events also return success.
- **HTTP status:** `200 OK`/`204 No Content`; `400` malformed; `401` invalid signature.
- **Error codes:** `PROVIDER_UNSUPPORTED`, `WEBHOOK_SIGNATURE_INVALID`, `WEBHOOK_PAYLOAD_INVALID`; internal retryable failures should return `500`.
- **Versioning:** Public route is v1; provider payload version is recorded and adapted internally.
- **Example JSON:**

```json
{
  "request":{"eventId":"evt_123","type":"payment.paid","data":{"paymentKey":"pay_123","orderId":"01JORDER0000000000000000","amount":"88000.00","currency":"KRW"}},
  "response":{"apiVersion":"v1","data":{"accepted":true,"duplicate":false},"meta":{"requestId":"req_webhook_pay_01"}}
}
```

### 15.6 `POST /api/v1/admin/payments/{paymentId}/refunds`

- **Purpose:** Create a full or partial refund with an auditable staff reason.
- **Authentication:** Admin JWT with `admin` role and recent authentication.
- **Request:** `amount`, `reasonCode`, `reason`; `Idempotency-Key` required.
- **Validation:** Paid/refundable payment; amount ≤ remaining captured amount; order/production policy; provider support; staff permission.
- **Response:** Refund state and updated payment/order totals/status.
- **HTTP status:** `201 Created` or `202 Accepted` for asynchronous provider processing.
- **Error codes:** `FORBIDDEN`, `RECENT_AUTH_REQUIRED`, `REFUND_AMOUNT_INVALID`, `PAYMENT_NOT_REFUNDABLE`, `PRODUCTION_REFUND_CONFLICT`, `IDEMPOTENCY_CONFLICT`, `PAYMENT_PROVIDER_UNAVAILABLE`.
- **Versioning:** v1.
- **Example JSON:**

```json
{
  "request":{"amount":"88000.00","reasonCode":"ORDER_CANCELLED","reason":"Cancelled before production"},
  "response":{"apiVersion":"v1","data":{"paymentId":"01JPAYMENT00000000000000","refundId":"ref_01JREFUND000000000000","status":"pending","amount":"88000.00","orderStatus":"refund_pending"},"meta":{"requestId":"req_refund_01"}}
}
```

## 16. Production and QC Endpoints

### 16.1 `GET /api/v1/admin/production-jobs`

- **Purpose:** List and filter production jobs for the operational queue.
- **Authentication:** Admin JWT with `operator`, `production_manager`, or `admin`; operators may be limited to assigned jobs.
- **Request:** Query: `status`, `assigneeId`, `priority`, `materialCode`, `scheduledFrom`, `scheduledTo`, `limit`, `cursor`.
- **Validation:** Valid filters, authorized assignee scope, limit 1–100.
- **Response:** Paginated production-job summaries.
- **HTTP status:** `200 OK`.
- **Error codes:** `UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION_ERROR`, `CURSOR_INVALID`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":[{"id":"01JJOB000000000000000000","jobNumber":"JOB-20260724-0001","status":"production_queued","priority":2,"plannedQuantity":10,"materialCode":"SC350","scheduledStartAt":"2026-07-25T01:00:00.000Z","assignee":{"id":"01JADMIN0000000000000000","name":"Operator Kim"}}],"meta":{"requestId":"req_jobs_01","nextCursor":null}}
```

### 16.2 `GET /api/v1/admin/production/schedule`

- **Purpose:** Get scheduled and unscheduled production jobs for a date range.
- **Authentication:** Admin JWT with `production_manager` or `admin`; operator read may be limited.
- **Request:** Query: required `from`, `to`; optional `assigneeId`, `status`.
- **Validation:** UTC range ≤ 93 days; valid assignee/status; authorized scope.
- **Response:** Schedule lanes and unscheduled jobs.
- **HTTP status:** `200 OK`.
- **Error codes:** `VALIDATION_ERROR`, `FORBIDDEN`, `DATE_RANGE_TOO_LARGE`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":{"range":{"from":"2026-07-25T00:00:00.000Z","to":"2026-07-26T00:00:00.000Z"},"scheduled":[{"jobId":"01JJOB000000000000000000","start":"2026-07-25T01:00:00.000Z","end":"2026-07-25T04:00:00.000Z","assigneeId":"01JADMIN0000000000000000"}],"unscheduled":[]},"meta":{"requestId":"req_schedule_01"}}
```

### 16.3 `GET /api/v1/admin/production-jobs/{jobId}`

- **Purpose:** Get the full immutable work specification, assignment, dieline, QC, and history.
- **Authentication:** Authorized Admin JWT; operator must be assigned or granted queue access.
- **Request:** Path `jobId`.
- **Validation:** Job exists and role/assignment permits access.
- **Response:** Internal production detail with customer data minimized.
- **HTTP status:** `200 OK`.
- **Error codes:** `RESOURCE_NOT_FOUND`, `FORBIDDEN`, `UNAUTHENTICATED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":{"id":"01JJOB000000000000000000","jobNumber":"JOB-20260724-0001","status":"production_queued","orderItem":{"id":"01JORDERITEM000000000000","orderNumber":"PKZ-20260724-0001","quantity":10},"specification":{"templateCode":"CUSTOM_BOX","dimensions":{"widthMm":"120.000","depthMm":"80.000","heightMm":"40.000"},"materialCode":"SC350","glueCode":"DEFAULT_GLUE","hash":"ab12...ff90"},"dieline":{"id":"01JDIELINE00000000000000","revision":1},"version":3},"meta":{"requestId":"req_job_get_01"}}
```

### 16.4 `PATCH /api/v1/admin/production-jobs/{jobId}/assignment`

- **Purpose:** Assign an operator and schedule the job.
- **Authentication:** Admin JWT with `production_manager` or `admin`.
- **Request:** `assigneeId`, optional `scheduledStartAt`, `scheduledEndAt`; `If-Match` required.
- **Validation:** Active staff with valid role; schedule order; allowed job state; version match; optional capacity conflict warning.
- **Response:** Updated assignment/schedule and version.
- **HTTP status:** `200 OK`.
- **Error codes:** `FORBIDDEN`, `ASSIGNEE_INVALID`, `JOB_STATE_CONFLICT`, `SCHEDULE_CONFLICT`, `VERSION_CONFLICT`, `PRECONDITION_REQUIRED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"request":{"assigneeId":"01JADMIN0000000000000000","scheduledStartAt":"2026-07-25T01:00:00.000Z","scheduledEndAt":"2026-07-25T04:00:00.000Z"},"response":{"apiVersion":"v1","data":{"jobId":"01JJOB000000000000000000","assigneeId":"01JADMIN0000000000000000","version":4},"meta":{"requestId":"req_job_assign_01"}}}
```

### 16.5 `PATCH /api/v1/admin/production-jobs/{jobId}/status`

- **Purpose:** Perform one allowed, audited production state transition.
- **Authentication:** Authorized Admin JWT; transition permissions depend on role.
- **Request:** `toStatus`, optional quantities, `reasonCode`, `internalNote`, `customerVisibleMessage`; `If-Match` required.
- **Validation:** State-machine transition; role; required reason for hold/cancel; quantity bounds; QC required before Ready to Ship.
- **Response:** New job status, aggregate order status, and version.
- **HTTP status:** `200 OK`.
- **Error codes:** `INVALID_STATUS_TRANSITION`, `QC_REQUIRED`, `REASON_REQUIRED`, `QUANTITY_INVALID`, `FORBIDDEN`, `VERSION_CONFLICT`.
- **Versioning:** v1; new states require documented additive transition support.
- **Example JSON:**

```json
{"request":{"toStatus":"in_production","internalNote":"Material loaded"},"response":{"apiVersion":"v1","data":{"jobId":"01JJOB000000000000000000","fromStatus":"production_queued","toStatus":"in_production","orderProductionStatus":"in_production","version":5},"meta":{"requestId":"req_job_status_01"}}}
```

### 16.6 `POST /api/v1/admin/production-jobs/{jobId}/notes`

- **Purpose:** Append a staff-only or approved customer-visible production note.
- **Authentication:** Admin JWT with production/support access.
- **Request:** `internalNote`; optional `customerVisibleMessage`; `Idempotency-Key` recommended.
- **Validation:** At least one note; length limits; customer text permission and content policy.
- **Response:** Append-only production event.
- **HTTP status:** `201 Created`.
- **Error codes:** `VALIDATION_ERROR`, `FORBIDDEN`, `RESOURCE_NOT_FOUND`, `IDEMPOTENCY_CONFLICT`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"request":{"internalNote":"Confirm material lot before cutting","customerVisibleMessage":null},"response":{"apiVersion":"v1","data":{"eventId":"01JJOBEVENT0000000000000","type":"note","createdAt":"2026-07-24T11:00:00.000Z"},"meta":{"requestId":"req_job_note_01"}}}
```

### 16.7 `GET /api/v1/admin/production-jobs/{jobId}/events`

- **Purpose:** Get complete internal production history.
- **Authentication:** Authorized Admin JWT.
- **Request:** Query: `limit`, `cursor`.
- **Validation:** Job access and cursor.
- **Response:** Paginated status, assignment, hold, release, and note events.
- **HTTP status:** `200 OK`.
- **Error codes:** `RESOURCE_NOT_FOUND`, `FORBIDDEN`, `CURSOR_INVALID`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":[{"id":"01JJOBEVENT0000000000000","type":"status_change","fromStatus":"production_queued","toStatus":"in_production","actor":{"id":"01JADMIN0000000000000000","name":"Operator Kim"},"createdAt":"2026-07-24T11:00:00.000Z"}],"meta":{"requestId":"req_job_events_01","nextCursor":null}}
```

### 16.8 `POST /api/v1/admin/production-jobs/{jobId}/quality-checks`

- **Purpose:** Record one complete QC attempt and transition the job according to the result.
- **Authentication:** Admin JWT with `operator`, `production_manager`, or `admin`; inspector permission required.
- **Request:** `result`, sampled/passed/rejected quantities, checklist items, optional notes; `Idempotency-Key` required.
- **Validation:** Job in QC-compatible state; quantities consistent; every required checklist item present; fail/rework reason supplied.
- **Response:** QC record and resulting job status.
- **HTTP status:** `201 Created`.
- **Error codes:** `JOB_NOT_READY_FOR_QC`, `CHECKLIST_INCOMPLETE`, `QUANTITY_INVALID`, `QC_RESULT_CONFLICT`, `IDEMPOTENCY_CONFLICT`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"request":{"result":"pass","sampleQuantity":3,"passedQuantity":3,"rejectedQuantity":0,"items":[{"code":"DIMENSIONS","actualValue":"within tolerance","result":"pass"},{"code":"GLUE_SEAM","actualValue":"secure","result":"pass"}]},"response":{"apiVersion":"v1","data":{"id":"01JQC000000000000000000","checkNo":1,"result":"pass","jobStatus":"ready_to_ship","performedAt":"2026-07-25T05:00:00.000Z"},"meta":{"requestId":"req_qc_create_01"}}}
```

### 16.9 `GET /api/v1/admin/production-jobs/{jobId}/quality-checks`

- **Purpose:** List QC attempts and checklist results for a production job.
- **Authentication:** Authorized Admin JWT.
- **Request:** Optional `result`, `limit`, `cursor`.
- **Validation:** Job access, valid result, cursor.
- **Response:** Paginated QC records.
- **HTTP status:** `200 OK`.
- **Error codes:** `RESOURCE_NOT_FOUND`, `FORBIDDEN`, `CURSOR_INVALID`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":[{"id":"01JQC000000000000000000","checkNo":1,"result":"pass","sampleQuantity":3,"items":[{"code":"DIMENSIONS","result":"pass"},{"code":"GLUE_SEAM","result":"pass"}],"performedAt":"2026-07-25T05:00:00.000Z"}],"meta":{"requestId":"req_qc_list_01","nextCursor":null}}
```

## 17. Shipping Endpoints

### 17.1 `POST /api/v1/admin/orders/{orderId}/shipments`

- **Purpose:** Create a shipment and allocate QC-passed order-item quantities.
- **Authentication:** Admin JWT with `production_manager` or `admin`.
- **Request:** Carrier/service/tracking, recipient snapshot, item allocations; `Idempotency-Key` required.
- **Validation:** Order ready; allocations belong to order; quantities produced, QC-passed, and unshipped; tracking unique; address complete.
- **Response:** Shipment resource and updated order shipping state.
- **HTTP status:** `201 Created`.
- **Error codes:** `ORDER_NOT_READY_TO_SHIP`, `SHIPMENT_QUANTITY_INVALID`, `TRACKING_NUMBER_CONFLICT`, `ADDRESS_INVALID`, `IDEMPOTENCY_CONFLICT`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"request":{"carrierCode":"CJ","serviceCode":"PARCEL","trackingNumber":"1234567890","items":[{"orderItemId":"01JORDERITEM000000000000","quantity":10}]},"response":{"apiVersion":"v1","data":{"id":"01JSHIPMENT0000000000000","shipmentNumber":"SHP-20260725-0001","status":"ready","trackingNumber":"1234567890","orderShippingStatus":"ready"},"meta":{"requestId":"req_ship_create_01"}}}
```

### 17.2 `GET /api/v1/admin/shipments/{shipmentId}`

- **Purpose:** Get internal shipment, address, allocations, and carrier state.
- **Authentication:** Admin JWT with operations/production access.
- **Request:** Path `shipmentId`.
- **Validation:** Staff permission.
- **Response:** Full shipment detail.
- **HTTP status:** `200 OK`.
- **Error codes:** `RESOURCE_NOT_FOUND`, `FORBIDDEN`, `UNAUTHENTICATED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":{"id":"01JSHIPMENT0000000000000","shipmentNumber":"SHP-20260725-0001","orderId":"01JORDER0000000000000000","carrierCode":"CJ","trackingNumber":"1234567890","status":"ready","items":[{"orderItemId":"01JORDERITEM000000000000","quantity":10}],"version":1},"meta":{"requestId":"req_ship_get_01"}}
```

### 17.3 `PATCH /api/v1/admin/shipments/{shipmentId}`

- **Purpose:** Correct an unshipped shipment’s carrier, tracking, address, or allocations.
- **Authentication:** Admin JWT with `production_manager` or `admin`.
- **Request:** Mutable pre-shipment fields; `If-Match` required.
- **Validation:** Shipment not handed to carrier; tracking unique; allocations/address valid; reason required for address change.
- **Response:** Updated shipment/version with audit entry.
- **HTTP status:** `200 OK`.
- **Error codes:** `SHIPMENT_NOT_EDITABLE`, `TRACKING_NUMBER_CONFLICT`, `SHIPMENT_QUANTITY_INVALID`, `VERSION_CONFLICT`, `PRECONDITION_REQUIRED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"request":{"trackingNumber":"1234567891","changeReason":"Carrier corrected label"},"response":{"apiVersion":"v1","data":{"id":"01JSHIPMENT0000000000000","trackingNumber":"1234567891","version":2},"meta":{"requestId":"req_ship_patch_01"}}}
```

### 17.4 `POST /api/v1/admin/shipments/{shipmentId}/status`

- **Purpose:** Apply a manual/confirmed shipment state transition.
- **Authentication:** Admin JWT with `production_manager` or `admin`.
- **Request:** `toStatus`, optional timestamp/reason; `Idempotency-Key` required.
- **Validation:** Allowed transition; shipped status requires carrier/tracking and allocations; exception/return requires reason.
- **Response:** Shipment and aggregate order status.
- **HTTP status:** `200 OK`.
- **Error codes:** `INVALID_STATUS_TRANSITION`, `SHIPMENT_INCOMPLETE`, `REASON_REQUIRED`, `IDEMPOTENCY_CONFLICT`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"request":{"toStatus":"shipped","occurredAt":"2026-07-25T07:00:00.000Z"},"response":{"apiVersion":"v1","data":{"shipmentId":"01JSHIPMENT0000000000000","status":"shipped","orderShippingStatus":"shipped"},"meta":{"requestId":"req_ship_status_01"}}}
```

### 17.5 `GET /api/v1/orders/{orderId}/shipments`

- **Purpose:** Return customer-safe shipment and tracking information.
- **Authentication:** Owning Customer/Guest/Order-scoped JWT.
- **Request:** Path `orderId`.
- **Validation:** Order access.
- **Response:** Shipment number, carrier, tracking, public status, and times; no full internal address.
- **HTTP status:** `200 OK`.
- **Error codes:** `RESOURCE_NOT_FOUND`, `FORBIDDEN`, `UNAUTHENTICATED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":[{"id":"01JSHIPMENT0000000000000","shipmentNumber":"SHP-20260725-0001","carrier":{"code":"CJ","name":"CJ Logistics"},"trackingNumber":"1234567891","status":"shipped","shippedAt":"2026-07-25T07:00:00.000Z","trackingUrl":"https://carrier.example/track/1234567891"}],"meta":{"requestId":"req_order_shipments_01"}}
```

### 17.6 `POST /api/v1/shipping/webhooks/{carrier}`

- **Purpose:** Receive signed carrier tracking events and update shipment/order state idempotently.
- **Authentication:** Carrier signature/secret, optional IP allowlist; no JWT.
- **Request:** Carrier event ID/type/tracking payload.
- **Validation:** Supported carrier; signature; unique event ID; known tracking number; valid transition.
- **Response:** Acknowledgement.
- **HTTP status:** `200 OK`/`204 No Content`; `401` invalid signature.
- **Error codes:** `CARRIER_UNSUPPORTED`, `WEBHOOK_SIGNATURE_INVALID`, `WEBHOOK_PAYLOAD_INVALID`, `SHIPMENT_NOT_FOUND`.
- **Versioning:** Public route is v1; provider schema version is adapted internally.
- **Example JSON:**

```json
{"request":{"eventId":"carrier_evt_01","trackingNumber":"1234567891","status":"delivered","occurredAt":"2026-07-26T03:00:00.000Z"},"response":{"apiVersion":"v1","data":{"accepted":true,"duplicate":false},"meta":{"requestId":"req_ship_webhook_01"}}}
```

### 17.7 `GET /api/v1/admin/shipments`

- **Purpose:** List and filter shipments for fulfillment operations.
- **Authentication:** Admin JWT with support, production-manager, or admin shipment-read permission.
- **Request:** Query: `status`, `carrierCode`, `orderNumber`, `shippedFrom`, `shippedTo`, `limit`, `cursor`.
- **Validation:** Valid filters/date range; role-based field minimization; limit 1–100.
- **Response:** Paginated shipment summaries.
- **HTTP status:** `200 OK`.
- **Error codes:** `FORBIDDEN`, `VALIDATION_ERROR`, `CURSOR_INVALID`, `DATE_RANGE_TOO_LARGE`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":[{"id":"01JSHIPMENT0000000000000","shipmentNumber":"SHP-20260725-0001","orderNumber":"PKZ-20260724-0001","carrierCode":"CJ","trackingNumber":"1234567891","status":"shipped","shippedAt":"2026-07-25T07:00:00.000Z"}],"meta":{"requestId":"req_admin_shipments_01","nextCursor":null}}
```

## 18. Administration Endpoints

### 18.1 `GET /api/v1/admin/dashboard`

- **Purpose:** Return operational counts and exception summaries.
- **Authentication:** Admin JWT; role controls visible metrics.
- **Request:** Optional `from`, `to`, `timezone`.
- **Validation:** Date range ≤ 93 days; supported timezone.
- **Response:** Paid/hold/production/QC/shipping counters and recent alerts.
- **HTTP status:** `200 OK`.
- **Error codes:** `FORBIDDEN`, `VALIDATION_ERROR`, `DATE_RANGE_TOO_LARGE`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":{"newPaidOrders":4,"awaitingReview":3,"onHold":1,"inProduction":7,"qcFailures":1,"readyToShip":2},"meta":{"requestId":"req_admin_dashboard_01"}}
```

### 18.2 `GET /api/v1/admin/orders`

- **Purpose:** Search/filter all commercial orders.
- **Authentication:** Admin JWT with support/production/admin order-read permission.
- **Request:** Query: `q`, order/payment/production/shipping statuses, date range, `limit`, `cursor`.
- **Validation:** Query length; valid enums/date range; role data minimization.
- **Response:** Paginated internal order summaries.
- **HTTP status:** `200 OK`.
- **Error codes:** `FORBIDDEN`, `VALIDATION_ERROR`, `CURSOR_INVALID`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":[{"id":"01JORDER0000000000000000","orderNumber":"PKZ-20260724-0001","customerName":"Park Buyer","paymentStatus":"paid","productionStatus":"in_production","shippingStatus":"not_ready","totalAmount":"88000.00"}],"meta":{"requestId":"req_admin_orders_01","nextCursor":null}}
```

### 18.3 `GET /api/v1/admin/orders/{orderId}`

- **Purpose:** Get full operational order detail, payment, snapshots, jobs, shipments, and internal audit references.
- **Authentication:** Authorized Admin JWT.
- **Request:** Path `orderId`.
- **Validation:** Role authorization; sensitive fields minimized for support/operator roles.
- **Response:** Internal order aggregate.
- **HTTP status:** `200 OK`.
- **Error codes:** `RESOURCE_NOT_FOUND`, `FORBIDDEN`, `UNAUTHENTICATED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":{"id":"01JORDER0000000000000000","orderNumber":"PKZ-20260724-0001","status":"in_production","customer":{"name":"Park Buyer","email":"buyer@example.com"},"payment":{"status":"paid","confirmedAmount":"88000.00"},"items":[{"id":"01JORDERITEM000000000000","quantity":10,"productionJobs":["01JJOB000000000000000000"]}],"shipments":[]},"meta":{"requestId":"req_admin_order_get_01"}}
```

### 18.4 `GET /api/v1/admin/catalog/{resource}`

- **Purpose:** List admin catalog records where `resource` is `board-types`, `materials`, `glue-types`, or `box-templates`.
- **Authentication:** Admin JWT with `admin`; production managers may receive read-only access.
- **Request:** Query: `status`, `q`, `limit`, `cursor`.
- **Validation:** Allowed resource value and filters.
- **Response:** Resource-specific records with internal configuration fields.
- **HTTP status:** `200 OK`.
- **Error codes:** `RESOURCE_TYPE_INVALID`, `FORBIDDEN`, `VALIDATION_ERROR`, `CURSOR_INVALID`.
- **Versioning:** v1; each resource has a documented schema discriminator.
- **Example JSON:**

```json
{"apiVersion":"v1","data":[{"type":"material","id":"01JMATERIAL00000000000000","code":"SC350","name":"SC 350","boardTypeId":"01JBOARD0000000000000000","thicknessMm":"0.450","isActive":true}],"meta":{"requestId":"req_admin_catalog_01","nextCursor":null}}
```

### 18.5 `POST /api/v1/admin/catalog/{resource}`

- **Purpose:** Create a board type, material, glue type, or immutable box-template version.
- **Authentication:** Admin JWT with `admin` and recent authentication.
- **Request:** Resource-specific body; `Idempotency-Key` required.
- **Validation:** Unique code/version; valid foreign keys; numeric constraints; one fixed/default glue policy; template schema/generator compatibility.
- **Response:** Created catalog record.
- **HTTP status:** `201 Created`.
- **Error codes:** `RESOURCE_TYPE_INVALID`, `VALIDATION_ERROR`, `CODE_ALREADY_EXISTS`, `CATALOG_REFERENCE_INVALID`, `GENERATOR_VERSION_MISMATCH`, `IDEMPOTENCY_CONFLICT`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"request":{"code":"SC350","name":"SC 350","boardTypeId":"01JBOARD0000000000000000","thicknessMm":"0.450","isActive":true},"response":{"apiVersion":"v1","data":{"type":"material","id":"01JMATERIAL00000000000000","code":"SC350","version":1},"meta":{"requestId":"req_admin_catalog_create_01"}}}
```

### 18.6 `GET /api/v1/admin/catalog/{resource}/{resourceId}`

- **Purpose:** Get one complete admin catalog record and dependency/usage summary.
- **Authentication:** Admin JWT with catalog-read permission.
- **Request:** Resource type and ID.
- **Validation:** Allowed type, ULID, authorization.
- **Response:** Record, current version, and references preventing deletion/deactivation.
- **HTTP status:** `200 OK`.
- **Error codes:** `RESOURCE_TYPE_INVALID`, `RESOURCE_NOT_FOUND`, `FORBIDDEN`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":{"type":"material","id":"01JMATERIAL00000000000000","code":"SC350","name":"SC 350","thicknessMm":"0.450","isActive":true,"usage":{"activeBoxes":14,"orders":6},"version":3},"meta":{"requestId":"req_admin_catalog_get_01"}}
```

### 18.7 `PATCH /api/v1/admin/catalog/{resource}/{resourceId}`

- **Purpose:** Update allowed catalog metadata/activation; structural template changes create a new version instead.
- **Authentication:** Admin JWT with `admin`; recent authentication for activation/default changes.
- **Request:** Resource-specific patch; `If-Match` required.
- **Validation:** No mutation that changes historical geometry; references valid; default glue invariants; current version.
- **Response:** Updated resource and audit reference.
- **HTTP status:** `200 OK`.
- **Error codes:** `CATALOG_RECORD_IMMUTABLE`, `CATALOG_IN_USE`, `DEFAULT_GLUE_REQUIRED`, `VERSION_CONFLICT`, `PRECONDITION_REQUIRED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"request":{"description":"Updated customer description","isActive":true},"response":{"apiVersion":"v1","data":{"type":"material","id":"01JMATERIAL00000000000000","isActive":true,"version":4},"meta":{"requestId":"req_admin_catalog_patch_01"}}}
```

### 18.8 `GET /api/v1/admin/rules/{ruleType}`

- **Purpose:** List versioned `manufacturing`, `pricing`, or `lead-time` rules.
- **Authentication:** Admin JWT with `admin`; production managers may read manufacturing/lead-time rules.
- **Request:** Query: `status`, `effectiveAt`, `limit`, `cursor`.
- **Validation:** Allowed rule type and filters.
- **Response:** Rule summaries and effective versions.
- **HTTP status:** `200 OK`.
- **Error codes:** `RULE_TYPE_INVALID`, `FORBIDDEN`, `VALIDATION_ERROR`, `CURSOR_INVALID`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":[{"id":"01JRULE00000000000000000","type":"manufacturing","version":"mfg-2026-07-01","status":"active","effectiveFrom":"2026-07-01T00:00:00.000Z"}],"meta":{"requestId":"req_admin_rules_01","nextCursor":null}}
```

### 18.9 `POST /api/v1/admin/rules/{ruleType}`

- **Purpose:** Create a draft version of manufacturing, pricing, or lead-time rules.
- **Authentication:** Admin JWT with `admin` and recent authentication.
- **Request:** `version`, `effectiveFrom`, optional `effectiveTo`, structured `rules`; `Idempotency-Key` required.
- **Validation:** Allowed type; unique version; schema-valid rules; non-overlapping effective window; referenced catalog IDs active/known.
- **Response:** Created draft rule version.
- **HTTP status:** `201 Created`.
- **Error codes:** `RULE_TYPE_INVALID`, `RULE_SCHEMA_INVALID`, `RULE_VERSION_EXISTS`, `RULE_EFFECTIVE_WINDOW_CONFLICT`, `IDEMPOTENCY_CONFLICT`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"request":{"version":"mfg-2026-08-01","effectiveFrom":"2026-08-01T00:00:00.000Z","rules":{"quantity":{"min":1,"max":500}}},"response":{"apiVersion":"v1","data":{"id":"01JRULENEW000000000000000","type":"manufacturing","version":"mfg-2026-08-01","status":"draft"},"meta":{"requestId":"req_admin_rule_create_01"}}}
```

### 18.10 `GET /api/v1/admin/rules/{ruleType}/{ruleId}`

- **Purpose:** Get a complete rule version, validation state, and usage summary.
- **Authentication:** Admin JWT with rule-read permission.
- **Request:** Rule type and ID.
- **Validation:** Type/ID match and authorization.
- **Response:** Full rule document and references.
- **HTTP status:** `200 OK`.
- **Error codes:** `RULE_TYPE_INVALID`, `RESOURCE_NOT_FOUND`, `FORBIDDEN`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":{"id":"01JRULE00000000000000000","type":"manufacturing","version":"mfg-2026-07-01","status":"active","rules":{"quantity":{"min":1,"max":500}},"usage":{"boxesValidated":120},"versionNumber":2},"meta":{"requestId":"req_admin_rule_get_01"}}
```

### 18.11 `PATCH /api/v1/admin/rules/{ruleType}/{ruleId}`

- **Purpose:** Edit a draft or publish/pause a rule version without rewriting historical rules.
- **Authentication:** Admin JWT with `admin` and recent authentication.
- **Request:** Draft `rules` changes or `status`; `If-Match` required.
- **Validation:** Active historical version immutable; publish schema/effective window valid; current version.
- **Response:** Updated/published rule and version.
- **HTTP status:** `200 OK`.
- **Error codes:** `RULE_IMMUTABLE`, `RULE_SCHEMA_INVALID`, `RULE_EFFECTIVE_WINDOW_CONFLICT`, `VERSION_CONFLICT`, `PRECONDITION_REQUIRED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"request":{"status":"active"},"response":{"apiVersion":"v1","data":{"id":"01JRULENEW000000000000000","status":"active","effectiveFrom":"2026-08-01T00:00:00.000Z","versionNumber":2},"meta":{"requestId":"req_admin_rule_patch_01"}}}
```

### 18.12 `GET /api/v1/admin/coupons`

- **Purpose:** List and search coupon definitions and usage.
- **Authentication:** Admin JWT with `admin`.
- **Request:** Query: `status`, `q`, `activeAt`, `limit`, `cursor`.
- **Validation:** Valid filters and cursor.
- **Response:** Coupon summaries and redemption counts.
- **HTTP status:** `200 OK`.
- **Error codes:** `FORBIDDEN`, `VALIDATION_ERROR`, `CURSOR_INVALID`, `FEATURE_DISABLED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":[{"id":"01JCOUPON000000000000000","code":"SAMPLE10","discountType":"percentage","discountValue":"10.0000","status":"draft","redemptionCount":0}],"meta":{"requestId":"req_admin_coupons_01","nextCursor":null}}
```

### 18.13 `POST /api/v1/admin/coupons`

- **Purpose:** Create a coupon definition.
- **Authentication:** Admin JWT with `admin` and recent authentication.
- **Request:** Code, discount, limits, dates, and eligibility rules; `Idempotency-Key` required.
- **Validation:** Unique code; discount bounds; valid date window/currency/rules; feature policy.
- **Response:** Created draft coupon.
- **HTTP status:** `201 Created`.
- **Error codes:** `COUPON_CODE_EXISTS`, `COUPON_RULE_INVALID`, `VALIDATION_ERROR`, `IDEMPOTENCY_CONFLICT`, `FEATURE_DISABLED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"request":{"code":"SAMPLE10","name":"Sample 10%","discountType":"percentage","discountValue":"10.0000","maximumDiscount":"20000.00","startsAt":"2026-08-01T00:00:00.000Z","endsAt":"2026-08-31T23:59:59.000Z"},"response":{"apiVersion":"v1","data":{"id":"01JCOUPON000000000000000","code":"SAMPLE10","status":"draft","version":1},"meta":{"requestId":"req_admin_coupon_create_01"}}}
```

### 18.14 `GET /api/v1/admin/coupons/{couponId}`

- **Purpose:** Get one coupon, rules, usage, and redemption summary.
- **Authentication:** Admin JWT with `admin`.
- **Request:** Path `couponId`.
- **Validation:** ULID and authorization.
- **Response:** Coupon detail.
- **HTTP status:** `200 OK`.
- **Error codes:** `RESOURCE_NOT_FOUND`, `FORBIDDEN`, `FEATURE_DISABLED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":{"id":"01JCOUPON000000000000000","code":"SAMPLE10","status":"draft","discountType":"percentage","discountValue":"10.0000","rules":{},"usage":{"reserved":0,"redeemed":0},"version":1},"meta":{"requestId":"req_admin_coupon_get_01"}}
```

### 18.15 `PATCH /api/v1/admin/coupons/{couponId}`

- **Purpose:** Edit a draft coupon or change lifecycle status.
- **Authentication:** Admin JWT with `admin`; recent authentication for activation.
- **Request:** Mutable coupon fields/status; `If-Match` required.
- **Validation:** Redeemed coupon history immutable; active changes cannot invalidate existing reservations; rule/date/discount bounds.
- **Response:** Updated coupon and version.
- **HTTP status:** `200 OK`.
- **Error codes:** `COUPON_IMMUTABLE_FIELD`, `COUPON_RESERVATION_CONFLICT`, `COUPON_RULE_INVALID`, `VERSION_CONFLICT`, `FEATURE_DISABLED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"request":{"status":"active"},"response":{"apiVersion":"v1","data":{"id":"01JCOUPON000000000000000","status":"active","version":2},"meta":{"requestId":"req_admin_coupon_patch_01"}}}
```

### 18.16 `GET /api/v1/admin/staff`

- **Purpose:** List staff accounts and roles.
- **Authentication:** Admin JWT with `admin`.
- **Request:** Query: `role`, `status`, `q`, `limit`, `cursor`.
- **Validation:** Valid filters and cursor.
- **Response:** Paginated staff summaries.
- **HTTP status:** `200 OK`.
- **Error codes:** `FORBIDDEN`, `VALIDATION_ERROR`, `CURSOR_INVALID`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":[{"id":"01JADMIN0000000000000000","email":"ops@packerz.example","name":"Ops Manager","role":"production_manager","status":"active"}],"meta":{"requestId":"req_admin_staff_01","nextCursor":null}}
```

### 18.17 `POST /api/v1/admin/staff`

- **Purpose:** Invite/create a staff identity linked to GnuBoard when configured.
- **Authentication:** Admin JWT with `admin` and recent authentication.
- **Request:** `email`, `name`, `role`, optional `gnuMemberId`; `Idempotency-Key` required.
- **Validation:** Unique email/external identity; allowed role; inviter cannot grant beyond own role.
- **Response:** Invited/created staff record.
- **HTTP status:** `201 Created`.
- **Error codes:** `STAFF_EMAIL_EXISTS`, `GNU_MEMBER_CONFLICT`, `ROLE_NOT_ASSIGNABLE`, `RECENT_AUTH_REQUIRED`, `IDEMPOTENCY_CONFLICT`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"request":{"email":"operator@packerz.example","name":"Operator Kim","role":"operator"},"response":{"apiVersion":"v1","data":{"id":"01JADMINNEW00000000000000","status":"invited","role":"operator"},"meta":{"requestId":"req_admin_staff_create_01"}}}
```

### 18.18 `GET /api/v1/admin/staff/{staffId}`

- **Purpose:** Get staff identity, role, status, assignments, and recent audit summary.
- **Authentication:** Admin JWT with `admin`.
- **Request:** Path `staffId`.
- **Validation:** ULID and permission.
- **Response:** Staff detail without credential material.
- **HTTP status:** `200 OK`.
- **Error codes:** `RESOURCE_NOT_FOUND`, `FORBIDDEN`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":{"id":"01JADMINNEW00000000000000","email":"operator@packerz.example","name":"Operator Kim","role":"operator","status":"active","activeJobCount":2,"version":2},"meta":{"requestId":"req_admin_staff_get_01"}}
```

### 18.19 `PATCH /api/v1/admin/staff/{staffId}`

- **Purpose:** Change staff name, role, or active status.
- **Authentication:** Admin JWT with `admin` and recent authentication.
- **Request:** Mutable fields; `If-Match` required.
- **Validation:** Cannot remove last active admin; cannot self-escalate; active jobs handled before disabling operator; version match.
- **Response:** Updated staff record.
- **HTTP status:** `200 OK`.
- **Error codes:** `LAST_ADMIN_PROTECTED`, `SELF_ROLE_ESCALATION_FORBIDDEN`, `ACTIVE_ASSIGNMENTS_EXIST`, `VERSION_CONFLICT`, `RECENT_AUTH_REQUIRED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"request":{"status":"disabled"},"response":{"apiVersion":"v1","data":{"id":"01JADMINNEW00000000000000","status":"disabled","disabledAt":"2026-07-24T12:00:00.000Z","version":3},"meta":{"requestId":"req_admin_staff_patch_01"}}}
```

### 18.20 `GET /api/v1/admin/audit-logs`

- **Purpose:** Search immutable audit events.
- **Authentication:** Admin JWT with `admin`; narrowly scoped read may be granted to auditors.
- **Request:** Query: actor, action, entity type/ID, request ID, date range, `limit`, `cursor`.
- **Validation:** Date range/limit; sensitive before/after values redacted by permission.
- **Response:** Paginated audit entries.
- **HTTP status:** `200 OK`.
- **Error codes:** `FORBIDDEN`, `VALIDATION_ERROR`, `CURSOR_INVALID`, `DATE_RANGE_TOO_LARGE`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":[{"id":"01JAUDIT0000000000000000","actor":{"type":"admin","id":"01JADMIN0000000000000000"},"action":"production_job.status_changed","entity":{"type":"production_job","id":"01JJOB000000000000000000"},"createdAt":"2026-07-24T11:00:00.000Z"}],"meta":{"requestId":"req_admin_audit_01","nextCursor":null}}
```

### 18.21 `GET /api/v1/admin/settings`

- **Purpose:** Get approved non-secret platform settings and configuration health.
- **Authentication:** Admin JWT with `admin`.
- **Request:** Optional `group`.
- **Validation:** Supported setting group; secrets are never returned.
- **Response:** Safe settings, versions, and environment-readiness flags.
- **HTTP status:** `200 OK`.
- **Error codes:** `FORBIDDEN`, `VALIDATION_ERROR`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"apiVersion":"v1","data":{"commerce":{"couponsEnabled":false,"currency":"KRW"},"guest":{"sessionHours":24},"health":{"paymentProviderConfigured":true,"s3Configured":true},"version":5},"meta":{"requestId":"req_admin_settings_01"}}
```

### 18.22 `PATCH /api/v1/admin/settings`

- **Purpose:** Update approved non-secret platform settings.
- **Authentication:** Admin JWT with `admin` and recent authentication.
- **Request:** Supported setting patch; `If-Match` required.
- **Validation:** Allowlisted keys; safe ranges; dependencies satisfied; no secret values; version match.
- **Response:** Updated safe settings/version and audit reference.
- **HTTP status:** `200 OK`.
- **Error codes:** `SETTING_NOT_EDITABLE`, `SETTING_VALUE_INVALID`, `SETTING_DEPENDENCY_MISSING`, `VERSION_CONFLICT`, `RECENT_AUTH_REQUIRED`.
- **Versioning:** v1.
- **Example JSON:**

```json
{"request":{"commerce":{"couponsEnabled":true}},"response":{"apiVersion":"v1","data":{"commerce":{"couponsEnabled":true,"currency":"KRW"},"version":6},"meta":{"requestId":"req_admin_settings_patch_01"}}}
```

## 19. Domain Error Codes

### Authentication and identity

`EMAIL_ALREADY_EXISTS`, `INVALID_CREDENTIALS`, `ACCOUNT_SUSPENDED`, `ACCOUNT_DISABLED`, `MFA_REQUIRED`, `MFA_INVALID`, `SESSION_REVOKED`, `RESET_TOKEN_INVALID`, `RESET_TOKEN_EXPIRED`, `VERIFICATION_TOKEN_INVALID`, `VERIFICATION_TOKEN_EXPIRED`, `VERIFICATION_COOLDOWN`, `RECENT_AUTH_REQUIRED`, `GUEST_SESSION_EXPIRED`, `GUEST_ALREADY_CONVERTED`, `GUEST_TRANSFER_CONFLICT`.

### Box, quote, and dieline

`CATALOG_ITEM_INACTIVE`, `UNSUPPORTED_OPTION`, `BOX_LOCKED`, `BOX_IN_USE`, `BOX_NOT_VALIDATED`, `REVISION_CONFLICT`, `RULESET_UNAVAILABLE`, `AI_SERVICE_UNAVAILABLE`, `QUOTE_UNAVAILABLE`, `QUOTE_EXPIRED`, `QUOTE_QUANTITY_MISMATCH`, `DIELINE_BOX_MISMATCH`, `DIELINE_NOT_READY`, `DIELINE_NOT_APPROVED`, `DIELINE_SUPERSEDED`, `GEOMETRY_HASH_MISMATCH`, `GENERATOR_UNAVAILABLE`, `GENERATOR_VERSION_MISMATCH`, `EXPORT_UNAVAILABLE`.

### Cart, checkout, and order

`CART_EMPTY`, `CART_NOT_ACTIVE`, `CART_STATE_INVALID`, `COUPON_NOT_FOUND`, `COUPON_INACTIVE`, `COUPON_EXPIRED`, `COUPON_NOT_ELIGIBLE`, `COUPON_USAGE_LIMIT`, `CHECKOUT_ITEM_INVALID`, `CHECKOUT_INCOMPLETE`, `CHECKOUT_EXPIRED`, `CHECKOUT_NOT_EDITABLE`, `REPRICE_REQUIRED`, `REPRICE_ACCEPTANCE_REQUIRED`, `ORDER_ALREADY_CREATED`, `ORDER_LOOKUP_FAILED`, `VERIFICATION_REQUIRED`, `ORDER_NOT_CANCELLABLE`.

### Payment

`ORDER_NOT_PAYABLE`, `PAYMENT_METHOD_UNSUPPORTED`, `PAYMENT_ALREADY_PENDING`, `PAYMENT_PROVIDER_UNAVAILABLE`, `PAYMENT_VERIFICATION_FAILED`, `PAYMENT_AMOUNT_MISMATCH`, `PAYMENT_ORDER_MISMATCH`, `PAYMENT_ALREADY_CONFIRMED`, `PAYMENT_NOT_CANCELLABLE`, `PAYMENT_NOT_REFUNDABLE`, `REFUND_AMOUNT_INVALID`, `WEBHOOK_SIGNATURE_INVALID`, `WEBHOOK_PAYLOAD_INVALID`.

### Production, QC, and shipping

`ASSIGNEE_INVALID`, `JOB_STATE_CONFLICT`, `SCHEDULE_CONFLICT`, `INVALID_STATUS_TRANSITION`, `REASON_REQUIRED`, `QUANTITY_INVALID`, `JOB_NOT_READY_FOR_QC`, `CHECKLIST_INCOMPLETE`, `QC_REQUIRED`, `QC_RESULT_CONFLICT`, `ORDER_NOT_READY_TO_SHIP`, `SHIPMENT_QUANTITY_INVALID`, `SHIPMENT_NOT_EDITABLE`, `SHIPMENT_INCOMPLETE`, `TRACKING_NUMBER_CONFLICT`, `ADDRESS_INVALID`, `CARRIER_UNSUPPORTED`.

## 20. Idempotency

### Required endpoints

`Idempotency-Key` is required for:

- Checkout session creation
- Order creation
- Payment creation and confirmation
- Payment cancellation
- Refund creation
- Dieline generation
- Production QC creation
- Shipment creation/status mutation
- Admin catalog/rule/coupon/staff creation

### Behavior

- Keys are scoped to authenticated principal + method + canonical route.
- The server stores request hash, final status, and response for the key.
- Same key + same request returns the original response.
- Same key + different request returns `409 IDEMPOTENCY_CONFLICT`.
- In-progress duplicate requests return `409 REQUEST_IN_PROGRESS` or wait within a bounded period.
- Keys expire only after the longest safe retry window for the operation.

## 21. Rate Limits

Rate-limit values are deployment configuration, not hard-coded API semantics. Recommended classes:

| Class | Examples | Starting policy |
|---|---|---|
| Authentication | Login, reset, order lookup | Tight per IP + identity |
| AI/generation | Recommendations, dielines | Per principal and project |
| Customer reads | Catalog, order tracking | Moderate burst |
| Customer writes | Box/cart/checkout | Moderate per principal |
| Webhooks | Payment/carrier | Per provider plus signature |
| Admin reads | Queue, orders, audit | Role-aware |
| Admin writes | Status, refunds, rules | Low burst with audit |

All `429` responses include `Retry-After`.

## 22. Caching and Concurrency

- Public catalog GETs may use short `Cache-Control` with ETag.
- Authenticated order/payment/production responses default to `Cache-Control: no-store`.
- Signed download responses are not publicly cacheable.
- Draft/admin mutable resources return ETag/version.
- `PATCH` uses `If-Match`; stale mutations return `409 VERSION_CONFLICT`.
- Payment and webhook processing uses database row locks and unique provider/idempotency keys.
- Cart/checkout/order totals are always recalculated or verified server-side.

## 23. Observability

- Every request receives a non-secret `requestId`.
- Propagate request/correlation IDs through Next.js, PHP, database logs, payment calls, and generator jobs.
- Log route template, status, duration, caller type, and safe resource IDs.
- Never log JWTs, passwords, raw guest/order tokens, full addresses, card data, webhook secrets, or unredacted provider payloads.
- Business mutations write an `audit_logs` row in the authoritative transaction or a guaranteed outbox workflow.

## 24. Open Contract Decisions Before Implementation

The following require Project Manager/architecture approval before code changes:

1. JWT signing algorithm, key custody, issuer host, and cookie names.
2. Exact GnuBoard5 member mapping and whether PHP or an external identity provider validates passwords.
3. Payment provider, supported methods, callback fields, and refund behavior.
4. Carrier integrations and webhook/signature formats.
5. AI recommendation provider and data-retention policy.
6. Dieline generator execution boundary and synchronous/asynchronous threshold.
7. Production state-machine transition matrix by role.
8. Coupon launch scope; the database/API support exists but the PRD excludes complex coupon behavior from MVP.
9. Tax and shipping calculation rules for the domestic MVP.
10. Retention windows for guest sessions, idempotency records, payment events, audit logs, and signed exports.
