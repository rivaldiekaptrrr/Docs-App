/**
 * Mock Database Adapter
 * Provides the same interface as config/database.js (query, getClient, pool)
 * but operates entirely in-memory using mockData.js.
 *
 * SQL patterns are matched via simple string parsing — enough to cover all
 * queries issued by the existing routes without a real SQL engine.
 */

const data = require('./mockData');

// ─── Tiny SQL Router ──────────────────────────────────────────────────────────

/**
 * Execute a parameterised pseudo-SQL query and return a pg-compatible result
 * object: { rows: [...], rowCount: N }
 */
const query = async (text, params = []) => {
    const sql = text.replace(/\s+/g, ' ').trim();
    const upper = sql.toUpperCase();

    try {
        const result = routeQuery(sql, upper, params);
        return result;
    } catch (err) {
        console.error('[MockDB] Unhandled query:', sql, '\nParams:', params);
        console.error('[MockDB] Error:', err.message);
        // Return empty result instead of crashing
        return { rows: [], rowCount: 0 };
    }
};

function routeQuery(sql, upper, params) {
    // ── Auth ─────────────────────────────────────────────────────────────────
    if (upper.includes('FROM USERS WHERE USERNAME =')) {
        const user = data.users.find(u => u.username === params[0]);
        return row(user);
    }

    if (upper.includes('FROM USERS WHERE ID =') && !upper.includes('UPDATE')) {
        const id = parseInt(params[0]);
        const user = data.users.find(u => u.id === id);
        const safe = user ? strip(user, ['password_hash']) : null;
        return row(safe);
    }

    if (upper.includes('SELECT ID, USERNAME, ROLE, FULL_NAME, EMAIL FROM USERS WHERE ID =')) {
        const id = parseInt(params[0]);
        const user = data.users.find(u => u.id === id);
        if (!user) return empty();
        return row({ id: user.id, username: user.username, role: user.role, full_name: user.full_name, email: user.email });
    }

    if (upper.startsWith('UPDATE USERS SET LAST_LOGIN')) {
        const user = data.users.find(u => u.id === parseInt(params[0]));
        if (user) user.last_login = new Date();
        return { rows: [], rowCount: 1 };
    }

    if (upper.startsWith('UPDATE USERS SET PASSWORD_HASH')) {
        const id = parseInt(params[1]);
        const user = data.users.find(u => u.id === id);
        if (!user) return empty();
        user.password_hash = params[0];
        user.must_change_password = true;
        user.password_changed_at = new Date();
        return row({ username: user.username });
    }

    // ── Activity Log inserts ──────────────────────────────────────────────────
    if (upper.startsWith('INSERT INTO ACTIVITY_LOG')) {
        const id = data.nextId('activityLog');
        const entry = {
            id,
            user_id:       params[0] || null,
            action:        params[1] || null,
            resource_type: params[2] || null,
            resource_id:   params[3] || null,
            metadata:      params[4] || null,
            ip_address:    params[5] || null,
            user_agent:    params[6] || null,
            timestamp:     new Date(),
            username: null, full_name: null,
        };
        data.activityLog.push(entry);
        return { rows: [entry], rowCount: 1 };
    }

    // ── Users CRUD ────────────────────────────────────────────────────────────
    if (upper.startsWith('SELECT') && upper.includes('FROM USERS WHERE 1=1')) {
        let result = data.users.map(u => strip(u, ['password_hash']));
        // search
        const searchIdx = findParamForPattern(sql, ['username ilike', 'full_name ilike', 'email ilike']);
        if (searchIdx !== null) {
            const term = params[searchIdx].replace(/%/g, '').toLowerCase();
            result = result.filter(u =>
                u.username?.toLowerCase().includes(term) ||
                u.full_name?.toLowerCase().includes(term) ||
                u.email?.toLowerCase().includes(term)
            );
        }
        // role filter
        const roleIdx = upper.includes('AND ROLE =') ? findParamIdx(sql, 'AND role =') : null;
        if (roleIdx !== null) result = result.filter(u => u.role === params[roleIdx]);
        // status filter
        const statusIdx = upper.includes('AND STATUS =') ? findParamIdx(sql, 'AND status =') : null;
        if (statusIdx !== null) result = result.filter(u => u.status === params[statusIdx]);
        return rows(result);
    }

    if (upper.startsWith('SELECT ID FROM USERS WHERE USERNAME =')) {
        const exists = data.users.find(u => u.username === params[0]);
        return exists ? rows([{ id: exists.id }]) : empty();
    }

    if (upper.startsWith('INSERT INTO USERS')) {
        const id = data.nextId('users');
        const user = {
            id,
            username:              params[0],
            password_hash:         params[1],
            full_name:             params[2],
            email:                 params[3],
            role:                  params[4],
            status:                params[5] || 'Active',
            created_at:            new Date(),
            last_login:            null,
            must_change_password:  false,
            password_changed_at:   null,
        };
        data.users.push(user);
        return row(strip(user, ['password_hash']));
    }

    if (upper.startsWith('UPDATE USERS SET') && upper.includes('WHERE ID =')) {
        // dynamic UPDATE built in users route
        const id = parseInt(params[params.length - 1]);
        const user = data.users.find(u => u.id === id);
        if (!user) return empty();
        // parse SET fields from sql: "SET field = $1, field2 = $2 WHERE id = $N"
        const setClause = sql.match(/SET (.+) WHERE/i)?.[1] || '';
        const assignments = setClause.split(',').map(s => s.trim());
        assignments.forEach(a => {
            const [col, placeholder] = a.split('=').map(s => s.trim());
            const idx = parseInt(placeholder.replace('$', '')) - 1;
            if (col && params[idx] !== undefined) {
                user[col] = params[idx];
            }
        });
        return row(strip(user, ['password_hash']));
    }

    if (upper.startsWith('DELETE FROM USERS WHERE ID =')) {
        const id = parseInt(params[0]);
        const idx = data.users.findIndex(u => u.id === id);
        if (idx === -1) return empty();
        const [deleted] = data.users.splice(idx, 1);
        return row({ username: deleted.username });
    }

    // ── Projects ──────────────────────────────────────────────────────────────
    if (upper.includes('FROM PROJECTS') && upper.includes('WHERE 1=1')) {
        let result = [...data.projects];
        const userId = params[0];

        // Attach is_member relative to requesting user
        result = result.map(p => ({
            ...p,
            is_member: data.projectMembers.some(m => m.project_id === p.id && m.user_id === userId),
        }));

        // filters
        let pIdx = 1;
        if (upper.includes('AND P.CATEGORY =')) {
            result = result.filter(p => p.category === params[pIdx++]);
        }
        if (upper.includes('AND P.STATUS =')) {
            result = result.filter(p => p.status === params[pIdx++]);
        }
        if (upper.includes('ILIKE')) {
            const term = params[pIdx++].replace(/%/g, '').toLowerCase();
            result = result.filter(p =>
                p.name?.toLowerCase().includes(term) ||
                p.description?.toLowerCase().includes(term)
            );
            pIdx--; // ILIKE used once for two columns
        }

        // pagination
        const limit  = parseInt(params[params.length - 2]) || 12;
        const offset = parseInt(params[params.length - 1]) || 0;
        const paginated = result.slice(offset, offset + limit);
        return rows(paginated);
    }

    // count for projects
    if (upper.startsWith('SELECT COUNT(*) FROM PROJECTS WHERE 1=1')) {
        let result = [...data.projects];
        let pIdx = 0;
        if (upper.includes('AND CATEGORY ='))
            result = result.filter(p => p.category === params[pIdx++]);
        if (upper.includes('AND STATUS ='))
            result = result.filter(p => p.status === params[pIdx++]);
        if (upper.includes('ILIKE')) {
            const term = params[pIdx++].replace(/%/g, '').toLowerCase();
            result = result.filter(p =>
                p.name?.toLowerCase().includes(term) ||
                p.description?.toLowerCase().includes(term)
            );
        }
        return rows([{ count: String(result.length) }]);
    }

    // single project
    if (upper.includes('FROM PROJECTS P') && upper.includes('WHERE P.ID =')) {
        const id = parseInt(params[0]);
        const project = data.projects.find(p => p.id === id);
        return row(project);
    }

    // create project
    if (upper.startsWith('INSERT INTO PROJECTS')) {
        const id = data.nextId('projects');
        const project = {
            id,
            name:        params[0],
            description: params[1] || null,
            category:    params[2] || null,
            thumbnail:   params[3] || null,
            created_by:  params[4],
            created_at:  params[5] ? new Date(params[5]) : new Date(),
            updated_at:  new Date(),
            status:      'Active',
            creator_name: null,
            doc_count:    0,
            is_member:    true,
        };
        data.projects.push(project);
        return row(project);
    }

    // update project
    if (upper.startsWith('UPDATE PROJECTS')) {
        const id = parseInt(params[6]);
        const project = data.projects.find(p => p.id === id);
        if (!project) return empty();
        if (params[0] !== undefined) project.name        = params[0] ?? project.name;
        if (params[1] !== undefined) project.description = params[1] ?? project.description;
        if (params[2] !== undefined) project.category    = params[2] ?? project.category;
        if (params[3] !== undefined) project.thumbnail   = params[3] ?? project.thumbnail;
        if (params[4] !== undefined) project.status      = params[4] ?? project.status;
        if (params[5] !== undefined) project.created_at  = params[5] ? new Date(params[5]) : project.created_at;
        project.updated_at = new Date();
        return row(project);
    }

    // delete project
    if (upper.startsWith('DELETE FROM PROJECTS WHERE ID =')) {
        const id = parseInt(params[0]);
        const idx = data.projects.findIndex(p => p.id === id);
        if (idx === -1) return empty();
        const [deleted] = data.projects.splice(idx, 1);
        return row(deleted);
    }

    // ── Project Members ───────────────────────────────────────────────────────
    if (upper.startsWith('SELECT ROLE FROM PROJECT_MEMBERS WHERE PROJECT_ID =')) {
        const pm = data.projectMembers.find(m =>
            m.project_id === parseInt(params[0]) && m.user_id === parseInt(params[1])
        );
        return pm ? rows([{ role: pm.role }]) : empty();
    }

    if (upper.startsWith('SELECT') && upper.includes('FROM PROJECT_MEMBERS') && upper.includes('WHERE PROJECT_ID =')) {
        const projectId = parseInt(params[0]);
        const members = data.projectMembers
            .filter(m => m.project_id === projectId)
            .map(m => {
                const user = data.users.find(u => u.id === m.user_id);
                return { ...m, username: user?.username, full_name: user?.full_name, email: user?.email, status: user?.status };
            });
        return rows(members);
    }

    if (upper.startsWith('INSERT INTO PROJECT_MEMBERS')) {
        const id = data.nextId('projectMembers');
        const pm = { id, project_id: parseInt(params[0]), user_id: parseInt(params[1]), role: params[2], joined_at: new Date() };
        data.projectMembers.push(pm);
        return row(pm);
    }

    if (upper.startsWith('UPDATE PROJECT_MEMBERS SET ROLE')) {
        const pm = data.projectMembers.find(m =>
            m.project_id === parseInt(params[1]) && m.user_id === parseInt(params[2])
        );
        if (!pm) return empty();
        pm.role = params[0];
        return row(pm);
    }

    if (upper.startsWith('DELETE FROM PROJECT_MEMBERS WHERE PROJECT_ID =') && upper.includes('AND USER_ID =')) {
        const idx = data.projectMembers.findIndex(m =>
            m.project_id === parseInt(params[0]) && m.user_id === parseInt(params[1])
        );
        if (idx === -1) return empty();
        const [deleted] = data.projectMembers.splice(idx, 1);
        return row(deleted);
    }

    // ── Documentation ─────────────────────────────────────────────────────────
    if (upper.includes('FROM DOCUMENTATION') && upper.includes('WHERE PROJECT_ID =') && !upper.startsWith('SELECT COUNT')) {
        const projectId = parseInt(params[0]);
        const docs = data.documentation.filter(d => d.project_id === projectId);
        return rows(docs);
    }

    if (upper.startsWith('SELECT COUNT(*) FROM DOCUMENTATION WHERE PROJECT_ID =')) {
        const projectId = parseInt(params[0]);
        const count = data.documentation.filter(d => d.project_id === projectId).length;
        return rows([{ count: String(count) }]);
    }

    if (upper.includes('FROM DOCUMENTATION WHERE') && upper.includes('AND PROJECT_ID =')) {
        const docId     = parseInt(params[0]);
        const projectId = parseInt(params[1]);
        const doc = data.documentation.find(d => d.id === docId && d.project_id === projectId);
        return row(doc);
    }

    if (upper.includes('FROM DOCUMENTATION WHERE ID =')) {
        const doc = data.documentation.find(d => d.id === parseInt(params[0]));
        return row(doc);
    }

    if (upper.startsWith('INSERT INTO DOCUMENTATION')) {
        const id = data.nextId('documentation');
        const creator = data.users.find(u => u.id === parseInt(params[3]));
        const doc = {
            id,
            project_id:   parseInt(params[0]),
            title:        params[1],
            content:      params[2],
            created_by:   parseInt(params[3]),
            creator_name: creator?.full_name || null,
            file_url:     null,
            created_at:   new Date(),
            updated_at:   new Date(),
        };
        data.documentation.push(doc);
        return row(doc);
    }

    if (upper.startsWith('UPDATE DOCUMENTATION')) {
        const id = parseInt(params[params.length - 1]);
        const doc = data.documentation.find(d => d.id === id);
        if (!doc) return empty();
        if (params[0] !== undefined) doc.title   = params[0] ?? doc.title;
        if (params[1] !== undefined) doc.content  = params[1] ?? doc.content;
        if (params[2] !== undefined) doc.file_url = params[2] ?? doc.file_url;
        doc.updated_at = new Date();
        return row(doc);
    }

    if (upper.startsWith('DELETE FROM DOCUMENTATION WHERE ID =')) {
        const id = parseInt(params[0]);
        const idx = data.documentation.findIndex(d => d.id === id);
        if (idx === -1) return empty();
        const [deleted] = data.documentation.splice(idx, 1);
        return row(deleted);
    }

    // ── Logbook ───────────────────────────────────────────────────────────────
    if (upper.includes('FROM LOGBOOK') && upper.startsWith('SELECT')) {
        let entries = [...data.logbook];

        let pIdx = 0;
        if (upper.includes('WHERE 1=1')) {
            // General query with optional filters
            if (upper.includes('AND L.DATE =')) entries = entries.filter(l => l.date.toISOString().split('T')[0] === params[pIdx++]);
            // (Skipping month/year parsing for brevity in mock)
            if (upper.includes('AND L.AUTHOR_ID =')) entries = entries.filter(l => l.user_id === parseInt(params[pIdx++]));
        } else if (upper.includes('WHERE PROJECT_ID =')) {
            const projectId = parseInt(params[0]);
            entries = entries.filter(l => l.project_id === projectId);
        } else if (upper.includes('WHERE L.ID =') || upper.includes('WHERE ID =')) {
            const entry = entries.find(l => l.id === parseInt(params[0]));
            return row(entry);
        }

        // populate authors
        entries = entries.map(l => {
            const user = data.users.find(u => u.id === l.user_id);
            return { ...l, author_name: user?.full_name || l.author_name };
        }).sort((a, b) => new Date(b.date) - new Date(a.date));

        if (upper.startsWith('SELECT COUNT')) return rows([{ count: String(entries.length) }]);

        const limit  = parseInt(params[params.length - 2]) || 20;
        const offset = parseInt(params[params.length - 1]) || 0;
        return rows(entries.slice(offset, offset + limit));
    }

    if (upper.startsWith('INSERT INTO LOGBOOK')) {
        const id = data.nextId('logbook');
        const user = data.users.find(u => u.id === parseInt(params[4]));
        const entry = {
            id,
            project_id:  parseInt(params[0]),
            date:        new Date(params[1]),
            activity:    params[2],
            notes:       params[3],
            user_id:     parseInt(params[4]),
            author_name: user?.full_name || null,
            created_at:  new Date(),
        };
        data.logbook.push(entry);
        return row(entry);
    }

    if (upper.startsWith('UPDATE LOGBOOK')) {
        const id = parseInt(params[params.length - 1]);
        const entry = data.logbook.find(l => l.id === id);
        if (!entry) return empty();
        if (params[0]) entry.date     = new Date(params[0]);
        if (params[1]) entry.activity = params[1];
        if (params[2]) entry.notes    = params[2];
        return row(entry);
    }

    if (upper.startsWith('DELETE FROM LOGBOOK WHERE ID =')) {
        const id = parseInt(params[0]);
        const idx = data.logbook.findIndex(l => l.id === id);
        if (idx === -1) return empty();
        const [deleted] = data.logbook.splice(idx, 1);
        return row(deleted);
    }

    // ── Error Reports ─────────────────────────────────────────────────────────
    if (upper.includes('FROM ERROR_REPORTS') && upper.startsWith('SELECT')) {
        let errs = [...data.errorReports];

        let pIdx = 0;
        if (upper.includes('WHERE 1=1')) {
            if (upper.includes('AND E.STATUS =')) errs = errs.filter(e => e.status === params[pIdx++]);
            if (upper.includes('AND E.SEVERITY =')) errs = errs.filter(e => e.severity === params[pIdx++]);
        } else if (upper.includes('WHERE PROJECT_ID =')) {
            const projectId = parseInt(params[0]);
            errs = errs.filter(e => e.project_id === projectId);
        } else if (upper.includes('WHERE E.ID =') || upper.includes('WHERE ID =')) {
            const err = errs.find(e => e.id === parseInt(params[0]));
            return row(err);
        }

        if (upper.startsWith('SELECT COUNT')) return rows([{ count: String(errs.length) }]);

        errs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const limit  = parseInt(params[params.length - 2]) || 20;
        const offset = parseInt(params[params.length - 1]) || 0;
        return rows(errs.slice(offset, offset + limit));
    }

    if (upper.startsWith('INSERT INTO ERROR_REPORTS')) {
        const id = data.nextId('errorReports');
        const user = data.users.find(u => u.id === parseInt(params[4]));
        const err = {
            id,
            project_id:    parseInt(params[0]),
            title:         params[1],
            description:   params[2],
            severity:      params[3],
            reported_by:   parseInt(params[4]),
            reporter_name: user?.full_name || null,
            status:        'Open',
            created_at:    new Date(),
            updated_at:    new Date(),
        };
        data.errorReports.push(err);
        return row(err);
    }

    if (upper.startsWith('UPDATE ERROR_REPORTS')) {
        const id = parseInt(params[params.length - 1]);
        const err = data.errorReports.find(e => e.id === id);
        if (!err) return empty();
        ['title','description','severity','status'].forEach((f, i) => {
            if (params[i] !== undefined) err[f] = params[i] ?? err[f];
        });
        err.updated_at = new Date();
        return row(err);
    }

    if (upper.startsWith('DELETE FROM ERROR_REPORTS WHERE ID =')) {
        const id = parseInt(params[0]);
        const idx = data.errorReports.findIndex(e => e.id === id);
        if (idx === -1) return empty();
        const [deleted] = data.errorReports.splice(idx, 1);
        return row(deleted);
    }

    // ── Activity Log reads ────────────────────────────────────────────────────
    if (upper.includes('FROM ACTIVITY_LOG A') && upper.includes('WHERE 1=1')) {
        let result = [...data.activityLog];
        let pIdx = 0;
        if (upper.includes('AND A.USER_ID ='))       result = result.filter(a => a.user_id === parseInt(params[pIdx++]));
        if (upper.includes('AND A.ACTION ='))         result = result.filter(a => a.action === params[pIdx++]);
        if (upper.includes('AND A.RESOURCE_TYPE ='))  result = result.filter(a => a.resource_type === params[pIdx++]);
        if (upper.includes('AND A.TIMESTAMP >='))     result = result.filter(a => new Date(a.timestamp) >= new Date(params[pIdx++]));
        if (upper.includes('AND A.TIMESTAMP <='))     result = result.filter(a => new Date(a.timestamp) <= new Date(params[pIdx++]));
        result = result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        if (upper.startsWith('SELECT COUNT(*)')) return rows([{ count: String(result.length) }]);
        const limit  = parseInt(params[params.length - 2]) || 50;
        const offset = parseInt(params[params.length - 1]) || 0;
        return rows(result.slice(offset, offset + limit));
    }

    if (upper.includes('COUNT(*)') && upper.includes('FROM ACTIVITY_LOG WHERE TIMESTAMP')) {
        return rows([{ total: String(data.activityLog.length) }]);
    }

    if (upper.includes('GROUP BY ACTION')) {
        const grouped = {};
        data.activityLog.forEach(a => { grouped[a.action] = (grouped[a.action] || 0) + 1; });
        const result = Object.entries(grouped).map(([action, count]) => ({ action, count: String(count) }));
        return rows(result);
    }

    if (upper.includes('GROUP BY U.ID')) {
        const grouped = {};
        data.activityLog.forEach(a => {
            grouped[a.user_id] = (grouped[a.user_id] || 0) + 1;
        });
        const result = Object.entries(grouped).map(([uid, cnt]) => {
            const user = data.users.find(u => u.id === parseInt(uid));
            return { username: user?.username, full_name: user?.full_name, activity_count: String(cnt) };
        });
        return rows(result);
    }

    if (upper.includes('GROUP BY DATE(TIMESTAMP)')) {
        return rows([]);
    }

    if (upper.startsWith('SELECT DISTINCT ACTION FROM ACTIVITY_LOG')) {
        const actions = [...new Set(data.activityLog.map(a => a.action))].sort();
        return rows(actions.map(a => ({ action: a })));
    }

    // ── Settings ──────────────────────────────────────────────────────────────
    if (upper.startsWith('SELECT') && upper.includes('FROM SETTINGS')) {
        if (upper.includes('WHERE KEY =')) {
            const setting = data.settings.find(s => s.key === params[0]);
            return row(setting);
        }
        return rows(data.settings);
    }

    if (upper.startsWith('INSERT INTO SETTINGS')) {
        const existing = data.settings.find(s => s.key === params[0]);
        if (existing) {
            existing.value = params[1];
            existing.updated_at = new Date();
            return row(existing);
        }
        const id = data.nextId('settings');
        const setting = { id, key: params[0], value: params[1], updated_at: new Date() };
        data.settings.push(setting);
        return row(setting);
    }

    if (upper.startsWith('UPDATE SETTINGS')) {
        const setting = data.settings.find(s => s.key === params[1]);
        if (setting) { setting.value = params[0]; setting.updated_at = new Date(); }
        return row(setting);
    }

    // ── Fallback ──────────────────────────────────────────────────────────────
    console.warn('[MockDB] No handler matched for query:', sql.substring(0, 120));
    return { rows: [], rowCount: 0 };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function row(obj) {
    if (!obj) return { rows: [], rowCount: 0 };
    return { rows: [obj], rowCount: 1 };
}

function rows(arr) {
    return { rows: arr || [], rowCount: (arr || []).length };
}

function empty() {
    return { rows: [], rowCount: 0 };
}

function strip(obj, keys = []) {
    if (!obj) return null;
    const clone = { ...obj };
    keys.forEach(k => delete clone[k]);
    return clone;
}

function findParamForPattern(sql, patterns) {
    // Returns 0-based param index of the first ILIKE / = $N match
    const match = sql.match(/\$(\d+)/g);
    if (!match) return null;
    for (let i = 0; i < match.length; i++) {
        if (patterns.some(p => sql.toLowerCase().includes(p))) return i;
    }
    return null;
}

function findParamIdx(sql, pattern) {
    const idx = sql.toLowerCase().indexOf(pattern.toLowerCase());
    if (idx === -1) return null;
    const sub = sql.substring(idx);
    const m = sub.match(/\$(\d+)/);
    return m ? parseInt(m[1]) - 1 : null;
}

// ─── Mock client (supports transactions — no-op in mock mode) ─────────────────
const getClient = async () => {
    return {
        query:   async (text, params) => query(text, params),
        release: () => {},
        // transaction stubs
    };
};

// ─── Mock pool ────────────────────────────────────────────────────────────────
const pool = {
    on: () => {},
    query: async (text, params) => query(text, params),
};

module.exports = { query, getClient, pool };
