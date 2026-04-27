-- R&D Hub Database Schema
-- PostgreSQL Database
-- Create database (run separately)
-- CREATE DATABASE rndhub;
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'R&D', 'Viewer')),
    full_name VARCHAR(100),
    email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    last_login TIMESTAMP,
    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    must_change_password BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    thumbnail VARCHAR(255),
    status VARCHAR(50) DEFAULT 'In Progress',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Project members table (for project access control)
CREATE TABLE IF NOT EXISTS project_members (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);
-- Documentation table
CREATE TABLE IF NOT EXISTS documentation (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    author_id INTEGER REFERENCES users(id),
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Logbook entries table
CREATE TABLE IF NOT EXISTS logbook_entries (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    author_id INTEGER REFERENCES users(id),
    activity_description TEXT NOT NULL,
    attachments JSON,
    hours_spent DECIMAL(4, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Error reports table
CREATE TABLE IF NOT EXISTS error_reports (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Solved')),
    severity VARCHAR(20) DEFAULT 'Medium' CHECK (
        severity IN ('Low', 'Medium', 'High', 'Critical')
    ),
    before_images JSON,
    after_images JSON,
    solution TEXT,
    reported_by INTEGER REFERENCES users(id),
    solved_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);
-- Media files table
CREATE TABLE IF NOT EXISTS media_files (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Activity log table (for tracking user actions)
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INTEGER,
    ip_address VARCHAR(50),
    user_agent TEXT,
    metadata JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- System settings table (for admin configuration)
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50),
    -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_docs_project_id ON documentation(project_id);
CREATE INDEX IF NOT EXISTS idx_docs_author_id ON documentation(author_id);
CREATE INDEX IF NOT EXISTS idx_docs_created_at ON documentation(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_logbook_date ON logbook_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_logbook_author ON logbook_entries(author_id);
CREATE INDEX IF NOT EXISTS idx_errors_status ON error_reports(status);
CREATE INDEX IF NOT EXISTS idx_errors_severity ON error_reports(severity);
CREATE INDEX IF NOT EXISTS idx_errors_created_at ON error_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_errors_reported_by ON error_reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_resource ON activity_log(resource_type, resource_id);
-- Insert seed data (default users)
-- Password for all users: password123 (hashed with bcrypt)
-- Note: Use ON CONFLICT to make this idempotent
INSERT INTO users (
        username,
        password_hash,
        role,
        full_name,
        email,
        status
    )
VALUES (
        'admin',
        '$2b$10$CeywxysVp91qIDgyMdA0DeVznzoCcE0AJ82hmUPg7pDGBIq2RJ49G',
        'Admin',
        'System Administrator',
        'admin@company.local',
        'Active'
    ),
    (
        'ahmad.rnd',
        '$2b$10$CeywxysVp91qIDgyMdA0DeVznzoCcE0AJ82hmUPg7pDGBIq2RJ49G',
        'R&D',
        'Ahmad Rizki',
        'ahmad@company.local',
        'Active'
    ),
    (
        'siti.rnd',
        '$2b$10$CeywxysVp91qIDgyMdA0DeVznzoCcE0AJ82hmUPg7pDGBIq2RJ49G',
        'R&D',
        'Siti Nurhaliza',
        'siti@company.local',
        'Active'
    ),
    (
        'budi.viewer',
        '$2b$10$CeywxysVp91qIDgyMdA0DeVznzoCcE0AJ82hmUPg7pDGBIq2RJ49G',
        'Viewer',
        'Budi Santoso',
        'budi@company.local',
        'Active'
    ) ON CONFLICT (username) DO NOTHING;
-- Seed default system settings
INSERT INTO system_settings (
        setting_key,
        setting_value,
        setting_type,
        description
    )
VALUES (
        'session_timeout_hours',
        '8',
        'number',
        'Session timeout in hours'
    ),
    (
        'max_login_attempts',
        '5',
        'number',
        'Maximum failed login attempts before lockout'
    ),
    (
        'password_min_length',
        '8',
        'number',
        'Minimum password length'
    ),
    (
        'max_file_size_mb',
        '10',
        'number',
        'Maximum file upload size in MB'
    ),
    (
        'allowed_file_extensions',
        '["jpg","jpeg","png","pdf","docx","xlsx"]',
        'json',
        'Allowed file extensions'
    ),
    (
        'company_name',
        'R&D Hub',
        'string',
        'Company name for branding'
    ) ON CONFLICT (setting_key) DO NOTHING;
-- Assign project creators as owners (run after projects are created)
-- This ensures all existing projects have their creator as owner
INSERT INTO project_members (project_id, user_id, role)
SELECT id,
    created_by,
    'owner'
FROM projects
WHERE created_by IS NOT NULL ON CONFLICT (project_id, user_id) DO NOTHING;