const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth, requireRND } = require('../middleware/auth');

// Middleware to check project access
const checkProjectAccess = async (req, res, next) => {
    try {
        const projectId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Admin has access to everything
        if (userRole === 'Admin') {
            req.isProjectAdmin = true;
            return next();
        }

        // Check if user is a member of the project
        const memberCheck = await db.query(
            'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
            [projectId, userId]
        );

        if (memberCheck.rows.length > 0) {
            req.isProjectMember = true;
            req.projectRole = memberCheck.rows[0].role;
            return next();
        }

        // Not a member and not admin
        req.isProjectMember = false;
        next();
    } catch (error) {
        console.error('Check project access error:', error);
        res.status(500).json({ error: 'Failed to check project access' });
    }
};

// Middleware to require project access (member or admin)
const requireProjectAccess = async (req, res, next) => {
    await checkProjectAccess(req, res, () => {
        if (!req.isProjectAdmin && !req.isProjectMember) {
            return res.status(403).json({ error: 'You do not have access to this project' });
        }
        next();
    });
};

// Get all projects (paginated)
router.get('/', requireAuth, async (req, res) => {
    try {
        const { page = 1, limit = 12, category, status, search } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT p.*, u.full_name as creator_name, 
             (SELECT COUNT(*) FROM documentation WHERE project_id = p.id) as doc_count,
             CASE 
                WHEN pm.user_id IS NOT NULL THEN true
                ELSE false
             END as is_member
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = $1
      WHERE 1=1
    `;
        const params = [req.user.id];
        let paramCount = 1;

        if (category) {
            paramCount++;
            query += ` AND p.category = $${paramCount}`;
            params.push(category);
        }

        if (status) {
            paramCount++;
            query += ` AND p.status = $${paramCount}`;
            params.push(status);
        }

        if (search) {
            paramCount++;
            query += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        query += ` ORDER BY p.updated_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);

        const result = await db.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM projects WHERE 1=1';
        const countParams = [];
        let countParamIdx = 0;
        if (category) {
            countParamIdx++;
            countQuery += ` AND category = $${countParamIdx}`;
            countParams.push(category);
        }
        if (status) {
            countParamIdx++;
            countQuery += ` AND status = $${countParamIdx}`;
            countParams.push(status);
        }
        if (search) {
            countParamIdx++;
            countQuery += ` AND (name ILIKE $${countParamIdx} OR description ILIKE $${countParamIdx})`;
            countParams.push(`%${search}%`);
        }
        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            projects: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Get single project
router.get('/:id', requireAuth, checkProjectAccess, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT p.*, u.full_name as creator_name,
              (SELECT COUNT(*) FROM documentation WHERE project_id = p.id) as doc_count
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const project = result.rows[0];
        project.has_access = req.isProjectAdmin || req.isProjectMember;
        project.is_admin = req.isProjectAdmin;
        project.project_role = req.projectRole || null;

        res.json({ project });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// Create project (R&D only)
router.post('/', requireAuth, requireRND, async (req, res) => {
    const client = await db.getClient();
    try {
        const { name, description, category, thumbnail, created_at } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Project name required' });
        }

        await client.query('BEGIN');

        // Create project
        const projectResult = await client.query(
            `INSERT INTO projects (name, description, category, thumbnail, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [
                name,
                description,
                category,
                thumbnail,
                req.user.id,
                created_at || new Date()
            ]
        );

        const project = projectResult.rows[0];

        // Add creator as owner
        await client.query(
            'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
            [project.id, req.user.id, 'owner']
        );

        // Log activity
        await client.query(
            'INSERT INTO activity_log (user_id, action, resource_type, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, 'create', 'project', project.id, JSON.stringify({ name })]
        );

        await client.query('COMMIT');

        res.status(201).json({ project });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Failed to create project' });
    } finally {
        client.release();
    }
});

// Update project (requires project access)
router.put('/:id', requireAuth, requireRND, requireProjectAccess, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, category, thumbnail, status, created_at } = req.body;

        const result = await db.query(
            `UPDATE projects 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           thumbnail = COALESCE($4, thumbnail),
           status = COALESCE($5, status),
           created_at = COALESCE($6, created_at),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
            [name, description, category, thumbnail, status, created_at, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Log activity
        await db.query(
            'INSERT INTO activity_log (user_id, action, resource_type, resource_id) VALUES ($1, $2, $3, $4)',
            [req.user.id, 'update', 'project', id]
        );

        res.json({ project: result.rows[0] });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// Delete project (requires project access)
router.delete('/:id', requireAuth, requireRND, requireProjectAccess, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Log activity
        await db.query(
            'INSERT INTO activity_log (user_id, action, resource_type, resource_id) VALUES ($1, $2, $3, $4)',
            [req.user.id, 'delete', 'project', id]
        );

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

module.exports = router;
