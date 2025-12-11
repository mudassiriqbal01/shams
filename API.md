# Shams Vision Core Platform - API Documentation

## Base URL

Development: `http://localhost:3000`

## Authentication

All protected endpoints require a valid JWT access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Response Format

### Success Response

```json
{
  "data": { /* response body */ }
}
```

### Error Response

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "BadRequest"
}
```

---

## Authentication Endpoints

### POST /auth/register

Register a new user.

**Request Body**:
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "password123",
  "departmentId": "uuid"
}
```

**Response** (201 Created):
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "activeDepartmentId": "uuid",
    "departments": [
      {
        "id": "uuid",
        "name": "Department Name",
        "description": "Description"
      }
    ]
  }
}
```

**Errors**:
- `400 Bad Request`: Validation failed or user already exists
- `404 Not Found`: Department not found

---

### POST /auth/login

Authenticate a user and receive tokens.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "activeDepartmentId": "uuid",
    "departments": [...]
  }
}
```

**Errors**:
- `401 Unauthorized`: Invalid email or password

---

### POST /auth/refresh

Refresh the access token using a refresh token.

**Request Body**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": { /* user object */ }
}
```

**Errors**:
- `400 Bad Request`: Refresh token is required
- `401 Unauthorized`: Invalid or expired refresh token

---

### GET /auth/me

Get the current authenticated user's profile.

**Headers Required**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "activeDepartmentId": "uuid"
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token

---

### POST /auth/switch-department

Switch the user's active department.

**Headers Required**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "departmentId": "uuid"
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "activeDepartmentId": "uuid",
    "departments": [...]
  }
}
```

**Errors**:
- `400 Bad Request`: User doesn't have access to department
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: User not found

---

## Department Endpoints

All department endpoints require authentication.

### GET /departments

Get the current user's active department.

**Headers Required**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Engineering",
  "description": "Engineering Department"
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: No active department context

---

### GET /departments/:id

Get a specific department (must match active department).

**Headers Required**:
```
Authorization: Bearer <access_token>
```

**Path Parameters**:
- `id` (string): Department ID

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Engineering",
  "description": "Engineering Department"
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Access denied to this department
- `404 Not Found`: Department not found

---

## Module Endpoints

All module endpoints are scoped to the active department.

### GET /modules

List all modules in the active department.

**Headers Required**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "name": "Module Name",
    "description": "Description",
    "departmentId": "uuid",
    "metadata": {
      "customField": "value"
    },
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z",
    "version": 1
  }
]
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: No active department context

---

### POST /modules

Create a new module in the active department.

**Headers Required**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "name": "Module Name",
  "description": "Optional description",
  "metadata": {
    "customField": "value"
  }
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "name": "Module Name",
  "description": "Optional description",
  "departmentId": "uuid",
  "metadata": {
    "customField": "value"
  },
  "createdAt": "2024-01-01T12:00:00Z",
  "updatedAt": "2024-01-01T12:00:00Z",
  "version": 1
}
```

**Errors**:
- `400 Bad Request`: Validation failed
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: No active department context

---

### GET /modules/:id

Get a specific module (must be in active department).

**Headers Required**:
```
Authorization: Bearer <access_token>
```

**Path Parameters**:
- `id` (string): Module ID

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Module Name",
  "description": "Description",
  "departmentId": "uuid",
  "metadata": { /* ... */ },
  "createdAt": "2024-01-01T12:00:00Z",
  "updatedAt": "2024-01-01T12:00:00Z",
  "version": 1
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Module not in active department
- `404 Not Found`: Module not found

---

### PUT /modules/:id

Update a module (optimistic concurrency control).

**Headers Required**:
```
Authorization: Bearer <access_token>
```

**Path Parameters**:
- `id` (string): Module ID

**Request Body**:
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "metadata": { /* updated metadata */ },
  "version": 1
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "description": "Updated description",
  "departmentId": "uuid",
  "metadata": { /* ... */ },
  "createdAt": "2024-01-01T12:00:00Z",
  "updatedAt": "2024-01-01T12:00:01Z",
  "version": 2
}
```

**Errors**:
- `400 Bad Request`: Validation failed
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Module not in active department
- `404 Not Found`: Module not found
- `409 Conflict`: Version mismatch (optimistic lock)

### Handling Conflicts

When you receive a 409 conflict:

1. **Refetch** the current module: `GET /modules/:id`
2. **Review** the changes in the updated version
3. **Reapply** your changes with the new version number
4. **Retry** the update

Example conflict flow:
```
User A: GET /modules/1 (version: 1)
User B: PUT /modules/1 (version: 1) → Success, version becomes 2
User A: PUT /modules/1 (version: 1) → 409 Conflict

User A: GET /modules/1 → Receives version 2
User A: PUT /modules/1 (version: 2) → Success
```

---

### DELETE /modules/:id

Delete a module.

**Headers Required**:
```
Authorization: Bearer <access_token>
```

**Path Parameters**:
- `id` (string): Module ID

**Response** (200 OK):
```json
{}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Module not in active department
- `404 Not Found`: Module not found

---

## Role Endpoints

### GET /roles

List all roles in the active department.

**Headers Required**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "name": "Admin",
    "departmentId": "uuid",
    "permissions": [
      "CAN_VIEW",
      "CAN_EDIT_ROWS",
      "CAN_EDIT_SCHEMA",
      "CAN_EXPORT",
      "ROW_LEVEL_SECURITY"
    ]
  }
]
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: No active department context

---

### GET /roles/:id

Get a specific role.

**Headers Required**:
```
Authorization: Bearer <access_token>
```

**Path Parameters**:
- `id` (string): Role ID

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Admin",
  "departmentId": "uuid",
  "permissions": [
    "CAN_VIEW",
    "CAN_EDIT_ROWS",
    "CAN_EDIT_SCHEMA",
    "CAN_EXPORT",
    "ROW_LEVEL_SECURITY"
  ]
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Role not in active department
- `404 Not Found`: Role not found

---

## Permission Types

Valid permission values:

| Permission | Description |
|------------|-------------|
| CAN_VIEW | Read-only access |
| CAN_EDIT_ROWS | Modify data rows |
| CAN_EDIT_SCHEMA | Modify module structure |
| CAN_EXPORT | Export data |
| ROW_LEVEL_SECURITY | Full RLS capability |

---

## HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation errors, missing fields |
| 401 | Unauthorized | Invalid/missing token, invalid credentials |
| 403 | Forbidden | Access denied to resource/department |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Version mismatch on update |
| 500 | Server Error | Internal server error |

---

## Rate Limiting

Not currently implemented. Will be added in Phase 2.

---

## Pagination

Not currently implemented. Will be added in Phase 2.

**Planned pagination query parameters**:
- `page`: Page number (1-indexed)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Sort field (e.g., `createdAt:desc`)

---

## Filtering

Not currently implemented. Will be added in Phase 2.

**Planned filter parameters** for list endpoints:
- Name/text search
- Date range filters
- Department-specific filters

---

## Error Response Examples

### Validation Error

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "BadRequest",
  "details": [
    {
      "field": "email",
      "message": "Must be a valid email address"
    }
  ]
}
```

### Authentication Error

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### Conflict Error

```json
{
  "statusCode": 409,
  "message": "Conflict on Module. Current version: 2",
  "error": "Conflict"
}
```

---

## Testing Endpoints

Use the following test credentials to test the API:

**Admin User**:
```
Email: admin@example.com
Password: password123
Department: Engineering (admin role)
```

**Viewer User**:
```
Email: viewer@example.com
Password: password123
Department: Engineering (viewer role)
```

**Sales User**:
```
Email: sales@example.com
Password: password123
Department: Sales (admin role)
```

### Example cURL Commands

**Login**:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

**Get Current User**:
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer <access_token>"
```

**List Modules**:
```bash
curl -X GET http://localhost:3000/modules \
  -H "Authorization: Bearer <access_token>"
```

**Create Module**:
```bash
curl -X POST http://localhost:3000/modules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "name": "New Module",
    "description": "Module description",
    "metadata": {}
  }'
```

**Switch Department**:
```bash
curl -X POST http://localhost:3000/auth/switch-department \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "departmentId": "<department-uuid>"
  }'
```

---

## Webhooks

Not currently implemented. Planned for Phase 2.

---

## SDK/Client Libraries

### JavaScript/TypeScript

Use the `api.ts` file in `/apps/web/src/` as a reference for building API calls.

Planned official SDKs:
- `@shams-vision/sdk-js`: JavaScript/TypeScript SDK
- `@shams-vision/sdk-python`: Python SDK

---

## Versioning

Current API Version: **1.0.0**

The API does not currently use URL versioning (`/api/v1/`). When API changes occur in the future, version information will be included in response headers.

---

## Support

For API issues or questions:
1. Check the SETUP.md for common troubleshooting
2. Review ARCHITECTURE.md for system design
3. Consult the source code in `/apps/api/src`
