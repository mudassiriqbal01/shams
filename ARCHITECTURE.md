# Architecture Documentation

## System Overview

This is a Phase 3 implementation of a Task Management and Analytics Dashboard system built with NestJS. The system provides:

1. **Task Management** with recurring task support
2. **Automated Task Rollover** via daily cron jobs
3. **Analytics Dashboard** with real-time metrics
4. **RBAC and RLS** security implementation

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (Web/Mobile Apps, External Services)                       │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST
                      │ JWT Authentication
┌─────────────────────▼───────────────────────────────────────┐
│                    API Gateway Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Task API   │  │ Dashboard API│  │  Auth Guard  │      │
│  │              │  │              │  │              │      │
│  │ Controllers  │  │ Controllers  │  │   JWT +      │      │
│  │              │  │              │  │   RBAC       │      │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘      │
└─────────┼──────────────────┼──────────────────────────────────┘
          │                  │
┌─────────▼──────────────────▼──────────────────────────────────┐
│                   Business Logic Layer                         │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Task Service                                │  │
│  │  • CRUD operations                                       │  │
│  │  • Recurring task generation                            │  │
│  │  • RLS implementation                                    │  │
│  │  • Audit trail management                               │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │         Dashboard Service                                │  │
│  │  • Metric calculation                                    │  │
│  │  • Meta-formula evaluation                              │  │
│  │  • Cache management                                      │  │
│  │  • Cross-module aggregation                             │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │      Task Scheduler Service                              │  │
│  │  • Daily rollover cron                                   │  │
│  │  • Overdue task detection                               │  │
│  │  • Task queue management                                │  │
│  └─────────────────────────────────────────────────────────┘  │
└────────────────────────┬──────────────────────────────────────┘
                         │
┌────────────────────────▼──────────────────────────────────────┐
│                   Data Access Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Task Entity  │  │   Dashboard  │  │ Metric Cache │        │
│  │              │  │    Entity    │  │    Entity    │        │
│  │  TypeORM     │  │   TypeORM    │  │   TypeORM    │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
└─────────┼──────────────────┼──────────────────┼────────────────┘
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼────────────────┐
│                    PostgreSQL Database                          │
│                                                                 │
│  Tables: tasks, dashboards, metric_cache                       │
│  Indexes: module lookups, assignee, due date, cache keys       │
│  Features: JSONB columns, row-level security                   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Controllers Layer

#### TaskController
- **Responsibility**: HTTP endpoint handling for task operations
- **Routes**:
  - `POST /tasks` - Create task
  - `GET /tasks` - Get all tasks (filtered by user)
  - `GET /tasks/:id` - Get single task
  - `GET /tasks/module/:type/:id` - Get tasks by module
  - `PATCH /tasks/:id` - Update task
  - `DELETE /tasks/:id` - Soft delete task
- **Security**: Protected by JwtAuthGuard and RolesGuard

#### DashboardController
- **Responsibility**: HTTP endpoint handling for dashboard operations
- **Routes**:
  - `POST /dashboards` - Create dashboard
  - `GET /dashboards` - Get all dashboards
  - `GET /dashboards/:id` - Get single dashboard
  - `GET /dashboards/:id/metrics` - Get calculated metrics
  - `PATCH /dashboards/:id` - Update dashboard
  - `DELETE /dashboards/:id` - Soft delete dashboard
- **Security**: Protected by JwtAuthGuard and RolesGuard

#### HealthController
- **Responsibility**: Health check endpoint
- **Routes**:
  - `GET /health` - System health status
- **Security**: Public endpoint

### 2. Service Layer

#### TaskService
**Core Responsibilities**:
- Task CRUD operations with audit trail
- Row-level security enforcement
- Recurring task instance generation
- Module record linkage

**Key Methods**:
```typescript
create(dto, userId): Promise<Task>
findAll(userId, roles): Promise<Task[]>
findOne(id, userId, roles): Promise<Task>
update(id, dto, userId, roles): Promise<Task>
remove(id, userId, roles): Promise<void>
markOverdueTasks(): Promise<number>
rolloverTasks(): Promise<void>
generateRecurringInstances(task, userId): Promise<void>
calculateNextOccurrence(date, interval, rule): Date
```

**RLS Implementation**:
- Non-admin users: See only tasks they created or are assigned to
- Admin users: See all tasks
- Enforced at query level using QueryBuilder

#### DashboardService
**Core Responsibilities**:
- Dashboard configuration management
- Metric calculation and caching
- Meta-formula evaluation
- Cross-module data aggregation

**Key Methods**:
```typescript
create(dto, userId): Promise<Dashboard>
findAll(userId, roles): Promise<Dashboard[]>
findOne(id, userId, roles): Promise<Dashboard>
update(id, dto, userId, roles): Promise<Dashboard>
getMetrics(dashboardId, userId, roles, filters): Promise<any>
getCachedMetric(moduleType, key, filters): Promise<any>
cacheMetric(moduleType, key, value, filters): Promise<void>
calculateMetric(metric, filters, userId, roles): Promise<any>
evaluateMetaFormula(formula, metrics): any
```

**Caching Strategy**:
- Default 5-minute TTL for metric cache
- Configurable per meta-formula
- Expired cache entries automatically cleaned

#### TaskSchedulerService
**Core Responsibilities**:
- Daily cron job execution
- Overdue task marking
- Task rollover to new day

**Cron Schedule**:
```typescript
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
handleDailyRollover()
```

**Rollover Logic**:
1. Identify tasks past due date with status TODO or IN_PROGRESS
2. Update status to OVERDUE
3. Roll overdue tasks into current day's queue
4. Update due dates
5. Log all actions in audit trail

### 3. Entity Layer

#### Task Entity
**Fields**:
- `id`: UUID primary key
- `title`: Task title
- `description`: Detailed description
- `status`: Enum (todo, in_progress, completed, overdue, cancelled)
- `dueDate`: Timestamp
- `assigneeId`: User assigned
- `createdById`: Creator user
- `moduleType`: Type of linked module
- `moduleRecordId`: ID in linked module
- `isRecurring`: Boolean flag
- `recurrenceInterval`: Enum (none, daily, weekly, monthly, custom)
- `recurrenceRule`: JSONB with recurrence rules
- `parentTaskId`: Self-reference for recurring instances
- `completedAt`: Completion timestamp
- `completedById`: Completing user
- `auditTrail`: JSONB array of audit entries
- `createdAt`: Creation timestamp
- `updatedAt`: Update timestamp
- `isDeleted`: Soft delete flag

**Relationships**:
- Self-referential: parentTask (Many-to-One)

#### Dashboard Entity
**Fields**:
- `id`: UUID primary key
- `name`: Dashboard name
- `description`: Dashboard description
- `userId`: Owner
- `pinnedMetrics`: JSONB array of metric definitions
- `metaFormulas`: JSONB object with formula definitions
- `filters`: JSONB default filters
- `isActive`: Active flag
- `createdAt`: Creation timestamp
- `updatedAt`: Update timestamp

#### MetricCache Entity
**Fields**:
- `id`: UUID primary key
- `moduleType`: Module type
- `metricKey`: Metric identifier
- `value`: JSONB cached value
- `filters`: JSONB filters used
- `expiresAt`: Expiration timestamp
- `createdAt`: Creation timestamp
- `updatedAt`: Update timestamp

**Indexes**:
- Composite index on (moduleType, metricKey)
- Index on expiresAt for cleanup

### 4. Authentication & Authorization

#### JWT Strategy
- Uses passport-jwt
- Validates tokens from Authorization header
- Extracts user information (id, username, roles)

#### JwtAuthGuard
- Protects routes requiring authentication
- Returns 401 for missing/invalid tokens

#### RolesGuard
- Protects routes requiring specific roles
- Uses @Roles() decorator
- Returns 403 for insufficient permissions

#### Row-Level Security
Implemented in service layer:
```typescript
// Non-admin query
if (!userRoles.includes('admin')) {
  query.andWhere(
    '(task.assigneeId = :userId OR task.createdById = :userId)',
    { userId }
  );
}
```

## Data Flow Examples

### Example 1: Create Recurring Task

```
1. Client sends POST /tasks with isRecurring=true
2. JwtAuthGuard validates token
3. RolesGuard checks permissions
4. TaskController receives request
5. TaskService.create():
   a. Creates task entity
   b. Adds audit trail entry
   c. Saves to database
   d. If recurring, calls generateRecurringInstances()
   e. Generates 12 future instances
   f. Links instances to parent via parentTaskId
6. Returns created task with all instances
```

### Example 2: Daily Rollover Cron

```
1. Cron triggers at midnight (00:00:00)
2. TaskSchedulerService.handleDailyRollover()
3. TaskService.markOverdueTasks():
   a. Queries tasks with dueDate < now
   b. Updates status to OVERDUE
4. TaskService.rolloverTasks():
   a. Queries tasks with status=OVERDUE
   b. Updates dueDate to current date
   c. Changes status back to TODO
   d. Adds audit trail entry
5. Logs completion with count
```

### Example 3: Get Dashboard Metrics

```
1. Client sends GET /dashboards/:id/metrics?filters={...}
2. Authentication & authorization checks
3. DashboardController receives request
4. DashboardService.getMetrics():
   a. Validates dashboard access (RLS)
   b. For each pinned metric:
      - Check cache (getCachedMetric)
      - If expired, calculate fresh (calculateMetric)
      - Store in cache for 5 minutes
   c. Evaluate meta-formulas using cached values
   d. Return complete metrics object
5. Response sent to client (< 2 seconds)
```

## Performance Considerations

### Database Optimization
1. **Indexes**:
   - `(moduleType, moduleRecordId)` for module lookups
   - `assigneeId` for user task queries
   - `dueDate` for rollover queries
   - `(moduleType, metricKey)` for cache lookups

2. **Query Optimization**:
   - Use QueryBuilder for complex queries
   - Limit joins to necessary relations
   - Paginate large result sets (future enhancement)

### Caching Strategy
1. **Metric Cache**:
   - 5-minute default TTL
   - Configurable per formula
   - Automatic cleanup of expired entries

2. **Client-Side Recalculation**:
   - Meta-formulas evaluated client-side when filters change
   - Reduces server load
   - Achieves < 2s response time

### Scalability
1. **Horizontal Scaling**:
   - Stateless API design
   - Session data in JWT (no server state)
   - Can run multiple instances behind load balancer

2. **Database Connection Pooling**:
   - TypeORM handles connection pool
   - Configurable pool size

3. **Future Enhancements**:
   - Redis for distributed caching
   - Message queue for async task generation
   - Read replicas for dashboard queries

## Security Architecture

### Authentication Flow
```
1. User logs in (external auth service)
2. Receives JWT token with claims:
   - sub: user ID
   - username: username
   - roles: array of roles
   - exp: expiration
3. Includes token in Authorization header
4. JwtStrategy validates and extracts payload
5. Request.user populated with user info
```

### Authorization Levels
1. **Public**: Health check
2. **Authenticated**: All task and dashboard endpoints
3. **Role-Based**: Admin-only operations (future)
4. **Row-Level**: Data filtered by ownership/assignment

### Security Best Practices
- JWT secrets stored in environment variables
- Passwords hashed with bcrypt (if user management added)
- Input validation with class-validator
- SQL injection prevention via TypeORM
- XSS prevention via proper escaping
- CORS configured for specific origins

## Error Handling

### Exception Hierarchy
```
HttpException (base)
├── BadRequestException (400)
├── UnauthorizedException (401)
├── ForbiddenException (403)
├── NotFoundException (404)
└── InternalServerErrorException (500)
```

### Error Response Format
```json
{
  "statusCode": 404,
  "timestamp": "2024-12-01T10:00:00Z",
  "path": "/tasks/invalid-id",
  "message": "Task with ID invalid-id not found"
}
```

### Global Exception Filter
- Catches all unhandled exceptions
- Logs errors
- Returns consistent error format
- Hides internal details in production

## Testing Strategy

### Unit Tests
- Service layer logic
- Recurring task calculations
- Meta-formula evaluation
- Mock TypeORM repositories

### Integration Tests (Future)
- API endpoint testing
- Database integration
- Authentication flow
- RBAC/RLS enforcement

### E2E Tests (Future)
- Complete user workflows
- Cron job execution
- Dashboard metric calculation

## Deployment Architecture

### Development
```
Developer Machine
├── Node.js 18+
├── PostgreSQL (local)
├── TypeScript compiler
└── ts-node for hot reload
```

### Production
```
Load Balancer
├── App Server 1 (PM2 cluster)
├── App Server 2 (PM2 cluster)
└── App Server N (PM2 cluster)
     │
     └── PostgreSQL (RDS/managed)
         ├── Primary
         └── Read Replica (future)
```

### Docker Deployment
```
Docker Compose
├── PostgreSQL Container
└── API Container
    ├── Multi-stage build
    ├── Production dependencies only
    └── Health checks enabled
```

## Monitoring & Observability

### Logging
- Structured logging with Winston (future enhancement)
- Log levels: debug, info, warn, error
- Context propagation (request ID)

### Metrics (Future)
- Request rate
- Response time
- Error rate
- Active tasks count
- Cache hit rate
- Database query performance

### Health Checks
- `/health` endpoint
- Database connectivity
- Memory usage
- Uptime

### Alerting (Future)
- High error rate
- Slow response times
- Database connection failures
- Failed cron jobs

## Future Enhancements

### Phase 4 Considerations
1. **Advanced Recurring Rules**:
   - Business day handling
   - Holiday exclusions
   - Custom calendars

2. **Task Dependencies**:
   - Predecessor/successor relationships
   - Gantt chart support
   - Critical path calculation

3. **Notifications**:
   - Email notifications
   - Push notifications
   - Webhook integrations

4. **Advanced Dashboard**:
   - Custom chart types
   - Drill-down capabilities
   - Export to PDF/Excel
   - Scheduled reports

5. **Collaboration**:
   - Task comments
   - File attachments
   - @mentions
   - Activity feed

6. **Mobile API**:
   - Optimized endpoints
   - Offline support
   - Push notification handling

7. **Performance**:
   - Redis caching layer
   - GraphQL API option
   - WebSocket for real-time updates
   - Database sharding

## Conclusion

This architecture provides a solid foundation for task management and analytics with:
- Clear separation of concerns
- Scalable design patterns
- Security built-in from the start
- Performance optimization strategies
- Extensibility for future features

The modular NestJS structure allows for easy addition of new features while maintaining code quality and testability.
