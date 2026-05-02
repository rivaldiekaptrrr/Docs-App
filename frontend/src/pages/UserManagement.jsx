import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    PlusIcon,
    TrashIcon,
    PencilSquareIcon,
    KeyIcon,
    UsersIcon,
    XMarkIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    UserCircleIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

function UserManagement() {
    const { user: currentUser } = useAuth();
    const toast = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    useEffect(() => { fetchUsers(); }, [search, roleFilter]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = {};
            if (search) params.search = search;
            if (roleFilter) params.role = roleFilter;
            const response = await usersAPI.getAll(params);
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSuccess = () => { setShowCreateModal(false); fetchUsers(); };
    const handleEditSuccess = () => { setEditingUser(null); fetchUsers(); };

    const handleDelete = async (id, username) => {
        if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;
        try { await usersAPI.delete(id); fetchUsers(); } catch (error) { toast.error(error.response?.data?.error || 'Failed to delete user'); }
    };

    const handleResetPassword = async (id, username) => {
        const newPassword = prompt(`Enter new password for "${username}":`);
        if (!newPassword) return;
        if (newPassword.length < 8) { toast.warning('Password must be at least 8 characters long'); return; }
        try { await usersAPI.resetPassword(id, newPassword); toast.success('Password reset successfully'); } catch (error) { toast.error(error.response?.data?.error || 'Failed to reset password'); }
    };

    const getRoleBadge = (role) => {
        const map = { 'Admin': 'badge-danger', 'Tech': 'badge-primary', 'Viewer': 'badge-secondary' };
        return <span className={`badge ${map[role] || 'badge-secondary'}`}>{role}</span>;
    };

    const getAvatarColor = (role) => {
        if (role === 'Admin') return 'var(--color-danger)';
        if (role === 'Tech') return 'var(--color-primary)';
        return 'var(--color-text-muted)';
    };

    const stats = [
        { label: 'Total Users', value: users.length, accent: 'primary', Icon: UsersIcon },
        { label: 'Admins', value: users.filter(u => u.role === 'Admin').length, accent: 'danger', Icon: ShieldCheckIcon },
        { label: 'Tech Team', value: users.filter(u => u.role === 'Tech').length, accent: 'info', Icon: UserCircleIcon },
        { label: 'Viewers', value: users.filter(u => u.role === 'Viewer').length, accent: 'secondary', Icon: UsersIcon }
    ];

    return (
        <div className="animate-slide-up">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 style={{ marginBottom: 'var(--sp-1)' }}>User Management</h1>
                    <p className="text-secondary" style={{ margin: 0 }}>Manage users and their access roles</p>
                </div>
                <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                    <PlusIcon style={{ width: 18, height: 18 }} /> Add User
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 mb-6 stagger">
                {stats.map(s => (
                    <div key={s.label} className={`card stat-card stat-card--${s.accent}`}>
                        <div className="card-body">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-muted" style={{ margin: '0 0 var(--sp-2)' }}>{s.label}</p>
                                    <span className="stat-value">{s.value}</span>
                                </div>
                                <div className={`stat-icon stat-icon--${s.accent}`}>
                                    <s.Icon style={{ width: 20, height: 20 }} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="card-body" style={{ padding: 'var(--sp-4) var(--sp-6)' }}>
                    <div className="flex items-center gap-4">
                        <MagnifyingGlassIcon style={{ width: 18, height: 18, color: 'var(--color-text-muted)', flexShrink: 0 }} />
                        <input type="text" placeholder="Search users…" value={search}
                            onChange={(e) => setSearch(e.target.value)} className="form-control" style={{ maxWidth: 280 }} />
                        <FunnelIcon style={{ width: 18, height: 18, color: 'var(--color-text-muted)', flexShrink: 0 }} />
                        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="form-control" style={{ maxWidth: 160 }}>
                            <option value="">All Roles</option>
                            <option value="Admin">Admin</option>
                            <option value="Tech">Tech</option>
                            <option value="Viewer">Viewer</option>
                        </select>
                        {(search || roleFilter) && (
                            <button onClick={() => { setSearch(''); setRoleFilter(''); }} className="btn btn-ghost btn-sm">Clear</button>
                        )}
                    </div>
                </div>
            </div>

            {/* Users Table */}
            {loading ? (
                <div className="empty-state"><div className="spinner spinner-lg" /><p className="mt-4">Loading users…</p></div>
            ) : users.length === 0 ? (
                <div className="card"><div className="empty-state">
                    <UsersIcon style={{ width: 48, height: 48 }} />
                    <h3>No users found</h3>
                    <p>No users match your search criteria.</p>
                </div></div>
            ) : (
                <div className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--color-bg-tertiary)', borderBottom: '2px solid var(--color-border)' }}>
                                    <th style={thStyle}>User</th>
                                    <th style={thStyle}>Email</th>
                                    <th style={thStyle}>Role</th>
                                    <th style={thStyle}>Status</th>
                                    <th style={thStyle}>Last Login</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, index) => (
                                    <tr key={user.id} style={{
                                        borderBottom: '1px solid var(--color-border-light)',
                                        background: index % 2 === 0 ? 'transparent' : 'var(--color-bg)',
                                        transition: 'background var(--dur-fast)'
                                    }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'hsla(226,70%,55%,.03)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : 'var(--color-bg)'}>
                                        <td style={tdStyle}>
                                            <div className="flex items-center gap-3">
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: 'var(--radius-full)',
                                                    background: getAvatarColor(user.role),
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#fff', fontSize: 'var(--text-xs)', fontWeight: 600
                                                }}>
                                                    {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{user.full_name}</span>
                                                    <br /><span className="text-muted text-xs">@{user.username}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={tdStyle}><span className="text-secondary">{user.email || '—'}</span></td>
                                        <td style={tdStyle}>{getRoleBadge(user.role)}</td>
                                        <td style={tdStyle}>
                                            <span className={`badge ${user.status === 'Active' ? 'badge-success badge-dot' : 'badge-warning'}`}>{user.status}</span>
                                        </td>
                                        <td style={tdStyle}>
                                            <span className="text-muted text-xs">
                                                {user.last_login
                                                    ? new Date(user.last_login).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                    : '— Never —'}
                                            </span>
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                            <div className="flex gap-1" style={{ justifyContent: 'center' }}>
                                                <button onClick={() => setEditingUser(user)} className="btn btn-ghost btn-icon btn-sm" title="Edit">
                                                    <PencilSquareIcon style={{ width: 16, height: 16 }} />
                                                </button>
                                                <button onClick={() => handleResetPassword(user.id, user.username)} className="btn btn-ghost btn-icon btn-sm" title="Reset Password">
                                                    <KeyIcon style={{ width: 16, height: 16 }} />
                                                </button>
                                                {user.id !== currentUser?.id && (
                                                    <button onClick={() => handleDelete(user.id, user.username)} className="btn btn-danger-ghost btn-icon btn-sm" title="Delete">
                                                        <TrashIcon style={{ width: 16, height: 16 }} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showCreateModal && (
                <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <CreateUserForm onClose={() => setShowCreateModal(false)} onSuccess={handleCreateSuccess} />
                    </div>
                </div>
            )}
            {editingUser && (
                <div className="modal-backdrop" onClick={() => setEditingUser(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <EditUserForm user={editingUser} onClose={() => setEditingUser(null)} onSuccess={handleEditSuccess} />
                    </div>
                </div>
            )}
        </div>
    );
}

const thStyle = { padding: 'var(--sp-3) var(--sp-5)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--color-text-secondary)' };
const tdStyle = { padding: 'var(--sp-3) var(--sp-5)', fontSize: 'var(--text-sm)' };

function CreateUserForm({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({ username: '', password: '', full_name: '', email: '', role: 'Viewer', status: 'Active' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try { setLoading(true); await usersAPI.create(formData); onSuccess(); } catch (error) { toast.error(error.response?.data?.error || 'Failed to create user'); } finally { setLoading(false); }
    };

    return (
        <div className="card" style={{ width: '520px' }}>
            <div className="card-header">
                <div className="flex justify-between items-center">
                    <h2 style={{ margin: 0, fontSize: 'var(--text-xl)' }}>Create New User</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><XMarkIcon style={{ width: 20, height: 20 }} /></button>
                </div>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="form-label">Username *</label><input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="form-control" required placeholder="e.g. john.doe" /></div>
                        <div className="form-group"><label className="form-label">Password *</label><input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="form-control" required minLength={8} placeholder="Min 8 chars" /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Full Name *</label><input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="form-control" required placeholder="e.g. John Doe" /></div>
                    <div className="form-group"><label className="form-label">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="form-control" placeholder="e.g. john@company.local" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="form-label">Role *</label><select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="form-control"><option value="Viewer">Viewer</option><option value="Tech">Tech</option><option value="Admin">Admin</option></select></div>
                        <div className="form-group"><label className="form-label">Status *</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="form-control"><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
                    </div>
                    <div className="flex justify-end gap-3" style={{ marginTop: 'var(--sp-6)' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <><div className="spinner" /> Creating…</> : <><PlusIcon style={{ width: 16, height: 16 }} /> Create User</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function EditUserForm({ user, onClose, onSuccess }) {
    const [formData, setFormData] = useState({ full_name: user.full_name, email: user.email || '', role: user.role, status: user.status });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try { setLoading(true); await usersAPI.update(user.id, formData); onSuccess(); } catch (error) { toast.error(error.response?.data?.error || 'Failed to update user'); } finally { setLoading(false); }
    };

    return (
        <div className="card" style={{ width: '520px' }}>
            <div className="card-header">
                <div className="flex justify-between items-center">
                    <div><h2 style={{ margin: 0, fontSize: 'var(--text-xl)' }}>Edit User</h2><p className="text-muted text-xs" style={{ margin: 0, marginTop: 2 }}>@{user.username}</p></div>
                    <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><XMarkIcon style={{ width: 20, height: 20 }} /></button>
                </div>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label className="form-label">Full Name *</label><input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="form-control" required /></div>
                    <div className="form-group"><label className="form-label">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="form-control" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="form-label">Role *</label><select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="form-control"><option value="Viewer">Viewer</option><option value="Tech">Tech</option><option value="Admin">Admin</option></select></div>
                        <div className="form-group"><label className="form-label">Status *</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="form-control"><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
                    </div>
                    <div className="flex justify-end gap-3" style={{ marginTop: 'var(--sp-6)' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <><div className="spinner" /> Updating…</> : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UserManagement;
