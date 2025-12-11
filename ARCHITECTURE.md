# Shams Vision Core Platform - Architecture Documentation

## System Overview

The Shams Vision Core Platform is a monolithic full-stack application designed for multi-tenant, department-scoped data management with role-based access control and Row Level Security (RLS).

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              React 18 Frontend (Port 3001)               │   │
│  │  ┌────────┬─────────┬───────────┬──────────────────────┐ │   │
│  │  │ Login  │Dashboard│ Modules   │Department Switcher   │ │   │
│  │  └────────┴─────────┴───────────┴──────────────────────┘ │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │         useAuth Hook (State Management)             │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                    │
├─────────────────────────────────────────────────────────────────┤
│                      HTTP/REST API Layer                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         NestJS API Server (Port 3000)                   │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │              Route Handlers                         │ │   │
│  │  │  /auth       /modules    /departments   /roles      │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │              Security Guards                        │ │   │
│  │  │  JwtAuthGuard ← validates token                     │ │   │
│  │  │  DepartmentRlsGuard ← enforces department context  │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │         NestJS Modules (Services)                  │ │   │
│  │  │  AuthService, DeptService, ModuleService,etc       │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                    │
├─────────────────────────────────────────────────────────────────┤
│                      Data Access Layer                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              TypeORM Repositories                        │   │
│  │  User  Department  Module  Role  AuditLog               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                    │
├─────────────────────────────────────────────────────────────────┤
│                   Database Layer (PostgreSQL)                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  users │ departments │ modules │ roles │ audit_logs      │   │
│  │        │ memberships │ permissions                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│           with RLS Policies (Department-scoped)                 │
└─────────────────────────────────────────────────────────────────┘
```

## Core Layers

### 1. Presentation Layer (React)

**Location**: `/apps/web/src`

**Components**:
- `App.tsx`: Root component with authentication state
- `Login.tsx`: Authentication form
- `Dashboard.tsx`: Main application interface
- `useAuth.ts`: Custom hook for auth state management

**Features**:
- JWT token management in localStorage
- Automatic token refresh on expiration
- Department context switching
- Module CRUD operations UI

**State Management**:
- Context-based auth state using custom hooks
- LocalStorage persistence for tokens and user info
- Optimistic UI updates for form submissions

### 2. API Layer (NestJS)

**Location**: `/apps/api/src`

**Core Modules**:

#### Auth Module
- Login/Register with password hashing (bcrypt)
- JWT token generation and validation
- Refresh token mechanism with token versioning
- Department switching endpoint
- Protected endpoints via `@UseGuards(JwtAuthGuard)`

#### Database Module
- TypeORM configuration
- Entity definitions
- Migration management
- Connection pooling

#### Departments Module
- Department data access
- RLS enforcement via `@UseGuards(DepartmentRlsGuard)`
- Department switching support

#### Modules Module
- Module CRUD operations
- Metadata management (JSONB)
- Optimistic concurrency control (version-based)
- Audit logging on all changes

#### Roles Module
- Role retrieval by department
- Permission checking
- Baseline role management

**Security Guards**:
```typescript
JwtAuthGuard: Validates JWT token from Authorization header
DepartmentRlsGuard: Ensures user has active department context
                   Sets departmentId on request for query filtering
```

### 3. Data Layer (TypeORM + PostgreSQL)

**Location**: `/apps/api/src/database`

**Entities**:
- `User`: User accounts with hashed passwords
- `Department`: Organization departments
- `UserDepartmentMembership`: User-department associations
- `Role`: Department-level roles with permissions array
- `Module`: Application modules with JSONB metadata
- `ModulePermission`: Role-module permission mapping
- `AuditLog`: Complete audit trail

**Database Features**:
- UUID primary keys for global uniqueness
- Timestamps on all entities (createdAt, updatedAt)
- Foreign key constraints with CASCADE deletion
- JSONB for flexible metadata
- Indexes on frequently queried columns
- Department scoping via WHERE clause filters

### 4. Shared Types Package

**Location**: `/packages/shared/src`

**Exports**:
- `PermissionType`: Enum for permission types
- `JwtPayload`: JWT token structure
- `RefreshTokenPayload`: Refresh token structure
- `AuthResponse`, `UserDto`, `DepartmentDto`: DTOs
- `ModuleDto`, `RoleDto`, `AuditLogDto`: Data transfer objects
- `ConflictError`: Custom error for version conflicts

## Authentication Flow

### Login Sequence

```
1. User submits credentials (email, password)
   ↓
2. API validates email exists and password matches
   ↓
3. Generate JWT access token (15min expiration)
   ↓
4. Generate refresh token (7day expiration) + store tokenVersion
   ↓
5. Return { accessToken, refreshToken, user }
   ↓
6. Frontend stores in localStorage
   ↓
7. Subsequent requests include Authorization: Bearer <accessToken>
```

### Token Refresh Flow

```
1. Access token expires or nearly expires
   ↓
2. Frontend sends POST /auth/refresh with refreshToken
   ↓
3. API validates refreshToken signature and tokenVersion
   ↓
4. Generate new accessToken with incremented tokenVersion
   ↓
5. Return new { accessToken, refreshToken }
```

### Department Switching

```
1. User selects department from sidebar
   ↓
2. Frontend calls POST /auth/switch-department
   ↓
3. API validates user has membership in department
   ↓
4. Update user.activeDepartmentId
   ↓
5. Generate new tokens with updated department context
   ↓
6. Frontend updates stored state and auth context
```

## Row Level Security Implementation

### Department-Scoped Queries

All protected endpoints include the `DepartmentRlsGuard` which:
1. Extracts `activeDepartmentId` from JWT payload
2. Validates it exists on request.user
3. Adds to request context for services

### Service Layer Enforcement

Services filter all queries by active department:
```typescript
// Example: Module queries
async findAll(departmentId: string): Promise<Module[]> {
  return this.moduleRepository.find({
    where: { departmentId },  // RLS enforcement
  });
}
```

### Database-Level Security

Future implementation can add PostgreSQL RLS policies:
```sql
CREATE POLICY dept_isolation ON modules
USING (department_id = CURRENT_SETTING('app.current_department_id'));
```

## Optimistic Concurrency Control

### Last-Write-Wins Strategy

Implemented via version numbers:

```typescript
// Update with version check
if (updateDto.version !== module.version) {
  throw new ConflictException('Version mismatch');
}

// Increment version on update
module.version += 1;
```

### Conflict Resolution

When a conflict occurs:
1. Client receives HTTP 409 Conflict status
2. Client refetches latest data
3. User re-applies changes against new version

## Permission System

### Permission Types

```typescript
enum PermissionType {
  CAN_VIEW = 'CAN_VIEW',              // Read access
  CAN_EDIT_ROWS = 'CAN_EDIT_ROWS',    // Modify data
  CAN_EDIT_SCHEMA = 'CAN_EDIT_SCHEMA',// Modify structure
  CAN_EXPORT = 'CAN_EXPORT',          // Export data
  ROW_LEVEL_SECURITY = 'ROW_LEVEL_SECURITY',  // Full RLS
}
```

### Role-Based Access

Roles assigned at department level:
- Each user has role(s) in each department
- Roles contain array of permissions
- Modules can have role-specific permissions

### Enforcement Points

Future guard implementation:
```typescript
@UseGuards(JwtAuthGuard, DepartmentRlsGuard, PermissionGuard)
@Post('modules')
createModule() { ... }
```

## Audit Logging

### What's Logged

Every CREATE, UPDATE, DELETE operation creates an AuditLog entry:

```typescript
{
  entityType: 'Module',
  entityId: uuid,
  action: 'UPDATE',
  userId: uuid,
  departmentId: uuid,
  changes: { field: { old, new } },
  createdAt: timestamp
}
```

### Access Control

Audit logs scoped by department - users only see their department's audit trail.

## Database Schema Design

### Core Relations

```
User (1:N) UserDepartmentMembership
Department (1:N) UserDepartmentMembership
UserDepartmentMembership (1:N) Role
Department (1:N) Role
Department (1:N) Module
Module (1:N) ModulePermission
Role (1:N) ModulePermission
```

### Key Design Decisions

- **UUID Keys**: Enables distributed generation
- **JSONB Metadata**: Allows extensible module configuration without schema changes
- **Array Columns**: PostgreSQL arrays for permission lists
- **Soft Deletes**: Not implemented - relies on FK constraints
- **Partitioning**: Not required at Phase 1 scale

## Error Handling

### Custom Exceptions

- `BadRequestException`: Input validation failures
- `UnauthorizedException`: Auth failures (invalid credentials, expired tokens)
- `ForbiddenException`: Authorization failures (department access denied)
- `NotFoundException`: Resource not found
- `ConflictException`: Version mismatch (optimistic lock)

### Response Format

All errors return consistent JSON:
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "BadRequest"
}
```

## Performance Considerations

### Indexing Strategy

Indexes created on:
- `users(email)`: Login lookups
- `users(activeDepartmentId)`: Active department filtering
- `user_department_memberships(userId, departmentId)`: Membership queries
- `modules(departmentId)`: Department module listing
- `audit_logs(departmentId, createdAt)`: Audit trail filtering

### Query Optimization

- Eager loading of relationships where needed
- Selective column retrieval for list endpoints
- Pagination ready (not yet implemented)

### Caching Opportunities

Future implementation:
- Redis cache for department data
- JWT claims caching
- Module metadata caching per department

## Deployment Architecture

### Development Environment
- Docker Compose for PostgreSQL
- Hot reload for API and Web
- Local file-based development

### Production Deployment
- Containerized API (Docker)
- Static frontend hosting (S3/CDN)
- Managed PostgreSQL (AWS RDS, Azure Database, etc.)
- Environment-based configuration

### Environment Separation

```
Development: npm run dev (all in one process)
Testing: npm test (with test database)
Staging: Containerized with staging DB
Production: Distributed with backup/failover
```

## Future Enhancements

### Phase 2
- Pagination and filtering on list endpoints
- Advanced search capabilities
- Bulk operations
- Webhook system for integrations

### Phase 3
- GraphQL API alongside REST
- Real-time updates (WebSockets)
- Advanced analytics dashboard
- Scheduled jobs system

### Phase 4
- Multi-tenancy isolation
- Custom role creation UI
- Plugin system for modules
- Mobile app support

## Security Best Practices

### Implemented
- ✅ Password hashing with bcrypt
- ✅ JWT token expiration
- ✅ CORS configuration
- ✅ Input validation with class-validator
- ✅ Department-level access control
- ✅ Audit logging

### To Implement
- 🔄 Rate limiting
- 🔄 SQL injection prevention (TypeORM handles)
- 🔄 XSS protection headers
- 🔄 CSRF token validation
- 🔄 HTTPS enforcement
- 🔄 Database encryption at rest
- 🔄 Sensitive data masking in logs

## Monitoring & Observability

### Current Logging
- Console logging in development
- Error stack traces

### Recommended Additions
- Structured logging (Winston/Pino)
- Request/response logging middleware
- Error tracking (Sentry)
- Performance monitoring (New Relic, Datadog)
- Database query logging
