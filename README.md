# Shams Vision - Core Platform Monorepo

A comprehensive monolithic platform built with NestJS, React, PostgreSQL, and advanced security features including JWT authentication, Row Level Security (RLS), and multi-department context switching.

## 🏗️ Project Structure

```
/
├── apps/
│   ├── api/          # NestJS Backend Application
│   └── web/          # React Frontend Application
├── packages/
│   └── shared/       # Shared types and utilities
└── docker-compose.yml
```

## 🎯 Features

### Backend (NestJS API)

- **Authentication**
  - JWT-based authentication with access and refresh tokens
  - User registration and login
  - Token refresh mechanism
  
- **Multi-Department Context**
  - Users can belong to multiple departments
  - Switch active department without re-login
  - Department scoping on all operations

- **Authorization**
  - Role-based permission system
  - Permission types: CAN_VIEW, CAN_EDIT_ROWS, CAN_EDIT_SCHEMA, CAN_EXPORT, ROW_LEVEL_SECURITY
  - Seed baseline roles for each department

- **Database**
  - PostgreSQL with TypeORM
  - Row Level Security (RLS) policies
  - Audit logging for all changes
  - Optimistic concurrency control (Last-Write-Wins)

- **Module Management**
  - CRUD operations for modules
  - Schema-less JSONB metadata
  - Department-scoped modules
  - Version tracking

- **API Guards**
  - JWT Authentication Guard
  - Department RLS Guard for enforcing department context

### Frontend (React)

- Login/logout functionality
- Department switching
- Module management interface
- Responsive design
- Error handling
- Authentication state management

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Yarn 3.6+
- PostgreSQL 12+
- Docker & Docker Compose (for database)

### Installation

1. **Install dependencies**
```bash
yarn install
```

2. **Set up environment variables**

API:
```bash
cd apps/api
cp .env.example .env
```

Update `.env` with your configuration:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/shams_vision
JWT_SECRET=your-super-secret-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

3. **Start PostgreSQL**
```bash
docker-compose up -d
```

4. **Run migrations**
```bash
cd apps/api
yarn build
yarn typeorm migration:run
```

5. **Seed database** (optional, for test data)
```bash
cd apps/api
yarn seed
```

### Running in Development

**Terminal 1 - API:**
```bash
cd apps/api
yarn dev
```

**Terminal 2 - Web:**
```bash
cd apps/web
yarn dev
```

The application will be available at:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000

### Test Credentials

After seeding the database:
- Email: `admin@example.com` | Password: `password123`
- Email: `viewer@example.com` | Password: `password123`
- Email: `sales@example.com` | Password: `password123`

## 🧪 Testing

### Run API Tests
```bash
cd apps/api
yarn test
```

### Run E2E Tests
```bash
cd apps/api
yarn test:e2e
```

## 📦 Database Schema

### Core Tables
- **users**: User accounts with authentication
- **departments**: Organization departments
- **user_department_memberships**: User-department associations
- **roles**: Department-level roles with permissions
- **modules**: Application modules scoped to departments
- **module_permissions**: Role-based module permissions
- **audit_logs**: Change tracking and audit trail

### Key Features
- UUID primary keys
- Timestamp tracking (createdAt, updatedAt)
- JSONB metadata columns for extensibility
- Department-level Row Level Security
- Audit logging on all modifications

## 🔐 Security

### JWT Authentication
- Access tokens with 15-minute expiration
- Refresh tokens with 7-day expiration
- Token versioning for invalidation on password change

### Row Level Security (RLS)
- All queries scoped to active department
- Guards enforce department context
- Audit logs track all operations with department and user info

### Permission Matrix
- CAN_VIEW: Read access
- CAN_EDIT_ROWS: Modify data rows
- CAN_EDIT_SCHEMA: Modify structure
- CAN_EXPORT: Export data
- ROW_LEVEL_SECURITY: Full RLS capability

## 🏗️ API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/switch-department` - Switch active department
- `GET /auth/me` - Get current user profile

### Departments
- `GET /departments` - Get current department
- `GET /departments/:id` - Get specific department

### Modules
- `GET /modules` - List department modules
- `POST /modules` - Create new module
- `GET /modules/:id` - Get module details
- `PUT /modules/:id` - Update module
- `DELETE /modules/:id` - Delete module

## 🔄 Data Flow

1. **User Login**: User provides credentials → JWT tokens generated → User data with departments returned
2. **Department Switch**: User selects department → Active department ID updated → New tokens issued
3. **Module Operations**: All module CRUD operations are scoped by active department → Audit log created
4. **Concurrency**: Updates checked against version number → ConflictException on mismatch

## 📝 Development Guidelines

### Code Style
- TypeScript strict mode enabled
- Class-based NestJS architecture
- Functional React components with hooks
- ESM modules for frontend, CommonJS for backend

### Database Changes
When modifying the schema:
1. Create a new migration in `apps/api/src/database/migrations/`
2. Follow the timestamp naming convention: `TIMESTAMP-Description.ts`
3. Run migrations with `yarn typeorm migration:run`

### Adding New Features
1. Create entity in `apps/api/src/database/entities/`
2. Create DTOs in feature module
3. Create service and controller
4. Export from feature module
5. Add guards if department-scoped
6. Add tests for new functionality

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [React Documentation](https://react.dev)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)

## 📄 License

Proprietary - Shams Vision
