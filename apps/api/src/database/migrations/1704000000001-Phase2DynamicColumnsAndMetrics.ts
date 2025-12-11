import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase2DynamicColumnsAndMetrics1704000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create columns table
    await queryRunner.query(`
      CREATE TABLE columns (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        moduleId UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        description TEXT,
        type VARCHAR NOT NULL CHECK (type IN ('TEXT', 'NUMBER', 'DATE', 'SINGLE_SELECT', 'MULTI_SELECT', 'FORMULA')),
        column_order INTEGER DEFAULT 0,
        validationRules JSONB DEFAULT '{}',
        options JSONB,
        formula TEXT,
        isRequired BOOLEAN DEFAULT false,
        isVisible BOOLEAN DEFAULT true,
        version INTEGER DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(moduleId, name)
      )
    `);

    // Create index for module columns
    await queryRunner.query(`
      CREATE INDEX idx_columns_moduleId ON columns(moduleId)
    `);

    // Create rows table
    await queryRunner.query(`
      CREATE TABLE rows (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        moduleId UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        createdById UUID NOT NULL REFERENCES users(id),
        updatedById UUID REFERENCES users(id),
        values JSONB DEFAULT '{}',
        version INTEGER DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for rows
    await queryRunner.query(`
      CREATE INDEX idx_rows_moduleId_createdAt ON rows(moduleId, createdAt)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_rows_moduleId_updatedAt ON rows(moduleId, updatedAt)
    `);

    // Create metric_definitions table
    await queryRunner.query(`
      CREATE TABLE metric_definitions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        moduleId UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        description TEXT,
        type VARCHAR NOT NULL CHECK (type IN ('SUM', 'AVG', 'COUNT', 'CUSTOM')),
        columnId UUID,
        metric_order INTEGER,
        aggregationExpression JSONB,
        isVisible BOOLEAN DEFAULT true,
        version INTEGER DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(moduleId, name)
      )
    `);

    // Create index for metric definitions
    await queryRunner.query(`
      CREATE INDEX idx_metric_definitions_moduleId ON metric_definitions(moduleId)
    `);

    // Create import_jobs table
    await queryRunner.query(`
      CREATE TABLE import_jobs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        moduleId UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        createdById UUID NOT NULL REFERENCES users(id),
        status VARCHAR NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'MAPPING', 'VALIDATING', 'IMPORTING', 'COMPLETED', 'FAILED', 'ROLLED_BACK')),
        originalFileName VARCHAR,
        totalRows INTEGER NOT NULL,
        processedRows INTEGER DEFAULT 0,
        importedRows INTEGER DEFAULT 0,
        failedRows INTEGER DEFAULT 0,
        columnMapping JSONB DEFAULT '[]',
        typeInference JSONB,
        csvData TEXT,
        errors JSONB DEFAULT '[]',
        errorSummary TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for import jobs
    await queryRunner.query(`
      CREATE INDEX idx_import_jobs_moduleId_createdAt ON import_jobs(moduleId, createdAt)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_import_jobs_status_createdAt ON import_jobs(status, createdAt)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop import_jobs table
    await queryRunner.query('DROP TABLE IF EXISTS import_jobs');

    // Drop metric_definitions table
    await queryRunner.query('DROP TABLE IF EXISTS metric_definitions');

    // Drop rows table
    await queryRunner.query('DROP TABLE IF EXISTS rows');

    // Drop columns table
    await queryRunner.query('DROP TABLE IF EXISTS columns');
  }
}
