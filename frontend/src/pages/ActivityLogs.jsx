import { useState, useEffect } from 'react';
import { activityAPI, usersAPI } from '../services/api';
import {
    FunnelIcon,
    ClockIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    ListBulletIcon,
    ArrowRightStartOnRectangleIcon,
    FolderPlusIcon,
    PencilSquareIcon,
    TrashIcon,
    BugAntIcon,
    DocumentPlusIcon,
    UserPlusIcon,
    KeyIcon,
    Cog6ToothIcon,
    ArrowUpTrayIcon,
    BookOpenIcon
} from '@heroicons/react/24/outline';

function ActivityLogs() {
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ user_id: '', action: '', start_date: '', end_date: '', page: 1, limit: 50 });
    const [pagination, setPagination] = useState({});

    useEffect(() => { fetchLogs(); }, [filters]);
    useEffect(() => { fetchUsers(); fetchActions(); }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
            const response = await activityAPI.getAll(cleanFilters);
            setLogs(response.data.logs || []);
            setPagination(response.data.pagination || {});
        } catch (error) { console.error('Failed to fetch logs:', error); } finally { setLoading(false); }
    };

    const fetchUsers = async () => {
        try { const response = await usersAPI.getAll({}); setUsers(response.data.users || []); } catch (error) { console.error('Failed to fetch users:', error); }
    };

    const fetchActions = async () => {
        try { const response = await activityAPI.getActions(); setActions(response.data.actions || []); } catch (error) { console.error('Failed to fetch actions:', error); }
    };

    const getActionLabel = (action) => action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

    const getActionIcon = (action) => {
        if (action === 'LOGIN' || action === 'LOGOUT') return <ArrowRightStartOnRectangleIcon style={iconSm} />;
        if (action.includes('PROJECT')) return <FolderPlusIcon style={iconSm} />;
        if (action.includes('DOCUMENTATION')) return <DocumentPlusIcon style={iconSm} />;
        if (action.includes('ERROR')) return <BugAntIcon style={iconSm} />;
        if (action.includes('LOGBOOK')) return <BookOpenIcon style={iconSm} />;
        if (action.includes('USER')) return <UserPlusIcon style={iconSm} />;
        if (action === 'RESET_PASSWORD') return <KeyIcon style={iconSm} />;
        if (action === 'UPLOAD_FILE') return <ArrowUpTrayIcon style={iconSm} />;
        if (action.includes('SETTING')) return <Cog6ToothIcon style={iconSm} />;
        return <ListBulletIcon style={iconSm} />;
    };

    const getActionBadgeClass = (action) => {
        if (action.startsWith('CREATE')) return 'badge-success';
        if (action.startsWith('DELETE')) return 'badge-danger';
        if (action.startsWith('UPDATE') || action.startsWith('RESET') || action.startsWith('BULK')) return 'badge-warning';
        if (action === 'LOGIN' || action === 'LOGOUT') return 'badge-primary';
        return 'badge-secondary';
    };

    const formatTimeAgo = (timestamp) => {
        const diff = Math.floor((Date.now() - new Date(timestamp)) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return new Date(timestamp).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="animate-slide-up">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 style={{ marginBottom: 'var(--sp-1)' }}>Activity Logs</h1>
                    <p className="text-secondary" style={{ margin: 0 }}>Monitor all user activities in the system</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="card-body" style={{ padding: 'var(--sp-4) var(--sp-6)' }}>
                    <div className="flex items-center gap-4 flex-wrap">
                        <FunnelIcon style={{ width: 18, height: 18, color: 'var(--color-text-muted)', flexShrink: 0 }} />
                        <select value={filters.user_id} onChange={(e) => setFilters({ ...filters, user_id: e.target.value, page: 1 })} className="form-control" style={{ maxWidth: 200 }}>
                            <option value="">All Users</option>
                            {users.map(user => <option key={user.id} value={user.id}>{user.full_name}</option>)}
                        </select>
                        <select value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })} className="form-control" style={{ maxWidth: 180 }}>
                            <option value="">All Actions</option>
                            {actions.map(action => <option key={action} value={action}>{getActionLabel(action)}</option>)}
                        </select>
                        <input type="date" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value, page: 1 })} className="form-control" style={{ maxWidth: 160 }} placeholder="Filter by date" />
                        <button onClick={() => setFilters({ user_id: '', action: '', start_date: '', end_date: '', page: 1, limit: 50 })} className="btn btn-ghost btn-sm">Clear</button>
                    </div>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="empty-state"><div className="spinner spinner-lg" /><p className="mt-4">Loading logs…</p></div>
            ) : (
                <>
                    <div className="card" style={{ overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--color-bg-tertiary)', borderBottom: '2px solid var(--color-border)' }}>
                                        <th style={thStyle}>Time</th>
                                        <th style={thStyle}>User</th>
                                        <th style={thStyle}>Action</th>
                                        <th style={thStyle}>Details</th>
                                        <th style={thStyle}>IP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log, index) => (
                                        <tr key={log.id} style={{
                                            borderBottom: '1px solid var(--color-border-light)',
                                            background: index % 2 === 0 ? 'transparent' : 'var(--color-bg)',
                                            transition: 'background var(--dur-fast)'
                                        }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'hsla(226,70%,55%,.03)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : 'var(--color-bg)'}>
                                            <td style={tdStyle}>
                                                <span style={{ fontWeight: 500 }} className="text-sm">{formatTimeAgo(log.timestamp)}</span>
                                                <br /><span className="text-muted text-xs">{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                                            </td>
                                            <td style={tdStyle}>
                                                <div className="flex items-center gap-2">
                                                    <div style={{
                                                        width: 28, height: 28, borderRadius: 'var(--radius-full)',
                                                        background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#fff', fontSize: 'var(--text-xs)', fontWeight: 600
                                                    }}>
                                                        {log.full_name?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium">{log.full_name || 'Unknown'}</span>
                                                        <br /><span className="text-muted text-xs">@{log.username}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                <span className={`badge ${getActionBadgeClass(log.action)}`} style={{ gap: 'var(--sp-1)' }}>
                                                    {getActionIcon(log.action)} {getActionLabel(log.action)}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <span className="text-secondary text-sm">
                                                    {log.resource_type ? `${log.resource_type}${log.resource_id ? ` #${log.resource_id}` : ''}` : '—'}
                                                </span>
                                            </td>
                                            <td style={tdStyle}><code>{log.ip_address || '—'}</code></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {logs.length === 0 && (
                            <div className="empty-state">
                                <ClockIcon style={{ width: 48, height: 48 }} />
                                <h3>No activity logs</h3>
                                <p>No logs match your filters.</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-6">
                            <button onClick={() => setFilters({ ...filters, page: filters.page - 1 })} className="btn btn-secondary btn-sm" disabled={filters.page === 1}>
                                <ArrowLeftIcon style={{ width: 14, height: 14 }} /> Previous
                            </button>
                            <span className="text-sm text-secondary">Page {pagination.page} of {pagination.pages} · {pagination.total} entries</span>
                            <button onClick={() => setFilters({ ...filters, page: filters.page + 1 })} className="btn btn-secondary btn-sm" disabled={filters.page >= pagination.pages}>
                                Next <ArrowRightIcon style={{ width: 14, height: 14 }} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

const iconSm = { width: 14, height: 14 };
const thStyle = { padding: 'var(--sp-3) var(--sp-5)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--color-text-secondary)' };
const tdStyle = { padding: 'var(--sp-3) var(--sp-5)', fontSize: 'var(--text-sm)' };

export default ActivityLogs;
