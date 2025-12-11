import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1704000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    // Create users table
    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR NOT NULL UNIQUE,
        firstName VARCHAR NOT NULL,
        lastName VARCHAR NOT NULL,
        passwordHash VARCHAR NOT NULL,
        activeDepartmentId UUID,
        tokenVersion INT DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create departments table
    await queryRunner.query(`
      CREATE TABLE departments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR NOT NULL,
        description TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_department_memberships table
    await queryRunner.query(`
      CREATE TABLE user_department_memberships (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        departmentId UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
        joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(userId, departmentId)
      )
    `);

    // Create roles table
    await queryRunner.query(`
      CREATE TABLE roles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR NOT NULL,
        departmentId UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
        permissions TEXT[] DEFAULT '{}',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create association between roles and memberships
    await queryRunner.query(`
      ALTER TABLE roles
      ADD COLUMN membershipId UUID REFERENCES user_department_memberships(id) ON DELETE CASCADE
    `);

    // Create modules table
    await queryRunner.query(`
      CREATE TABLE modules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR NOT NULL,
        description TEXT,
        departmentId UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
        metadata JSONB DEFAULT '{}',
        version INT DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create module_permissions table
    await queryRunner.query(`
      CREATE TABLE module_permissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        moduleId UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        roleId UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permissions TEXT[] DEFAULT '{}',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(moduleId, roleId)
      )
    `);

    // Create audit_logs table
    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        entityType VARCHAR NOT NULL,
        entityId UUID NOT NULL,
        action VARCHAR NOT NULL,
        userId UUID NOT NULL REFERENCES users(id),
        departmentId UUID NOT NULL REFERENCES departments(id),
        changes JSONB DEFAULT '{}',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_entity (entityType, entityId),
        INDEX idx_audit_department (departmentId),
        INDEX idx_audit_created (createdAt)
      )
    `);

    // Create indexes for performance
    await queryRunner.query('CREATE INDEX idx_users_email ON users(email)');
    await queryRunner.query(
      'CREATE INDEX idx_users_activeDepartment ON users(activeDepartmentId)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_memberships_user ON user_department_memberships(userId)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_memberships_department ON user_department_memberships(departmentId)',
    );
    await queryRunner.query('CREATE INDEX idx_roles_department ON roles(departmentId)');
    await queryRunner.query('CREATE INDEX idx_modules_department ON modules(departmentId)');
    await queryRunner.query('CREATE INDEX idx_module_perms_module ON module_permissions(moduleId)');
    await queryRunner.query('CREATE INDEX idx_module_perms_role ON module_permissions(roleId)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query('DROP TABLE IF EXISTS audit_logs');
    await queryRunner.query('DROP TABLE IF EXISTS module_permissions');
    await queryRunner.query('DROP TABLE IF EXISTS modules');
    await queryRunner.query('DROP TABLE IF EXISTS roles');
    await queryRunner.query('DROP TABLE IF EXISTS user_department_memberships');
    await queryRunner.query('DROP TABLE IF EXISTS departments');
    await queryRunner.query('DROP TABLE IF EXISTS users');
    await queryRunner.query('DROP EXTENSION IF EXISTS "pgcrypto"');
    await queryRunner.query('DROP EXTENSION IF EXISTS "uuid-ossp"');
  }
}
