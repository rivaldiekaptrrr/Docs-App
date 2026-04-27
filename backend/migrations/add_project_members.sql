-- Migration: Add project_members table for project access control
-- Date: 2026-02-17

-- Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'editor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);

-- Add creator as first member for existing projects
INSERT INTO project_members (project_id, user_id, role)
SELECT id, created_by, 'owner'
FROM projects
WHERE created_by IS NOT NULL
ON CONFLICT (project_id, user_id) DO NOTHING;

COMMENT ON TABLE project_members IS 'Manages which users have access to edit specific projects';
COMMENT ON COLUMN project_members.role IS 'Role in project: owner, editor, viewer';
