-- VERV BMS Initial Migration Script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ROLES
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    department_id UUID REFERENCES departments(id),
    role_id UUID REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. MODULES
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    key VARCHAR(50) UNIQUE,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. AUDIT LOGS
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Policy: Users can view their own profile
CREATE POLICY users_view_own ON users
    FOR SELECT
    USING (id::text = current_setting('app.current_user_id', true));

-- Policy: Admins can view all users (Assuming 'admin' role check via app logic or DB function)
-- For simplicity, we assume RLS is enforced via application user context setting.

-- 7. INITIAL SEED DATA

-- Roles
INSERT INTO roles (name, permissions) VALUES 
('Super Admin', '{"all": true}'),
('Admin', '{"manage_users": true, "view_reports": true}'),
('Manager', '{"view_reports": true, "manage_department": true}'),
('Employee', '{"view_self": true}');

-- Departments
INSERT INTO departments (name, description) VALUES 
('Executive', 'Company Leadership'),
('IT & Engineering', 'Technology and Development'),
('Human Resources', 'HR and Recruiting'),
('Sales & Marketing', 'Growth and Customer Acquisition'),
('Finance', 'Accounting and Payroll');

-- Modules
INSERT INTO modules (name, key) VALUES 
('Dashboard', 'dashboard'),
('User Management', 'user_mgmt'),
('Department Management', 'dept_mgmt'),
('Audit Logs', 'audit_logs'),
('Settings', 'settings');

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at);
