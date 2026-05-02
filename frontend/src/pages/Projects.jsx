import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    PlusIcon,
    FunnelIcon,
    FolderIcon,
    TrashIcon,
    XMarkIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';

function Projects() {
    const { isRND } = useAuth();
    const toast = useToast();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ category: '', status: '' });
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, [filter]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await projectsAPI.getAll(filter);
            setProjects(response.data.projects || []);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSuccess = () => {
        setShowCreateModal(false);
        fetchProjects();
    };

    const handleDelete = async (e, id) => {
        e.preventDefault();
        if (!window.confirm('Are you sure you want to delete this project?')) return;
        try {
            await projectsAPI.delete(id);
            fetchProjects();
        } catch (error) {
            console.error('Failed to delete project:', error);
            toast.error('Failed to delete project');
        }
    };

    const getStatusClass = (status) => {
        return {
            'Completed': 'badge-success',
            'In Progress': 'badge-primary badge-dot',
            'On Hold': 'badge-warning',
            'Planning': 'badge-info'
        }[status] || 'badge-secondary';
    };

    return (
        <div className="animate-slide-up">
            {/* Page Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 style={{ marginBottom: 'var(--sp-1)' }}>Projects</h1>
                    <p className="text-secondary" style={{ margin: 0 }}>Browse and manage Tech projects</p>
                </div>
                {isRND() && (
                    <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                        <PlusIcon style={{ width: 18, height: 18 }} />
                        New Project
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="card-body" style={{ padding: 'var(--sp-4) var(--sp-6)' }}>
                    <div className="flex items-center gap-4">
                        <FunnelIcon style={{ width: 18, height: 18, color: 'var(--color-text-muted)', flexShrink: 0 }} />
                        <select
                            className="form-control"
                            style={{ maxWidth: 220 }}
                            value={filter.category}
                            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                        >
                            <option value="">All Categories</option>
                            <option value="Enterprise Application">Enterprise Application</option>
                            <option value="IoT & Automation">IoT & Automation</option>
                            <option value="Mobile Development">Mobile Development</option>
                        </select>
                        <select
                            className="form-control"
                            style={{ maxWidth: 180 }}
                            value={filter.status}
                            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                        >
                            <option value="">All Status</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="On Hold">On Hold</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Projects Grid */}
            {loading ? (
                <div className="empty-state">
                    <div className="spinner spinner-lg" />
                    <p className="mt-4">Loading projects…</p>
                </div>
            ) : projects.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <FolderIcon style={{ width: 48, height: 48 }} />
                        <h3>No projects found</h3>
                        <p>{isRND() ? 'Create your first project to get started!' : 'No projects match your filters.'}</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-3 stagger">
                    {projects.map(project => (
                        <Link
                            key={project.id}
                            to={`/projects/${project.id}`}
                            className="card card-interactive"
                            style={{ textDecoration: 'none', color: 'inherit', position: 'relative' }}
                        >
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="badge badge-primary">{project.category}</span>
                                    <div className="flex gap-2 items-center">
                                        <span className={`badge ${getStatusClass(project.status)}`}>
                                            {project.status}
                                        </span>
                                        {isRND() && (
                                            <button
                                                onClick={(e) => handleDelete(e, project.id)}
                                                className="btn btn-danger-ghost btn-icon btn-sm"
                                                title="Delete project"
                                            >
                                                <TrashIcon style={{ width: 14, height: 14 }} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="stat-icon stat-icon--primary" style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)' }}>
                                        <DocumentTextIcon style={{ width: 14, height: 14 }} />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: 'var(--text-md)' }}>{project.name}</h3>
                                </div>
                                <p className="text-secondary line-clamp-3" style={{
                                    fontSize: 'var(--text-sm)',
                                    marginBottom: 'var(--sp-4)'
                                }}>
                                    {project.description}
                                </p>
                                <div className="flex justify-between items-center" style={{
                                    paddingTop: 'var(--sp-3)',
                                    borderTop: '1px solid var(--color-border-light)'
                                }}>
                                    <span className="text-xs text-muted">By {project.creator_name}</span>
                                    <span className="text-xs text-muted">{project.doc_count || 0} documents</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Create Project Modal */}
            {showCreateModal && (
                <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <CreateProjectForm onClose={() => setShowCreateModal(false)} onSuccess={handleCreateSuccess} />
                    </div>
                </div>
            )}
        </div>
    );
}

function CreateProjectForm({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'Enterprise Application',
        status: 'In Progress',
        created_at: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await projectsAPI.create(formData);
            onSuccess();
        } catch (error) {
            console.error('Failed to create project:', error);
            toast.error('Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ width: '520px' }}>
            <div className="card-header">
                <div className="flex justify-between items-center">
                    <h2 style={{ margin: 0, fontSize: 'var(--text-xl)' }}>New Project</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm">
                        <XMarkIcon style={{ width: 20, height: 20 }} />
                    </button>
                </div>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Project Name</label>
                        <input
                            type="text"
                            className="form-control"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter project name"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Start Date</label>
                        <input
                            type="date"
                            className="form-control"
                            value={formData.created_at}
                            onChange={e => setFormData({ ...formData, created_at: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <select
                                className="form-control"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="Enterprise Application">Enterprise Application</option>
                                <option value="IoT & Automation">IoT & Automation</option>
                                <option value="Mobile Development">Mobile Development</option>
                                <option value="Research">Research</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select
                                className="form-control"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="In Progress">In Progress</option>
                                <option value="Planning">Planning</option>
                                <option value="Completed">Completed</option>
                                <option value="On Hold">On Hold</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-control"
                            rows="4"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe this project..."
                            required
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-3" style={{ marginTop: 'var(--sp-6)' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (
                                <><div className="spinner" /> Creating…</>
                            ) : (
                                <><PlusIcon style={{ width: 16, height: 16 }} /> Create Project</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Projects;
