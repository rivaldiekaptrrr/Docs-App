import { useState, useEffect } from 'react';
import { projectMembersAPI, usersAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
    UserPlusIcon,
    TrashIcon,
    XMarkIcon,
    UserGroupIcon,
    ShieldCheckIcon,
    PencilSquareIcon,
    EyeIcon
} from '@heroicons/react/24/outline';

function ProjectTeamMembers({ projectId, isAdmin }) {
    const [members, setMembers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRole, setSelectedRole] = useState('editor');
    const [adding, setAdding] = useState(false);
    const toast = useToast();

    useEffect(() => {
        fetchMembers();
        if (isAdmin) {
            fetchAllUsers();
        }
    }, [projectId, isAdmin]);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const response = await projectMembersAPI.getMembers(projectId);
            setMembers(response.data.members || []);
        } catch (error) {
            console.error('Failed to fetch members:', error);
            toast.error('Failed to load team members');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const response = await usersAPI.getAll();
            setAllUsers(response.data.users || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const handleAddMember = async () => {
        if (!selectedUserId) {
            toast.warning('Please select a user');
            return;
        }

        try {
            setAdding(true);
            await projectMembersAPI.addMember(projectId, {
                user_id: parseInt(selectedUserId),
                role: selectedRole
            });
            toast.success('Member added successfully');
            setShowAddModal(false);
            setSelectedUserId('');
            setSelectedRole('editor');
            fetchMembers();
        } catch (error) {
            console.error('Failed to add member:', error);
            toast.error(error.response?.data?.error || 'Failed to add member');
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveMember = async (userId, username) => {
        if (!window.confirm(`Remove ${username} from this project?`)) return;

        try {
            await projectMembersAPI.removeMember(projectId, userId);
            toast.success('Member removed successfully');
            fetchMembers();
        } catch (error) {
            console.error('Failed to remove member:', error);
            toast.error('Failed to remove member');
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'owner':
                return <ShieldCheckIcon style={{ width: 14, height: 14 }} />;
            case 'editor':
                return <PencilSquareIcon style={{ width: 14, height: 14 }} />;
            case 'viewer':
                return <EyeIcon style={{ width: 14, height: 14 }} />;
            default:
                return null;
        }
    };

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'owner':
                return 'badge-primary';
            case 'editor':
                return 'badge-success';
            case 'viewer':
                return 'badge-secondary';
            default:
                return 'badge-secondary';
        }
    };

    // Filter out users who are already members
    const availableUsers = allUsers.filter(
        user => !members.some(member => member.user_id === user.id)
    );

    if (loading) {
        return (
            <div className="card">
                <div className="card-body">
                    <div className="flex items-center justify-center py-8">
                        <div className="spinner spinner-lg" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <UserGroupIcon style={{ width: 20, height: 20 }} />
                        <h3 className="card-title">Team Members ({members.length})</h3>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn btn-primary btn-sm"
                        >
                            <UserPlusIcon style={{ width: 16, height: 16 }} />
                            Add Member
                        </button>
                    )}
                </div>
            </div>
            <div className="card-body">
                {members.length === 0 ? (
                    <div className="empty-state">
                        <UserGroupIcon style={{ width: 48, height: 48, opacity: 0.3 }} />
                        <p>No team members yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {members.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-hover transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="avatar">
                                        {member.full_name?.charAt(0) || member.username?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <div className="font-medium">{member.full_name || member.username}</div>
                                        <div className="text-sm text-secondary">{member.email}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`badge ${getRoleBadgeClass(member.role)}`}>
                                        {getRoleIcon(member.role)}
                                        {member.role}
                                    </span>
                                    <span className="badge badge-secondary">
                                        {member.user_role}
                                    </span>
                                    {isAdmin && member.role !== 'owner' && (
                                        <button
                                            onClick={() => handleRemoveMember(member.user_id, member.username)}
                                            className="btn btn-danger-ghost btn-sm"
                                            title="Remove member"
                                        >
                                            <TrashIcon style={{ width: 14, height: 14 }} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Member Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add Team Member</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="btn btn-ghost btn-sm"
                            >
                                <XMarkIcon style={{ width: 16, height: 16 }} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">User</label>
                                <select
                                    className="form-select"
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                >
                                    <option value="">Select a user...</option>
                                    {availableUsers.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.full_name || user.username} ({user.role})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role in Project</label>
                                <select
                                    className="form-select"
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                >
                                    <option value="editor">Editor - Can edit documentation</option>
                                    <option value="owner">Owner - Full access</option>
                                    <option value="viewer">Viewer - Read only</option>
                                </select>
                            </div>
                        </div>
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
                                disabled={adding || !selectedUserId}
                            >
                                {adding ? (
                                    <><div className="spinner" /> Adding...</>
                                ) : (
                                    <><UserPlusIcon style={{ width: 16, height: 16 }} /> Add Member</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProjectTeamMembers;
