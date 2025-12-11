# Phase 3: Task Management & Analytics Dashboard

A comprehensive NestJS-based backend system implementing task management with recurring tasks, automated rollover, and real-time analytics dashboards with RBAC/RLS.

## Features

### 1. Task Management System
- **Many-to-One Module Linking**: Tasks can be linked to any module record
- **Status Tracking**: TODO, IN_PROGRESS, COMPLETED, OVERDUE, CANCELLED
- **Due Dates & Assignees**: Full assignment and scheduling capabilities
- **Audit Trail**: Complete history of all task changes with timestamps and user tracking

### 2. Recurring Tasks Engine
- **Multiple Intervals**: Daily, Weekly, Monthly, and Custom recurrence patterns
- **Advanced Rules**: Support for complex rules like "every 3rd Friday"
- **Auto-Generation**: Automatically generates future task instances (up to 12 instances ahead)
- **Parent-Child Linking**: All recurring instances link back to the originating task

### 3. Daily Rollover Cron
- **Scheduled Execution**: Runs daily at midnight using NestJS Schedule
- **Overdue Detection**: Automatically marks tasks past due date as OVERDUE
- **Queue Management**: Pushes overdue tasks into the new day's queue
- **Audit Logging**: All rollover actions are logged in the audit trail

### 4. Analytics Dashboard
- **Pinned Metrics**: Users can pin header metrics from any module
- **Meta-Formulas**: Create formulas that reference multiple modules
- **Real-Time Updates**: Sub-2-second response time using cached aggregates
- **Client-Side Recalculation**: Instant filter changes without server round-trip
- **Cached Aggregates**: 5-minute cache duration with automatic expiration

### 5. Security
- **RBAC (Role-Based Access Control)**: Role-based permissions for all endpoints
- **RLS (Row-Level Security)**: Users can only access their own data or data assigned to them
- **JWT Authentication**: Secure token-based authentication
- **Admin Override**: Admin users have full access to all data

## Architecture

### Technology Stack
- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport
- **Scheduling**: @nestjs/schedule
- **Validation**: class-validator & class-transformer

### Project Structure
```
src/
├── tasks/
│   ├── entities/
│   │   └── task.entity.ts          # Task entity with audit trail
│   ├── dto/
│   │   ├── create-task.dto.ts      # Create task DTO
│   │   └── update-task.dto.ts      # Update task DTO
│   ├── services/
│   │   ├── task.service.ts         # Task business logic
│   │   └── task-scheduler.service.ts # Cron job for rollover
│   ├── controllers/
│   │   └── task.controller.ts      # Task REST endpoints
│   └── tasks.module.ts
├── dashboard/
│   ├── entities/
│   │   ├── dashboard.entity.ts     # Dashboard configuration
│   │   └── metric-cache.entity.ts  # Metric caching
│   ├── dto/
│   │   ├── create-dashboard.dto.ts
│   │   └── update-dashboard.dto.ts
│   ├── services/
│   │   └── dashboard.service.ts    # Dashboard logic & caching
│   ├── controllers/
│   │   └── dashboard.controller.ts # Dashboard REST endpoints
│   └── dashboard.module.ts
├── auth/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts       # JWT authentication guard
│   │   └── roles.guard.ts          # RBAC guard
│   ├── decorators/
│   │   └── roles.decorator.ts      # @Roles() decorator
│   ├── strategies/
│   │   └── jwt.strategy.ts         # JWT validation strategy
│   └── auth.module.ts
├── config/
│   └── database.config.ts          # Database configuration
├── app.module.ts                    # Root module
└── main.ts                          # Application entry point
```

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your database credentials
```

## Database Setup

```bash
# Create PostgreSQL database
createdb shams_db

# The application will auto-sync tables in development mode
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm start
```

## API Endpoints

### Tasks

#### Create Task
```http
POST /tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Complete project documentation",
  "description": "Write comprehensive README",
  "dueDate": "2024-12-31T23:59:59Z",
  "assigneeId": "uuid",
  "moduleType": "project",
  "moduleRecordId": "project-123",
  "isRecurring": true,
  "recurrenceInterval": "weekly",
  "recurrenceRule": {
    "every": 1
  }
}
```

#### Get All Tasks
```http
GET /tasks
Authorization: Bearer <token>
```

#### Get Task by ID
```http
GET /tasks/:id
Authorization: Bearer <token>
```

#### Get Tasks by Module
```http
GET /tasks/module/:moduleType/:moduleRecordId
Authorization: Bearer <token>
```

#### Update Task
```http
PATCH /tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed"
}
```

#### Delete Task
```http
DELETE /tasks/:id
Authorization: Bearer <token>
```

### Dashboards

#### Create Dashboard
```http
POST /dashboards
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Project Overview",
  "description": "Main project dashboard",
  "pinnedMetrics": [
    {
      "id": "tasks_total",
      "name": "Total Tasks",
      "formula": "COUNT(*)",
      "moduleType": "tasks",
      "position": 1
    }
  ],
  "metaFormulas": {
    "completion_rate": {
      "formula": "(tasks_completed / tasks_total) * 100",
      "dependencies": ["tasks_completed", "tasks_total"],
      "cacheDuration": 5
    }
  }
}
```

#### Get All Dashboards
```http
GET /dashboards
Authorization: Bearer <token>
```

#### Get Dashboard by ID
```http
GET /dashboards/:id
Authorization: Bearer <token>
```

#### Get Dashboard Metrics
```http
GET /dashboards/:id/metrics?filters={"status":"completed"}
Authorization: Bearer <token>
```

#### Update Dashboard
```http
PATCH /dashboards/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Dashboard Name"
}
```

#### Delete Dashboard
```http
DELETE /dashboards/:id
Authorization: Bearer <token>
```

## Recurring Task Rules

### Daily Recurrence
```json
{
  "isRecurring": true,
  "recurrenceInterval": "daily",
  "recurrenceRule": {
    "every": 1
  }
}
```

### Weekly Recurrence
```json
{
  "isRecurring": true,
  "recurrenceInterval": "weekly",
  "recurrenceRule": {
    "every": 2
  }
}
```

### Monthly Recurrence
```json
{
  "isRecurring": true,
  "recurrenceInterval": "monthly",
  "recurrenceRule": {
    "every": 1
  }
}
```

### Custom Recurrence (e.g., every 3rd Friday)
```json
{
  "isRecurring": true,
  "recurrenceInterval": "custom",
  "recurrenceRule": {
    "weekOfMonth": 3,
    "dayOfWeek": 5
  }
}
```

## Cron Jobs

### Daily Rollover
- **Schedule**: Every day at midnight (00:00:00)
- **Actions**:
  1. Marks all tasks past due date as OVERDUE
  2. Resets overdue tasks to TODO status
  3. Updates due dates to current date
  4. Logs all changes in audit trail

## Security Implementation

### RBAC (Role-Based Access Control)
```typescript
// Protecting endpoints with roles
@Roles('admin', 'manager')
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('/admin-only')
adminEndpoint() {
  // Only admins and managers can access
}
```

### RLS (Row-Level Security)
- Users can only view/edit tasks they created or are assigned to
- Admin users can view all tasks
- Dashboard data respects user permissions

## Performance Optimization

### Caching Strategy
- **Metric Cache**: 5-minute TTL for dashboard metrics
- **Database Indexing**: Composite indexes on frequently queried fields
- **Lazy Loading**: Related entities loaded on demand

### Real-Time Updates
- Server calculates base metrics
- Client-side recalculation for filter changes
- Sub-2-second response time achieved through:
  - Cached aggregates
  - Efficient queries
  - Minimal data transfer

## Development Guidelines

### Adding New Module Integration
1. Ensure module records have unique IDs
2. Use consistent naming for moduleType
3. Implement permission checks in task service

### Creating Custom Formulas
```typescript
// Example meta-formula
{
  "formula": "(metric1 + metric2) / metric3",
  "dependencies": ["metric1", "metric2", "metric3"],
  "cacheDuration": 5
}
```

## Environment Variables

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=shams_db
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=24h
PORT=3000
NODE_ENV=development
```

## Testing

```bash
# Unit tests (to be implemented)
npm test

# E2E tests (to be implemented)
npm run test:e2e
```

## Deployment

### Production Checklist
- [ ] Update JWT_SECRET in production environment
- [ ] Set NODE_ENV=production
- [ ] Disable TypeORM synchronize
- [ ] Set up database migrations
- [ ] Configure CORS for production domains
- [ ] Set up SSL/TLS certificates
- [ ] Configure logging and monitoring
- [ ] Set up backup and recovery procedures

### Docker Deployment (Optional)
```dockerfile
# Example Dockerfile structure
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/main.js"]
```

## License

ISC

## Support

For issues or questions, please create an issue in the repository.
