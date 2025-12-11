# API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
All endpoints require JWT authentication unless otherwise specified.

Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Common Response Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Tasks API

### Create Task
Creates a new task and generates recurring instances if applicable.

**Endpoint:** `POST /tasks`

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "status": "enum (optional): todo|in_progress|completed|overdue|cancelled",
  "dueDate": "ISO 8601 string (optional)",
  "assigneeId": "uuid (optional)",
  "moduleType": "string (required)",
  "moduleRecordId": "string (required)",
  "isRecurring": "boolean (optional)",
  "recurrenceInterval": "enum (optional): none|daily|weekly|monthly|custom",
  "recurrenceRule": "object (optional)"
}
```

**Example Request:**
```json
{
  "title": "Weekly team meeting",
  "description": "Discuss sprint progress",
  "dueDate": "2024-12-15T10:00:00Z",
  "assigneeId": "123e4567-e89b-12d3-a456-426614174000",
  "moduleType": "project",
  "moduleRecordId": "proj-001",
  "isRecurring": true,
  "recurrenceInterval": "weekly",
  "recurrenceRule": {
    "every": 1
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "task-uuid",
  "title": "Weekly team meeting",
  "description": "Discuss sprint progress",
  "status": "todo",
  "dueDate": "2024-12-15T10:00:00Z",
  "assigneeId": "123e4567-e89b-12d3-a456-426614174000",
  "createdById": "current-user-id",
  "moduleType": "project",
  "moduleRecordId": "proj-001",
  "isRecurring": true,
  "recurrenceInterval": "weekly",
  "recurrenceRule": {
    "every": 1
  },
  "parentTaskId": null,
  "completedAt": null,
  "completedById": null,
  "auditTrail": [
    {
      "timestamp": "2024-12-01T10:00:00Z",
      "userId": "current-user-id",
      "action": "created",
      "changes": {...}
    }
  ],
  "createdAt": "2024-12-01T10:00:00Z",
  "updatedAt": "2024-12-01T10:00:00Z",
  "isDeleted": false
}
```

---

### Get All Tasks
Retrieves all tasks accessible to the current user.

**Endpoint:** `GET /tasks`

**Response:** `200 OK`
```json
[
  {
    "id": "task-uuid",
    "title": "Task title",
    "status": "todo",
    "dueDate": "2024-12-15T10:00:00Z",
    ...
  }
]
```

**RBAC Rules:**
- Regular users: See only tasks they created or are assigned to
- Admin users: See all tasks

---

### Get Task by ID
Retrieves a specific task by ID.

**Endpoint:** `GET /tasks/:id`

**URL Parameters:**
- `id` (uuid): Task ID

**Response:** `200 OK`
```json
{
  "id": "task-uuid",
  "title": "Task title",
  "parentTask": {
    "id": "parent-task-uuid",
    "title": "Parent task"
  },
  ...
}
```

---

### Get Tasks by Module
Retrieves all tasks linked to a specific module record.

**Endpoint:** `GET /tasks/module/:moduleType/:moduleRecordId`

**URL Parameters:**
- `moduleType` (string): Type of module (e.g., "project", "customer")
- `moduleRecordId` (string): ID of the record in that module

**Example:** `GET /tasks/module/project/proj-001`

**Response:** `200 OK`
```json
[
  {
    "id": "task-uuid",
    "title": "Task for project",
    "moduleType": "project",
    "moduleRecordId": "proj-001",
    ...
  }
]
```

---

### Update Task
Updates an existing task.

**Endpoint:** `PATCH /tasks/:id`

**URL Parameters:**
- `id` (uuid): Task ID

**Request Body:** (all fields optional)
```json
{
  "title": "string",
  "description": "string",
  "status": "enum: todo|in_progress|completed|overdue|cancelled",
  "dueDate": "ISO 8601 string",
  "assigneeId": "uuid",
  "isRecurring": "boolean",
  "recurrenceInterval": "enum",
  "recurrenceRule": "object"
}
```

**Example Request:**
```json
{
  "status": "completed"
}
```

**Response:** `200 OK`
```json
{
  "id": "task-uuid",
  "status": "completed",
  "completedAt": "2024-12-01T15:30:00Z",
  "completedById": "current-user-id",
  "auditTrail": [
    ...,
    {
      "timestamp": "2024-12-01T15:30:00Z",
      "userId": "current-user-id",
      "action": "updated",
      "changes": {
        "status": "completed"
      }
    }
  ],
  ...
}
```

---

### Delete Task
Soft deletes a task.

**Endpoint:** `DELETE /tasks/:id`

**URL Parameters:**
- `id` (uuid): Task ID

**Response:** `200 OK`

---

## Dashboard API

### Create Dashboard
Creates a new dashboard configuration.

**Endpoint:** `POST /dashboards`

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "pinnedMetrics": "array (optional)",
  "metaFormulas": "object (optional)",
  "filters": "object (optional)"
}
```

**Example Request:**
```json
{
  "name": "Project Dashboard",
  "description": "Overview of all project metrics",
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
      "formula": "COUNT(*) WHERE status='completed'",
      "moduleType": "tasks",
      "position": 2
    }
  ],
  "metaFormulas": {
    "completion_rate": {
      "formula": "(completed_tasks / total_tasks) * 100",
      "dependencies": ["completed_tasks", "total_tasks"],
      "cacheDuration": 5
    }
  },
  "filters": {
    "dateRange": "last_30_days"
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "dashboard-uuid",
  "name": "Project Dashboard",
  "userId": "current-user-id",
  ...
}
```

---

### Get All Dashboards
Retrieves all dashboards accessible to the current user.

**Endpoint:** `GET /dashboards`

**Response:** `200 OK`
```json
[
  {
    "id": "dashboard-uuid",
    "name": "Project Dashboard",
    "description": "Overview of all project metrics",
    ...
  }
]
```

**RBAC Rules:**
- Regular users: See only their own dashboards
- Admin users: See all dashboards

---

### Get Dashboard by ID
Retrieves a specific dashboard configuration.

**Endpoint:** `GET /dashboards/:id`

**URL Parameters:**
- `id` (uuid): Dashboard ID

**Response:** `200 OK`

---

### Get Dashboard Metrics
Retrieves calculated metrics for a dashboard with optional filters.

**Endpoint:** `GET /dashboards/:id/metrics`

**URL Parameters:**
- `id` (uuid): Dashboard ID

**Query Parameters:**
- `filters` (JSON string, optional): Filters to apply

**Example:** `GET /dashboards/123/metrics?filters={"status":"completed"}`

**Response:** `200 OK`
```json
{
  "dashboardId": "dashboard-uuid",
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
    "completion_rate": {
      "value": 80,
      "formula": "(completed_tasks / total_tasks) * 100",
      "timestamp": "2024-12-01T10:00:00Z"
    }
  },
  "lastUpdated": "2024-12-01T10:00:00Z"
}
```

**Performance:**
- Response time: < 2 seconds
- Uses cached aggregates with 5-minute TTL
- Client-side recalculation for formula metrics

---

### Update Dashboard
Updates an existing dashboard configuration.

**Endpoint:** `PATCH /dashboards/:id`

**URL Parameters:**
- `id` (uuid): Dashboard ID

**Request Body:** (all fields optional)
```json
{
  "name": "string",
  "description": "string",
  "pinnedMetrics": "array",
  "metaFormulas": "object",
  "filters": "object",
  "isActive": "boolean"
}
```

**Response:** `200 OK`

---

### Delete Dashboard
Soft deletes a dashboard.

**Endpoint:** `DELETE /dashboards/:id`

**URL Parameters:**
- `id` (uuid): Dashboard ID

**Response:** `200 OK`

---

## Recurrence Rule Examples

### Daily (Every day)
```json
{
  "recurrenceInterval": "daily",
  "recurrenceRule": {
    "every": 1
  }
}
```

### Daily (Every 3 days)
```json
{
  "recurrenceInterval": "daily",
  "recurrenceRule": {
    "every": 3
  }
}
```

### Weekly (Every week)
```json
{
  "recurrenceInterval": "weekly",
  "recurrenceRule": {
    "every": 1
  }
}
```

### Weekly (Every 2 weeks)
```json
{
  "recurrenceInterval": "weekly",
  "recurrenceRule": {
    "every": 2
  }
}
```

### Monthly (Every month)
```json
{
  "recurrenceInterval": "monthly",
  "recurrenceRule": {
    "every": 1
  }
}
```

### Custom (Every 3rd Friday)
```json
{
  "recurrenceInterval": "custom",
  "recurrenceRule": {
    "weekOfMonth": 3,
    "dayOfWeek": 5
  }
}
```

Note: `dayOfWeek` uses JavaScript convention (0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday)

---

## Error Responses

### Validation Error
```json
{
  "statusCode": 400,
  "timestamp": "2024-12-01T10:00:00Z",
  "path": "/tasks",
  "message": [
    "title should not be empty",
    "moduleType should not be empty"
  ]
}
```

### Unauthorized
```json
{
  "statusCode": 401,
  "timestamp": "2024-12-01T10:00:00Z",
  "path": "/tasks",
  "message": "Invalid or missing authentication token"
}
```

### Forbidden
```json
{
  "statusCode": 403,
  "timestamp": "2024-12-01T10:00:00Z",
  "path": "/tasks/123",
  "message": "You do not have permission to view this task"
}
```

### Not Found
```json
{
  "statusCode": 404,
  "timestamp": "2024-12-01T10:00:00Z",
  "path": "/tasks/123",
  "message": "Task with ID 123 not found"
}
```

---

## Rate Limiting
- 100 requests per minute per user for standard endpoints
- 1000 requests per minute for dashboard metrics endpoints
- Cached responses don't count toward rate limits

## Pagination
Future enhancement - not yet implemented in this version.

## Webhooks
Future enhancement - consider implementing webhooks for:
- Task status changes
- Overdue task notifications
- Dashboard metric threshold alerts
