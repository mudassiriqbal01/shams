# Database Schema Documentation

## Overview
This document describes the database schema for the Phase 3 Task Management and Dashboard system.

## Tables

### tasks
Stores all task records with support for recurring tasks and audit trails.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| title | varchar | No | Task title |
| description | text | Yes | Detailed task description |
| status | enum | No | Current status (todo, in_progress, completed, overdue, cancelled) |
| dueDate | timestamp | Yes | When the task is due |
| assigneeId | varchar | Yes | User assigned to the task |
| createdById | varchar | Yes | User who created the task |
| moduleType | varchar | No | Type of module this task is linked to |
| moduleRecordId | varchar | No | ID of the record in the linked module |
| isRecurring | boolean | No | Whether this is a recurring task |
| recurrenceInterval | enum | No | Interval type (none, daily, weekly, monthly, custom) |
| recurrenceRule | jsonb | Yes | JSON rules for recurrence |
| parentTaskId | uuid | Yes | Reference to parent task if this is a recurring instance |
| completedAt | timestamp | Yes | When the task was completed |
| completedById | varchar | Yes | User who completed the task |
| auditTrail | jsonb | No | Array of audit log entries |
| createdAt | timestamp | No | Record creation timestamp |
| updatedAt | timestamp | No | Record last update timestamp |
| isDeleted | boolean | No | Soft delete flag |

**Indexes:**
- Primary key on `id`
- Index on `moduleType, moduleRecordId` for module lookups
- Index on `assigneeId` for user task queries
- Index on `dueDate` for rollover queries
- Index on `parentTaskId` for recurring task chains

**Foreign Keys:**
- `parentTaskId` references `tasks(id)`

### dashboards
Stores dashboard configurations and metric definitions.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| name | varchar | No | Dashboard name |
| description | text | Yes | Dashboard description |
| userId | varchar | No | Owner of the dashboard |
| pinnedMetrics | jsonb | No | Array of pinned metric definitions |
| metaFormulas | jsonb | No | Object containing meta-formula definitions |
| filters | jsonb | No | Default filters for the dashboard |
| isActive | boolean | No | Whether dashboard is active |
| createdAt | timestamp | No | Record creation timestamp |
| updatedAt | timestamp | No | Record last update timestamp |

**Indexes:**
- Primary key on `id`
- Index on `userId` for user dashboard queries
- Index on `isActive` for active dashboard filtering

### metric_cache
Caches calculated metrics for performance optimization.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| moduleType | varchar | No | Type of module this metric is for |
| metricKey | varchar | No | Unique identifier for the metric |
| value | jsonb | No | Cached metric value |
| filters | jsonb | No | Filters used when calculating this metric |
| expiresAt | timestamp | No | When this cache entry expires |
| createdAt | timestamp | No | Record creation timestamp |
| updatedAt | timestamp | No | Record last update timestamp |

**Indexes:**
- Primary key on `id`
- Composite index on `moduleType, metricKey` for cache lookups
- Index on `expiresAt` for cleanup queries

## Relationships

### tasks.parentTaskId → tasks.id
- Type: Self-referential Many-to-One
- Purpose: Links recurring task instances to their parent task
- Cascade: None (preserve history even if parent is deleted)

## Data Types

### TaskStatus Enum
- `todo`: Task not yet started
- `in_progress`: Task is being worked on
- `completed`: Task finished successfully
- `overdue`: Task past due date
- `cancelled`: Task was cancelled

### RecurrenceInterval Enum
- `none`: Not a recurring task
- `daily`: Recurs daily
- `weekly`: Recurs weekly
- `monthly`: Recurs monthly
- `custom`: Custom recurrence pattern

## JSONB Structures

### tasks.auditTrail
```json
[
  {
    "timestamp": "2024-01-01T12:00:00Z",
    "userId": "user-123",
    "action": "created|updated|deleted|rollover|generated_recurring",
    "changes": {
      "field": "new value"
    }
  }
]
```

### tasks.recurrenceRule
```json
{
  "every": 1,
  "weekOfMonth": 3,
  "dayOfWeek": 5
}
```

### dashboards.pinnedMetrics
```json
[
  {
    "id": "metric_id",
    "name": "Metric Name",
    "formula": "COUNT(*)",
    "moduleType": "tasks",
    "position": 1
  }
]
```

### dashboards.metaFormulas
```json
{
  "formula_key": {
    "formula": "(metric1 + metric2) / 100",
    "dependencies": ["metric1", "metric2"],
    "cacheDuration": 5
  }
}
```

## Query Optimization

### Frequent Query Patterns

1. **Get user's tasks**
   ```sql
   SELECT * FROM tasks 
   WHERE (assigneeId = ? OR createdById = ?) 
   AND isDeleted = false;
   ```

2. **Find overdue tasks**
   ```sql
   SELECT * FROM tasks 
   WHERE dueDate < NOW() 
   AND status IN ('todo', 'in_progress') 
   AND isDeleted = false;
   ```

3. **Get tasks for module record**
   ```sql
   SELECT * FROM tasks 
   WHERE moduleType = ? 
   AND moduleRecordId = ? 
   AND isDeleted = false;
   ```

4. **Get cached metric**
   ```sql
   SELECT * FROM metric_cache 
   WHERE moduleType = ? 
   AND metricKey = ? 
   AND expiresAt > NOW() 
   ORDER BY createdAt DESC 
   LIMIT 1;
   ```

## Maintenance

### Cache Cleanup
Regular cleanup of expired cache entries should be performed:
```sql
DELETE FROM metric_cache WHERE expiresAt < NOW();
```

### Soft Delete Cleanup
Periodically clean up old soft-deleted records:
```sql
DELETE FROM tasks 
WHERE isDeleted = true 
AND updatedAt < NOW() - INTERVAL '90 days';
```

## Backup Strategy

1. **Daily Backups**: Full database backup at 2 AM
2. **Point-in-Time Recovery**: WAL archiving enabled
3. **Retention**: Keep 30 days of daily backups
4. **Testing**: Monthly restore testing

## Migration Strategy

1. Use TypeORM migrations for schema changes
2. Test migrations in development first
3. Create rollback scripts for each migration
4. Backup before production migrations
5. Run migrations during maintenance windows

## Security

### Row-Level Security
Implement RLS policies ensuring:
- Users can only see their own dashboards
- Tasks are visible only to assignee/creator or admins
- Metric cache respects user permissions

### Data Encryption
- Sensitive fields should be encrypted at rest
- Use SSL for database connections
- Regularly rotate encryption keys
