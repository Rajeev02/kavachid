# KavachID API Specification 🛡️

This document describes the REST API endpoints exposed by KavachID V1. All APIs are multi-tenant and isolated context-wise.

---

## 🔒 Security Headers & Conventions

Unless otherwise specified, endpoints require the following headers:

| Header Name | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `x-tenant-id` | **Yes** (most APIs) | UUID of the isolated tenant workspace. | `123e4567-e89b-12d3-a456-426614174000` |
| `Authorization` | **Yes** (guarded APIs) | Bearer token format containing the JWT access token. | `Bearer eyJhbGciOiJSUzI1NiIs...` |
| `dpop` | **Yes** (auth/session APIs) | ECDSA (ES256) signed JWT proof containing `htm`, `htu`, `iat`, `jti`, and the public JWK. | `eyJ0eXAiOiJkcG9wK2p3dCIs...` |

---

## 📂 API Reference

### 1. Root & Status
* [GET /](#get-)

### 2. JWKS & Cryptographic Keys
* [GET /.well-known/jwks.json](#get-well-knownjwksjson)
* [GET /oauth/jwks](#get-oauthjwks)
* [POST /admin/keys/rotate](#post-adminkeysrotate)

### 3. User Management
* [POST /users/register](#post-usersregister)
* [POST /users/verify-password](#post-usersverify-password)
* [GET /users/:id](#get-usersid)

### 4. Auth & Session Lifecycle
* [POST /auth/login](#post-authlogin)
* [POST /auth/refresh](#post-authrefresh)
* [POST /auth/logout](#post-authlogout)
* [GET /auth/sessions](#get-authsessions)

### 5. Role-Based Access Control (RBAC)
* [POST /roles](#post-roles)
* [POST /permissions](#post-permissions)
* [POST /roles/:roleId/permissions](#post-rolesroleidpermissions)
* [POST /users/:userId/roles](#post-usersuseridroles)
* [GET /roles](#get-roles)
* [GET /permissions](#get-permissions)

### 6. Admin Control Plane
* [GET /admin/users](#get-adminusers)
* [GET /admin/sessions](#get-adminsessions)
* [DELETE /admin/sessions/:id](#delete-adminsessionsid)
* [GET /admin/audit-logs](#get-adminaudit-logs)

---

## 1. Root & Status

### GET /
Returns simple API check string.

* **Headers**: None
* **Response `200 OK`**:
  ```text
  Hello World!
  ```

---

## 2. JWKS & Cryptographic Keys

### GET /.well-known/jwks.json
### GET /oauth/jwks
Serves the JSON Web Key Set (JWKS) containing the active public keys used to verify issued access tokens.

* **Headers**: None
* **Query Parameters**:
  * `alg` (optional): Algorithm type to fetch (`RS256` or `ES256`). Defaults to `RS256`.
* **Response `200 OK`**:
  ```json
  {
    "keys": [
      {
        "kty": "RSA",
        "kid": "active-key-uuid",
        "use": "sig",
        "alg": "RS256",
        "n": "u1W3vY...",
        "e": "AQAB"
      }
    ]
  }
  ```

### POST /admin/keys/rotate
Triggers cryptographic signing keypair generation and rotation. Old key is demoted to `ROTATED` state.

* **Headers**:
  * `x-tenant-id` (Required)
* **Query Parameters**:
  * `alg` (optional): Key type (`RS256` or `ES256`). Defaults to `RS256`.
* **Response `201 Created`**:
  ```json
  {
    "message": "Signing keys rotated successfully",
    "id": "new-key-uuid",
    "algorithm": "RS256",
    "status": "ACTIVE",
    "createdAt": "2026-06-17T06:00:00.000Z"
  }
  ```

---

## 3. User Management

### POST /users/register
Registers a user account. Automatically performs multi-threaded Argon2id password hashing.

* **Headers**:
  * `x-tenant-id` (Required)
* **Request Body**:
  ```json
  {
    "email": "user@domain.com",
    "password": "SecurePassword123!",
    "username": "johndoe",
    "metadata": {
      "department": "Engineering"
    }
  }
  ```
  *(Note: email and username are optional, but at least one must be provided.)*
* **Response `201 Created`**:
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "id": "user-uuid",
      "email": "user@domain.com",
      "username": "johndoe",
      "status": "ACTIVE",
      "migrationStatus": "COMPLETED",
      "createdAt": "2026-06-17T06:00:00.000Z"
    }
  }
  ```

### POST /users/verify-password
Verifies the user's password. Supports JIT Legacy Migration (calls webhook for external verification if legacy status is pending).

* **Headers**:
  * `x-tenant-id` (Required)
* **Request Body**:
  ```json
  {
    "identifier": "user@domain.com",
    "password": "SecurePassword123!"
  }
  ```
* **Response `201 Created`**:
  ```json
  {
    "message": "Credentials verified successfully",
    "verified": true,
    "user": {
      "id": "user-uuid",
      "email": "user@domain.com",
      "username": "johndoe"
    }
  }
  ```

### GET /users/:id
Retrieves public user profile details.

* **Headers**:
  * `x-tenant-id` (Required)
* **Response `200 OK`**:
  ```json
  {
    "user": {
      "id": "user-uuid",
      "email": "user@domain.com",
      "username": "johndoe",
      "status": "ACTIVE",
      "migrationStatus": "COMPLETED",
      "createdAt": "2026-06-17T06:00:00.000Z"
    }
  }
  ```

---

## 4. Auth & Session Lifecycle

### POST /auth/login
Authenticates a user, binding their active session cryptographically to their client key using DPoP thumbprints.

* **Headers**:
  * `x-tenant-id` (Required)
  * `dpop` (Required): ECDSA DPoP proof generated by the client.
* **Request Body**:
  ```json
  {
    "identifier": "user@domain.com",
    "password": "SecurePassword123!",
    "fingerprint": "optional-device-hardware-id"
  }
  ```
* **Response `201 Created`**:
  ```json
  {
    "accessToken": "access-jwt-string",
    "refreshToken": "session-uuid:refresh-token-opaque-string",
    "user": {
      "id": "user-uuid",
      "email": "user@domain.com",
      "username": "johndoe"
    }
  }
  ```

### POST /auth/refresh
Rotates the refresh token (RTR) and issues a new access token bound to the client's DPoP signature.

* **Headers**:
  * `x-tenant-id` (Required)
  * `dpop` (Required): ECDSA DPoP proof for the `/auth/refresh` request.
* **Request Body**:
  ```json
  {
    "refreshToken": "session-uuid:refresh-token-opaque-string"
  }
  ```
* **Response `201 Created`**:
  ```json
  {
    "accessToken": "new-access-jwt-string",
    "refreshToken": "session-uuid:new-refresh-token-opaque-string"
  }
  ```
  *(Important: If the refresh token is reused after rotation, all active sessions for the user will be instantly revoked as a hijack mitigation).*

### POST /auth/logout
Logs out the user and revokes the active session and token.

* **Headers**:
  * `x-tenant-id` (Required)
  * `dpop` (Required)
* **Request Body**:
  ```json
  {
    "refreshToken": "session-uuid:refresh-token-opaque-string"
  }
  ```
* **Response `201 Created`**:
  ```json
  {
    "message": "Session revoked successfully"
  }
  ```

### GET /auth/sessions
Lists all active sessions for the authenticated user.

* **Headers**:
  * `x-tenant-id` (Required)
  * `Authorization` (Required: Bearer Token)
* **Query Parameters**:
  * `userId` (optional): Fallback identifier if token parsing fails.
* **Response `200 OK`**:
  ```json
  {
    "sessions": [
      {
        "id": "session-uuid",
        "ipAddress": "127.0.0.1",
        "userAgent": "Mozilla/5.0...",
        "fingerprint": "optional-device-hardware-id",
        "dpopJkt": "dpop-key-jwk-thumbprint",
        "createdAt": "2026-06-17T06:00:00.000Z"
      }
    ]
  }
  ```

---

## 5. Role-Based Access Control (RBAC)

### POST /roles
Creates a new tenant-specific role.

* **Headers**:
  * `x-tenant-id` (Required)
  * `Authorization` (Required: Bearer Token)
* **Request Body**:
  ```json
  {
    "name": "Admin",
    "description": "Administrator with full system privileges"
  }
  ```
* **Response `201 Created`**:
  ```json
  {
    "message": "Role created successfully",
    "role": {
      "id": "role-uuid",
      "name": "Admin",
      "description": "Administrator with full system privileges",
      "tenantId": "tenant-uuid"
    }
  }
  ```

### POST /permissions
Creates a new permission action on a resource.

* **Headers**:
  * `x-tenant-id` (Required)
  * `Authorization` (Required: Bearer Token)
* **Request Body**:
  ```json
  {
    "resource": "billing",
    "action": "write"
  }
  ```
* **Response `201 Created`**:
  ```json
  {
    "message": "Permission created successfully",
    "permission": {
      "id": "permission-uuid",
      "resource": "billing",
      "action": "write",
      "tenantId": "tenant-uuid"
    }
  }
  ```

### POST /roles/:roleId/permissions
Maps a permission resource to a role.

* **Headers**:
  * `x-tenant-id` (Required)
  * `Authorization` (Required: Bearer Token)
* **Request Body**:
  ```json
  {
    "permissionId": "permission-uuid"
  }
  ```
* **Response `201 Created`**:
  ```json
  {
    "message": "Permission assigned to role successfully"
  }
  ```

### POST /users/:userId/roles
Assigns a role to a user.

* **Headers**:
  * `x-tenant-id` (Required)
  * `Authorization` (Required: Bearer Token)
* **Request Body**:
  ```json
  {
    "roleId": "role-uuid"
  }
  ```
* **Response `201 Created`**:
  ```json
  {
    "message": "Role assigned to user successfully"
  }
  ```

### GET /roles
Lists all roles defined inside the current tenant.

* **Headers**:
  * `x-tenant-id` (Required)
  * `Authorization` (Required: Bearer Token)
* **Response `200 OK`**:
  ```json
  {
    "roles": [
      {
        "id": "role-uuid",
        "name": "Admin",
        "description": "Administrator"
      }
    ]
  }
  ```

### GET /permissions
Lists all permissions defined inside the current tenant.

* **Headers**:
  * `x-tenant-id` (Required)
  * `Authorization` (Required: Bearer Token)
* **Response `200 OK`**:
  ```json
  {
    "permissions": [
      {
        "id": "permission-uuid",
        "resource": "billing",
        "action": "write"
      }
    ]
  }
  ```

---

## 6. Admin Control Plane

### GET /admin/users
Lists all users residing inside the tenant context.

* **Headers**:
  * `x-tenant-id` (Required)
  * `Authorization` (Required: Bearer Token with `users:read` permission)
* **Query Parameters**:
  * `page` (optional): Page number (defaults to `1`)
  * `limit` (optional): Records per page (defaults to `10`)
  * `search` (optional): Query to search username or email
* **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "id": "user-uuid",
        "email": "user@domain.com",
        "username": "johndoe",
        "status": "ACTIVE",
        "migrationStatus": "COMPLETED",
        "createdAt": "2026-06-17T06:00:00.000Z"
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```

### GET /admin/sessions
Lists all active sessions across the tenant.

* **Headers**:
  * `x-tenant-id` (Required)
  * `Authorization` (Required: Bearer Token with `sessions:read` permission)
* **Query Parameters**:
  * `page` (optional): Page number (defaults to `1`)
  * `limit` (optional): Records per page (defaults to `10`)
* **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "id": "session-uuid",
        "ipAddress": "127.0.0.1",
        "userAgent": "Mozilla/5.0...",
        "fingerprint": "sdk-fingerprint",
        "createdAt": "2026-06-17T06:00:00.000Z",
        "user": {
          "id": "user-uuid",
          "email": "user@domain.com"
        }
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```

### DELETE /admin/sessions/:id
Revokes any active user session within the tenant.

* **Headers**:
  * `x-tenant-id` (Required)
  * `Authorization` (Required: Bearer Token with `sessions:write` permission)
* **Response `200 OK`**:
  ```json
  {
    "message": "Session revoked successfully"
  }
  ```

### GET /admin/audit-logs
Retrieves paginated, searchable system logs recorded for critical security operations.

* **Headers**:
  * `x-tenant-id` (Required)
  * `Authorization` (Required: Bearer Token with `audit_logs:read` permission)
* **Query Parameters**:
  * `page` (optional): Page number (defaults to `1`)
  * `limit` (optional): Records per page (defaults to `10`)
  * `search` (optional): Filter logs by action name or username/ID
* **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "id": "audit-log-uuid",
        "action": "auth.login",
        "actorId": "user-uuid",
        "actorIp": "127.0.0.1",
        "actorUserAgent": "Mozilla/5.0...",
        "resourceType": "session",
        "resourceId": "session-uuid",
        "status": "success",
        "metadata": {
          "ipAddress": "127.0.0.1",
          "fingerprint": "sdk-fingerprint"
        },
        "createdAt": "2026-06-17T06:00:00.000Z",
        "actor": {
          "id": "user-uuid",
          "email": "user@domain.com"
        }
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```

---

## ⚠️ Common Error Codes

Endpoints follow REST status conventions:

* **`400 Bad Request`**: Validation error (missing fields, invalid email format, password too short).
  ```json
  {
    "message": ["Password must be at least 8 characters long"],
    "error": "Bad Request",
    "statusCode": 400
  }
  ```
* **`401 Unauthorized`**: Missing token, expired session, invalid signature key thumbprint, or failed credentials.
  ```json
  {
    "message": "Invalid credentials",
    "error": "Unauthorized",
    "statusCode": 401
  }
  ```
* **`403 Forbidden`**: Missing required permission or tenant access rights.
  ```json
  {
    "message": "Forbidden resource",
    "error": "Forbidden",
    "statusCode": 403
  }
  ```
* **`404 Not Found`**: Requesting details for a non-existent entity ID.
  ```json
  {
    "message": "User not found",
    "error": "Not Found",
    "statusCode": 404
  }
  ```
