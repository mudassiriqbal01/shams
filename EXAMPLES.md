# Usage Examples

This document provides practical examples for using the Task Management and Dashboard API.

## Table of Contents
1. [Authentication Setup](#authentication-setup)
2. [Task Management Examples](#task-management-examples)
3. [Recurring Tasks Examples](#recurring-tasks-examples)
4. [Dashboard Examples](#dashboard-examples)
5. [Advanced Use Cases](#advanced-use-cases)

---

## Authentication Setup

For these examples, you'll need a JWT token. In a real implementation, you would obtain this from your authentication endpoint.

```bash
# Example JWT token (replace with actual token from your auth system)
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Task Management Examples

### Example 1: Create a Simple Task

Create a basic task linked to a project:

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Review pull request #42",
    "description": "Review and approve the authentication feature PR",
    "dueDate": "2024-12-20T17:00:00Z",
    "assigneeId": "user-123",
    "moduleType": "project",
    "moduleRecordId": "proj-001",
    "status": "todo"
  }'
```

Response:
```json
{
  "id": "task-uuid-123",
  "title": "Review pull request #42",
  "status": "todo",
  "dueDate": "2024-12-20T17:00:00Z",
  "assigneeId": "user-123",
  "createdById": "current-user-id",
  "moduleType": "project",
  "moduleRecordId": "proj-001",
  "auditTrail": [
    {
      "timestamp": "2024-12-01T10:00:00Z",
      "userId": "current-user-id",
      "action": "created",
      "changes": {...}
    }
  ],
  "createdAt": "2024-12-01T10:00:00Z"
}
```

### Example 2: Get All Tasks for Current User

```bash
curl -X GET http://localhost:3000/tasks \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Example 3: Get Tasks for a Specific Module

Retrieve all tasks linked to a specific project:

```bash
curl -X GET http://localhost:3000/tasks/module/project/proj-001 \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Example 4: Update Task Status

Mark a task as in progress:

```bash
curl -X PATCH http://localhost:3000/tasks/task-uuid-123 \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }'
```

### Example 5: Complete a Task

```bash
curl -X PATCH http://localhost:3000/tasks/task-uuid-123 \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

The system automatically sets `completedAt` and `completedById` when status changes to completed.

---

## Recurring Tasks Examples

### Example 6: Daily Standup Meeting

Create a task that recurs every weekday:

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Daily Standup Meeting",
    "description": "Team sync meeting",
    "dueDate": "2024-12-02T09:00:00Z",
    "assigneeId": "team-lead-id",
    "moduleType": "team",
    "moduleRecordId": "team-001",
    "isRecurring": true,
    "recurrenceInterval": "daily",
    "recurrenceRule": {
      "every": 1
    }
  }'
```

This creates the initial task plus 12 future instances automatically.

### Example 7: Weekly Sprint Planning

Task that recurs every 2 weeks:

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sprint Planning",
    "description": "Plan the next sprint",
    "dueDate": "2024-12-02T10:00:00Z",
    "assigneeId": "product-manager-id",
    "moduleType": "project",
    "moduleRecordId": "proj-001",
    "isRecurring": true,
    "recurrenceInterval": "weekly",
    "recurrenceRule": {
      "every": 2
    }
  }'
```

### Example 8: Monthly Report

Task that recurs on the 1st of every month:

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Monthly Status Report",
    "description": "Prepare and submit monthly progress report",
    "dueDate": "2024-12-01T17:00:00Z",
    "assigneeId": "manager-id",
    "moduleType": "project",
    "moduleRecordId": "proj-001",
    "isRecurring": true,
    "recurrenceInterval": "monthly",
    "recurrenceRule": {
      "every": 1
    }
  }'
```

### Example 9: Custom Recurrence - Every 3rd Friday

Board meeting on the 3rd Friday of each month:

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Board Meeting",
    "description": "Monthly board meeting",
    "dueDate": "2024-12-20T14:00:00Z",
    "assigneeId": "ceo-id",
    "moduleType": "company",
    "moduleRecordId": "company-001",
    "isRecurring": true,
    "recurrenceInterval": "custom",
    "recurrenceRule": {
      "weekOfMonth": 3,
      "dayOfWeek": 5
    }
  }'
```

Note: `dayOfWeek` uses JavaScript convention (0=Sunday, 5=Friday)

---

## Dashboard Examples

### Example 10: Create Project Overview Dashboard

```bash
curl -X POST http://localhost:3000/dashboards \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Project Overview",
    "description": "Main dashboard for project metrics",
    "pinnedMetrics": [
      {
        "id": "total_tasks",
        "name": "Total Tasks",
        "formula": "COUNT(*)",
        "moduleType": "tasks",
        "position": 1
      },
      {
        "id": "completed_tasks",
        "name": "Completed Tasks",
        "formula": "COUNT(*) WHERE status=completed",
        "moduleType": "tasks",
        "position": 2
      },
      {
        "id": "overdue_tasks",
        "name": "Overdue Tasks",
        "formula": "COUNT(*) WHERE status=overdue",
        "moduleType": "tasks",
        "position": 3
      }
    ],
    "metaFormulas": {
      "completion_rate": {
        "formula": "(completed_tasks / total_tasks) * 100",
        "dependencies": ["completed_tasks", "total_tasks"],
        "cacheDuration": 5
      },
      "overdue_percentage": {
        "formula": "(overdue_tasks / total_tasks) * 100",
        "dependencies": ["overdue_tasks", "total_tasks"],
        "cacheDuration": 5
      }
    },
    "filters": {
      "dateRange": "last_30_days"
    }
  }'
```

### Example 11: Get Dashboard Metrics

Retrieve calculated metrics for a dashboard:

```bash
curl -X GET "http://localhost:3000/dashboards/dashboard-uuid-123/metrics" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

Response:
```json
{
  "dashboardId": "dashboard-uuid-123",
  "metrics": {
    "total_tasks": {
      "value": 150,
      "label": "Total Tasks",
      "timestamp": "2024-12-01T10:00:00Z"
    },
    "completed_tasks": {
      "value": 120,
      "label": "Completed Tasks",
      "timestamp": "2024-12-01T10:00:00Z"
    },
    "overdue_tasks": {
      "value": 5,
      "label": "Overdue Tasks",
      "timestamp": "2024-12-01T10:00:00Z"
    },
    "completion_rate": {
      "value": 80,
      "formula": "(completed_tasks / total_tasks) * 100",
      "timestamp": "2024-12-01T10:00:00Z"
    },
    "overdue_percentage": {
      "value": 3.33,
      "formula": "(overdue_tasks / total_tasks) * 100",
      "timestamp": "2024-12-01T10:00:00Z"
    }
  },
  "lastUpdated": "2024-12-01T10:00:00Z"
}
```

### Example 12: Get Metrics with Filters

Get metrics filtered by specific criteria:

```bash
curl -X GET "http://localhost:3000/dashboards/dashboard-uuid-123/metrics?filters=%7B%22status%22%3A%22completed%22%2C%22assigneeId%22%3A%22user-123%22%7D" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

URL decoded filters: `{"status":"completed","assigneeId":"user-123"}`

### Example 13: Update Dashboard

Add new metrics to existing dashboard:

```bash
curl -X PATCH http://localhost:3000/dashboards/dashboard-uuid-123 \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pinnedMetrics": [
      {
        "id": "total_tasks",
        "name": "Total Tasks",
        "formula": "COUNT(*)",
        "moduleType": "tasks",
        "position": 1
      },
      {
        "id": "in_progress_tasks",
        "name": "In Progress",
        "formula": "COUNT(*) WHERE status=in_progress",
        "moduleType": "tasks",
        "position": 2
      }
    ]
  }'
```

---

## Advanced Use Cases

### Example 14: Multi-Module Dashboard

Create a dashboard that pulls metrics from multiple modules:

```bash
curl -X POST http://localhost:3000/dashboards \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Executive Dashboard",
    "description": "High-level metrics across all modules",
    "pinnedMetrics": [
      {
        "id": "total_projects",
        "name": "Total Projects",
        "formula": "COUNT(*)",
        "moduleType": "projects",
        "position": 1
      },
      {
        "id": "total_tasks",
        "name": "Total Tasks",
        "formula": "COUNT(*)",
        "moduleType": "tasks",
        "position": 2
      },
      {
        "id": "total_customers",
        "name": "Total Customers",
        "formula": "COUNT(*)",
        "moduleType": "customers",
        "position": 3
      }
    ],
    "metaFormulas": {
      "tasks_per_project": {
        "formula": "total_tasks / total_projects",
        "dependencies": ["total_tasks", "total_projects"],
        "cacheDuration": 10
      },
      "projects_per_customer": {
        "formula": "total_projects / total_customers",
        "dependencies": ["total_projects", "total_customers"],
        "cacheDuration": 10
      }
    }
  }'
```

### Example 15: Task Assignment Workflow

Complete workflow for task assignment and tracking:

```bash
# 1. Create task
TASK_ID=$(curl -s -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement new feature",
    "description": "Add user profile functionality",
    "dueDate": "2024-12-15T17:00:00Z",
    "assigneeId": "developer-123",
    "moduleType": "project",
    "moduleRecordId": "proj-001"
  }' | jq -r '.id')

# 2. Start work on task
curl -X PATCH http://localhost:3000/tasks/$TASK_ID \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'

# 3. Update with progress notes
curl -X PATCH http://localhost:3000/tasks/$TASK_ID \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Add user profile functionality\n\nProgress: Database schema created, working on API endpoints"
  }'

# 4. Complete task
curl -X PATCH http://localhost:3000/tasks/$TASK_ID \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'

# 5. View task history
curl -X GET http://localhost:3000/tasks/$TASK_ID \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Example 16: Bulk Task Creation for Sprint

Create multiple tasks for a sprint:

```bash
#!/bin/bash

SPRINT_TASKS=(
  "Setup development environment"
  "Create database models"
  "Implement API endpoints"
  "Write unit tests"
  "Deploy to staging"
)

for task in "${SPRINT_TASKS[@]}"; do
  curl -X POST http://localhost:3000/tasks \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"title\": \"$task\",
      \"moduleType\": \"sprint\",
      \"moduleRecordId\": \"sprint-2024-12\",
      \"assigneeId\": \"team-lead-id\"
    }"
  echo ""
done
```

### Example 17: Performance Tracking Dashboard

Dashboard focused on team performance:

```bash
curl -X POST http://localhost:3000/dashboards \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Team Performance",
    "description": "Track team productivity and efficiency",
    "pinnedMetrics": [
      {
        "id": "tasks_completed_this_week",
        "name": "Tasks Completed This Week",
        "formula": "COUNT(*) WHERE status=completed AND completedAt > startOfWeek",
        "moduleType": "tasks",
        "position": 1
      },
      {
        "id": "avg_completion_time",
        "name": "Avg Completion Time (hours)",
        "formula": "AVG(completedAt - createdAt)",
        "moduleType": "tasks",
        "position": 2
      },
      {
        "id": "overdue_rate",
        "name": "Overdue Rate %",
        "formula": "COUNT(*) WHERE status=overdue / COUNT(*) * 100",
        "moduleType": "tasks",
        "position": 3
      }
    ],
    "metaFormulas": {
      "team_velocity": {
        "formula": "tasks_completed_this_week / 5",
        "dependencies": ["tasks_completed_this_week"],
        "cacheDuration": 5
      }
    }
  }'
```

### Example 18: Automated Reporting

Script to generate weekly task report:

```bash
#!/bin/bash

# Get all tasks
TASKS=$(curl -s -X GET http://localhost:3000/tasks \
  -H "Authorization: Bearer $JWT_TOKEN")

# Count by status
TODO=$(echo $TASKS | jq '[.[] | select(.status=="todo")] | length')
IN_PROGRESS=$(echo $TASKS | jq '[.[] | select(.status=="in_progress")] | length')
COMPLETED=$(echo $TASKS | jq '[.[] | select(.status=="completed")] | length')
OVERDUE=$(echo $TASKS | jq '[.[] | select(.status=="overdue")] | length')

# Generate report
cat << EOF
Weekly Task Report
==================
Date: $(date)

Summary:
- TODO: $TODO
- In Progress: $IN_PROGRESS
- Completed: $COMPLETED
- Overdue: $OVERDUE

Total: $((TODO + IN_PROGRESS + COMPLETED + OVERDUE))
Completion Rate: $(echo "scale=2; $COMPLETED * 100 / ($TODO + $IN_PROGRESS + $COMPLETED + $OVERDUE)" | bc)%
EOF
```

---

## Integration Examples

### Example 19: Webhook Integration (Future Enhancement)

While not yet implemented, here's how webhook integration could work:

```bash
# Register webhook for task completion
curl -X POST http://localhost:3000/webhooks \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "task.completed",
    "url": "https://your-app.com/webhooks/task-completed",
    "secret": "webhook-secret"
  }'
```

### Example 20: Export Tasks to CSV (Future Enhancement)

```bash
curl -X GET "http://localhost:3000/tasks/export?format=csv" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -o tasks_export.csv
```

---

## Testing Examples

### Example 21: Health Check

Test if the API is running:

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-12-01T10:00:00Z",
  "uptime": 3600,
  "environment": "production"
}
```

### Example 22: Verify Task Rollover (Manual Trigger)

While the cron runs automatically at midnight, you can verify the logic by checking overdue tasks:

```bash
# Get all tasks
curl -X GET http://localhost:3000/tasks \
  -H "Authorization: Bearer $JWT_TOKEN" | jq '.[] | select(.status=="overdue")'
```

---

## Tips and Best Practices

1. **Recurring Tasks**: When creating recurring tasks, the system generates up to 12 future instances. Complete the parent task to generate more instances.

2. **Dashboard Performance**: Metrics are cached for 5 minutes by default. For real-time data, adjust the `cacheDuration` in `metaFormulas`.

3. **Audit Trail**: Every task modification is logged in the `auditTrail` field. Use this for compliance and debugging.

4. **Module Integration**: Use consistent `moduleType` names across your application for better organization.

5. **RBAC**: Regular users can only see tasks they created or are assigned to. Admins see all tasks.

6. **Error Handling**: Always check response status codes and handle errors appropriately in your client application.
