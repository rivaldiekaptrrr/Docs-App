import { useState, useEffect } from 'react';
import { projectsAPI, projectMembersAPI, usersAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
    UserPlusIcon,
    TrashIcon,
    XMarkIcon,
    UserGroupIcon,
    FolderIcon,
    MagnifyingGlassIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    CheckIcon
} from '@heroicons/react/24/outline';

function ProjectAccess() {
    const [projects, setProjects] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedProject, setExpandedProject] = useState(null);
    const [projectMembers, setProjectMembers] = useState({});
    const [loadingMembers, setLoadingMembers] = useState({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [addingTo, setAddingTo] = useState(null);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [adding, setAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const toast = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [projectsRes, usersRes] = await Promise.all([
                projectsAPI.getAll({ limit: 100 }),
                usersAPI.getAll()
            ]);
            setProjects(projectsRes.data.projects || []);
            setAllUsers(usersRes.data.users || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async (projectId) => {
        try {
            setLoadingMembers(prev => ({ ...prev, [projectId]: true }));
            const response = await projectMembersAPI.getMembers(projectId);
            setProjectMembers(prev => ({ ...prev, [projectId]: response.data.members || [] }));
        } catch (error) {
            console.error('Failed to fetch members:', error);
            toast.error('Failed to load members');
        } finally {
            setLoadingMembers(prev => ({ ...prev, [projectId]: false }));
        }
    };

    const toggleProject = async (projectId) => {
        if (expandedProject === projectId) {
            setExpandedProject(null);
        } else {
            setExpandedProject(projectId);
            if (!projectMembers[projectId]) {
                fetchMembers(projectId);
            }
        }
    };

    const openAddModal = (project) => {
        setAddingTo(project);
        setSelectedUserIds([]);
        setUserSearchQuery('');

        // Load members if not already loaded to filter out existing members
        if (!projectMembers[project.id]) {
            fetchMembers(project.id);
        }

        setShowAddModal(true);
    };

    const toggleUserSelection = (userId) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleAddMember = async () => {
        if (selectedUserIds.length === 0 || !addingTo) return;
        setAdding(true);
        try {
            const promises = selectedUserIds.map(userId =>
                projectMembersAPI.addMember(addingTo.id, {
                    user_id: parseInt(userId),
                    role: 'editor'
                })
            );

            await Promise.all(promises);

            toast.success(`${selectedUserIds.length} member${selectedUserIds.length > 1 ? 's' : ''} added successfully`);
            setShowAddModal(false);
            fetchMembers(addingTo.id);
        } catch (error) {
            console.error('Failed to add members:', error);
            toast.error('Failed to add some members');
            // Refresh members to ensure list is up to date
            fetchMembers(addingTo.id);
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveMember = async (projectId, userId, username) => {
        if (!window.confirm(`Remove ${username} from this project?`)) return;
        try {
            await projectMembersAPI.removeMember(projectId, userId);
            toast.success('Member removed');
            fetchMembers(projectId);
        } catch (error) {
            toast.error('Failed to remove member');
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getAvailableUsers = (projectId) => {
        const members = projectMembers[projectId] || [];
        return allUsers.filter(u => !members.some(m => m.user_id === u.id));
    };

    if (loading) {
        return (
            <div className="empty-state">
                <div className="spinner spinner-lg" />
                <p className="mt-4">Loading projects...</p>
            </div>
        );
    }

    return (
        <div className="animate-slide-up">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="page-title">Project Access</h1>
                    <p className="text-secondary">Manage team members for each project. Only members can edit documentation.</p>
                </div>
            </div>

            {/* Search */}
            <div className="card mb-6">
                <div className="card-body" style={{ padding: 'var(--sp-3) var(--sp-4)' }}>
                    <div className="flex items-center gap-3">
                        <MagnifyingGlassIcon style={{ width: 20, height: 20, color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="form-input"
                            style={{ border: 'none', background: 'transparent', padding: 0, boxShadow: 'none' }}
                        />
                    </div>
                </div>
            </div>

            {/* Projects List */}
            <div className="space-y-3">
                {filteredProjects.map((project) => {
                    const isExpanded = expandedProject === project.id;
                    const members = projectMembers[project.id] || [];
                    const isLoadingMembers = loadingMembers[project.id];

                    return (
                        <div key={project.id} className="card" style={{ overflow: 'hidden' }}>
                            {/* Project Header */}
                            <div
                                className="flex justify-between items-center"
                                style={{
                                    padding: 'var(--sp-4) var(--sp-5)',
                                    cursor: 'pointer',
                                    transition: 'background var(--dur-fast)'
                                }}
                                onClick={() => toggleProject(project.id)}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-tertiary)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="stat-icon stat-icon--primary" style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)' }}>
                                        <FolderIcon style={{ width: 20, height: 20 }} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600 }}>
                                            {project.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="badge badge-secondary" style={{ fontSize: '11px' }}>
                                                {project.category}
                                            </span>
                                            <span className="text-xs text-muted flex items-center gap-1">
                                                <UserGroupIcon style={{ width: 12, height: 12 }} />
                                                {members.length > 0 ? `${members.length} members` : '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openAddModal(project); }}
                                        className="btn btn-primary btn-sm"
                                    >
                                        <UserPlusIcon style={{ width: 15, height: 15 }} />
                                        Add
                                    </button>
                                    {isExpanded
                                        ? <ChevronUpIcon style={{ width: 18, height: 18, color: 'var(--color-text-muted)' }} />
                                        : <ChevronDownIcon style={{ width: 18, height: 18, color: 'var(--color-text-muted)' }} />
                                    }
                                </div>
                            </div>

                            {/* Expanded Members List */}
                            {isExpanded && (
                                <div style={{ borderTop: '1px solid var(--color-border-light)' }}>
                                    {isLoadingMembers ? (
                                        <div className="flex items-center justify-center" style={{ padding: 'var(--sp-6)' }}>
                                            <div className="spinner" />
                                        </div>
                                    ) : members.length === 0 ? (
                                        <div style={{ padding: 'var(--sp-6)', textAlign: 'center' }}>
                                            <p className="text-muted" style={{ margin: 0 }}>No members yet. Click "Add" to assign team members.</p>
                                        </div>
                                    ) : (
                                        <div>
                                            {members.map((member, idx) => (
                                                <div
                                                    key={member.id}
                                                    className="flex items-center justify-between"
                                                    style={{
                                                        padding: 'var(--sp-3) var(--sp-5) var(--sp-3) var(--sp-8)',
                                                        borderBottom: idx < members.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                                                        background: 'var(--color-bg)'
                                                    }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            style={{
                                                                width: 32,
                                                                height: 32,
                                                                fontSize: 'var(--text-sm)',
                                                                borderRadius: 'var(--radius-full)',
                                                                background: 'var(--color-primary-subtle)',
                                                                color: 'var(--color-primary)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 600,
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            {(member.full_name || member.username || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>
                                                                {member.full_name || member.username}
                                                            </span>
                                                            <span className="text-xs text-muted" style={{ marginLeft: 'var(--sp-2)' }}>
                                                                {member.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="badge badge-secondary" style={{ fontSize: '11px' }}>
                                                            {member.user_role}
                                                        </span>
                                                        <button
                                                            onClick={() => handleRemoveMember(project.id, member.user_id, member.username)}
                                                            className="btn btn-danger-ghost btn-sm"
                                                            style={{ padding: '4px 6px' }}
                                                            title="Remove member"
                                                        >
                                                            <TrashIcon style={{ width: 14, height: 14 }} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {filteredProjects.length === 0 && (
                <div className="card">
                    <div className="empty-state">
                        <FolderIcon style={{ width: 48, height: 48, opacity: 0.3 }} />
                        <h3>No projects found</h3>
                        <p>{searchQuery ? 'No projects match your search.' : 'Create a project first.'}</p>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {showAddModal && addingTo && (
                <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title" style={{ margin: 0 }}>Add Member</h3>
                                <p className="text-sm text-muted" style={{ margin: 0, marginTop: 'var(--sp-1)' }}>
                                    Adding to <strong>{addingTo.name}</strong>
                                </p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="btn btn-ghost btn-sm">
                                <XMarkIcon style={{ width: 18, height: 18 }} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ padding: 0 }}>
                            <div style={{ padding: 'var(--sp-4)', borderBottom: '1px solid var(--color-border-light)' }}>
                                <div className="flex items-center gap-3 input-wrapper" style={{ background: 'var(--color-bg-secondary)', padding: 'var(--sp-2) var(--sp-3)', borderRadius: 'var(--radius-md)' }}>
                                    <MagnifyingGlassIcon style={{ width: 18, height: 18, color: 'var(--color-text-muted)' }} />
                                    <input
                                        type="text"
                                        placeholder="Search users to add..."
                                        value={userSearchQuery}
                                        onChange={(e) => setUserSearchQuery(e.target.value)}
                                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 'var(--text-sm)' }}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="user-list" style={{ maxHeight: '300px', overflowY: 'auto', padding: 'var(--sp-2)' }}>
                                {getAvailableUsers(addingTo.id)
                                    .filter(u =>
                                        (u.full_name || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                        u.username.toLowerCase().includes(userSearchQuery.toLowerCase())
                                    )
                                    .map(user => (
                                        <div
                                            key={user.id}
                                            onClick={() => toggleUserSelection(user.id)}
                                            className={`user-item ${selectedUserIds.includes(user.id) ? 'selected' : ''}`}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--sp-3)',
                                                padding: 'var(--sp-3)',
                                                borderRadius: 'var(--radius-md)',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s',
                                                marginBottom: '2px'
                                            }}
                                        >
                                            <div
                                                className="avatar"
                                                style={{
                                                    width: 36, height: 36,
                                                    borderRadius: '50%',
                                                    background: 'var(--color-primary-subtle)',
                                                    color: 'var(--color-primary)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 600, fontSize: '14px'
                                                }}
                                            >
                                                {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>
                                                    {user.full_name || user.username}
                                                </div>
                                                <div className="text-xs text-muted">
                                                    {user.email} • {user.role}
                                                </div>
                                            </div>
                                            {selectedUserIds.includes(user.id) && (
                                                <CheckIcon style={{ width: 20, height: 20, color: 'var(--color-primary)' }} />
                                            )}
                                        </div>
                                    ))}
                                {getAvailableUsers(addingTo.id).filter(u =>
                                    (u.full_name || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                    u.username.toLowerCase().includes(userSearchQuery.toLowerCase())
                                ).length === 0 && (
                                        <div className="text-center text-muted py-8">
                                            <p>No users found</p>
                                        </div>
                                    )}
                            </div>
                        </div>

                        <style>{`
                            .user-item:hover {
                                background: var(--color-bg-tertiary);
                            }
                            .user-item.selected {
                                background: var(--color-primary-subtle);
                                border: 1px solid var(--color-primary-light);
                            }
                        `}</style>
                        <div className="modal-footer">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddMember}
                                className="btn btn-primary"
                                disabled={adding || selectedUserIds.length === 0}
                            >
                                {adding ? (
                                    <><div className="spinner" style={{ width: 16, height: 16 }} /> Adding...</>
                                ) : (
                                    <><UserPlusIcon style={{ width: 16, height: 16 }} /> Add {selectedUserIds.length > 0 ? `${selectedUserIds.length} Members` : 'Member'}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .page-title {
                    font-size: var(--text-2xl);
                    font-weight: 700;
                    margin: 0;
                }
                .space-y-3 > * + * {
                    margin-top: var(--sp-3);
                }
                
                /* Modal Styles */
                .modal-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 100;
                    animation: fadeIn 0.2s ease-out;
                }
                .modal-content {
                    background: var(--color-bg-elevated);
                    border: 1px solid var(--color-border-light);
                    box-shadow: var(--shadow-xl);
                    border-radius: var(--radius-xl);
                    width: 100%;
                    max-width: 480px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .modal-header {
                    padding: var(--sp-4) var(--sp-6);
                    border-bottom: 1px solid var(--color-border-light);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: var(--color-bg-elevated);
                }
                .modal-footer {
                    padding: var(--sp-4) var(--sp-6);
                    background: var(--color-bg-tertiary);
                    border-top: 1px solid var(--color-border-light);
                    display: flex;
                    justify-content: flex-end;
                    gap: var(--sp-3);
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

export default ProjectAccess;
