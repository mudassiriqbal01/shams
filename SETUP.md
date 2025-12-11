# Setup Guide - Shams Vision Core Platform

## Initial Setup

### 1. Prerequisites

- **Node.js** 18.0.0 or higher
- **Yarn** 3.6.0 or higher
- **PostgreSQL** 12 or higher
- **Docker** and **Docker Compose** (for local database)

### 2. Project Setup

```bash
# Clone the repository (if needed)
git clone <repository-url>
cd shams-vision

# Install dependencies
yarn install
```

### 3. Database Setup

#### Start PostgreSQL with Docker Compose

```bash
# Start the database
docker-compose up -d

# Verify it's running
docker-compose ps
```

The PostgreSQL instance will be available at `localhost:5432` with:
- Username: `postgres`
- Password: `postgres`
- Database: `shams_vision`

#### Configure Environment Variables

API Configuration:
```bash
cd apps/api
cp .env.example .env
```

Edit `.env` and set:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/shams_vision
JWT_SECRET=your-dev-secret-key-change-in-production
JWT_REFRESH_SECRET=your-dev-refresh-secret-key-change-in-production
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

### 4. Run Database Migrations

```bash
cd apps/api

# Compile TypeScript
yarn build

# Run migrations
npx typeorm migration:run -d dist/database/database.config.js
```

**Note:** The migrations will create all necessary tables and indexes.

### 5. Seed Test Data (Optional)

To populate the database with test users and departments:

```bash
cd apps/api
yarn seed
```

This creates:
- 2 departments (Engineering, Sales)
- 3 test users with different roles
- Baseline roles (Admin, Viewer) for each department

**Test Credentials:**
- `admin@example.com` / `password123` (Admin in Engineering)
- `viewer@example.com` / `password123` (Viewer in Engineering)
- `sales@example.com` / `password123` (Admin in Sales)

### 6. Start Development Servers

#### Terminal 1 - Start the API

```bash
cd apps/api
yarn dev
```

The API will start at `http://localhost:3000`

#### Terminal 2 - Start the Web App

```bash
cd apps/web
yarn dev
```

The Web app will start at `http://localhost:3001`

Open your browser and navigate to `http://localhost:3001`

## Monorepo Structure

```
shams-vision/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── auth/          # Authentication module
│   │   │   ├── database/      # Database configuration, entities, migrations
│   │   │   ├── departments/   # Department management module
│   │   │   ├── modules/       # Module management module
│   │   │   ├── config/        # Application configuration
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── test/              # E2E tests
│   │   ├── jest.config.js
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── .env.example
│   │
│   └── web/                    # React Frontend
│       ├── src/
│       │   ├── components/    # React components
│       │   ├── hooks/         # Custom React hooks
│       │   ├── api.ts         # API client
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── index.html
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── vitest.config.ts
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared types and utilities
│       ├── src/
│       │   └── index.ts       # Exported types and enums
│       ├── tsconfig.json
│       └── package.json
│
├── docker-compose.yml          # Local database setup
├── package.json                # Root workspace configuration
├── README.md                   # Project overview
└── SETUP.md                    # This file
```

## Core Features Overview

### Authentication
- JWT-based with access and refresh tokens
- User registration and login
- Secure password hashing with bcrypt
- Token refresh mechanism

### Multi-Department Context
- Users can belong to multiple departments
- Switch active department without logout
- All operations scoped to active department
- Department context enforced via RLS guards

### Database Design
- PostgreSQL with TypeORM ORM
- JSONB columns for flexible metadata
- Audit logging on all changes
- Optimistic concurrency (version-based)
- Department-level Row Level Security

### Permission System
- 5 permission types: CAN_VIEW, CAN_EDIT_ROWS, CAN_EDIT_SCHEMA, CAN_EXPORT, ROW_LEVEL_SECURITY
- Role-based permissions at department level
- Baseline roles seeded (Admin, Viewer)

## Common Development Tasks

### Run Tests

API Unit Tests:
```bash
cd apps/api
yarn test
```

API E2E Tests:
```bash
cd apps/api
yarn test:e2e
```

Web Tests:
```bash
cd apps/web
yarn test
```

### Type Checking

Check all TypeScript:
```bash
yarn typecheck
```

### Build for Production

```bash
yarn build
```

This will:
1. Build the shared package
2. Build the API
3. Build the Web app

### Database Migrations

Create a new migration:
```bash
cd apps/api
npx typeorm migration:create src/database/migrations/YourMigration
```

Apply migrations:
```bash
cd apps/api
npx typeorm migration:run -d dist/database/database.config.js
```

Revert last migration:
```bash
cd apps/api
npx typeorm migration:revert -d dist/database/database.config.js
```

## Troubleshooting

### Database Connection Failed
- Verify PostgreSQL is running: `docker-compose ps`
- Check `DATABASE_URL` in `.env` file
- Ensure database exists: `psql -U postgres -d shams_vision`

### Migrations Not Running
- Build the API first: `cd apps/api && yarn build`
- Check migration files exist in `dist/database/migrations/`
- Run with debug: `DEBUG=* npx typeorm migration:run`

### Port Already in Use
- API (3000): `lsof -i :3000` and `kill -9 <PID>`
- Web (3001): `lsof -i :3001` and `kill -9 <PID>`
- PostgreSQL (5432): `docker-compose down`

### Authentication Issues
- Clear browser local storage: Open DevTools > Application > Local Storage > Clear
- Verify JWT secrets in `.env`
- Check user exists in database: `psql -U postgres -d shams_vision`

## Security Considerations

### Development
- JWT secrets are minimal - change before production
- Test credentials are insecure - remove before deploying
- All traffic should use HTTPS in production

### Production Checklist
- [ ] Change JWT_SECRET and JWT_REFRESH_SECRET
- [ ] Use strong password hashing
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Set up proper database backups
- [ ] Implement rate limiting
- [ ] Enable database encryption
- [ ] Set up monitoring and logging
- [ ] Review RLS policies
- [ ] Implement API request logging

## Next Steps

1. **Explore the API**: Visit `http://localhost:3000/api` (if swagger is available)
2. **Test Authentication**: Use test credentials to login
3. **Create a Module**: Use the dashboard to create and manage modules
4. **Review the Code**: Start with `apps/api/src/app.module.ts` and `apps/web/src/App.tsx`
5. **Read the README**: Full documentation in `README.md`

## Support & Documentation

- **NestJS**: https://docs.nestjs.com
- **TypeORM**: https://typeorm.io
- **React**: https://react.dev
- **PostgreSQL**: https://www.postgresql.org/docs

## Environment Variable Reference

### API (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| NODE_ENV | development | Environment (development/production) |
| PORT | 3000 | API port |
| DATABASE_URL | | PostgreSQL connection string |
| JWT_SECRET | | Secret key for access tokens |
| JWT_REFRESH_SECRET | | Secret key for refresh tokens |
| JWT_EXPIRATION | 15m | Access token expiration time |
| JWT_REFRESH_EXPIRATION | 7d | Refresh token expiration time |
