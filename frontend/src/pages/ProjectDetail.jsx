import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, documentationAPI, projectMembersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    ArrowLeftIcon,
    PencilSquareIcon,
    TrashIcon,
    PlusIcon,
    DocumentTextIcon,
    EyeIcon,
    CalendarIcon,
    UserIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isRND, isAdmin } = useAuth();
    const toast = useToast();
    const [project, setProject] = useState(null);
    const [documentation, setDocumentation] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditProjectModal, setShowEditProjectModal] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);
    const [checkingAccess, setCheckingAccess] = useState(true);

    useEffect(() => { fetchProjectData(); checkAccess(); }, [id]);

    const checkAccess = async () => {
        try {
            setCheckingAccess(true);
            const response = await projectMembersAPI.checkAccess(id);
            setHasAccess(response.data.hasAccess || response.data.isAdmin);
        } catch (error) {
            console.error('Failed to check access:', error);
            setHasAccess(false);
        } finally {
            setCheckingAccess(false);
        }
    };

    const fetchProjectData = async () => {
        try {
            setLoading(true);
            const [projectRes, docsRes] = await Promise.all([
                projectsAPI.getById(id),
                documentationAPI.getByProject(id)
            ]);
            setProject(projectRes.data.project);
            setDocumentation(docsRes.data.documentation || []);
        } catch (error) {
            console.error('Failed to fetch project:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!window.confirm('Are you sure you want to delete this project? All documentation will also be deleted.')) return;
        try {
            await projectsAPI.delete(id);
            navigate('/projects');
        } catch (error) {
            toast.error('Failed to delete project');
        }
    };

    const handleDeleteDoc = async (e, docId) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this documentation?')) return;
        try {
            await documentationAPI.delete(docId);
            fetchProjectData();
        } catch (error) {
            toast.error('Failed to delete documentation');
        }
    };

    const handleEditSuccess = () => { setShowEditProjectModal(false); fetchProjectData(); };

    if (loading) {
        return (
            <div className="empty-state">
                <div className="spinner spinner-lg" />
                <p className="mt-4">Loading project…</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="card">
                <div className="empty-state">
                    <DocumentTextIcon style={{ width: 48, height: 48 }} />
                    <h3>Project not found</h3>
                    <p>The project you're looking for doesn't exist.</p>
                    <button onClick={() => navigate('/projects')} className="btn btn-primary">
                        <ArrowLeftIcon style={{ width: 16, height: 16 }} /> Back to Projects
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-slide-up">
            {/* Back */}
            <button onClick={() => navigate('/projects')} className="btn btn-ghost btn-sm mb-6">
                <ArrowLeftIcon style={{ width: 16, height: 16 }} /> Back to Projects
            </button>

            {/* Project Header */}
            <div className="card mb-6">
                <div className="card-body">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-2 flex-wrap">
                            <span className="badge badge-primary">{project.category}</span>
                            <span className={`badge ${project.status === 'Completed' ? 'badge-success' : 'badge-warning'} badge-dot`}>
                                {project.status}
                            </span>
                        </div>
                        {isRND() && hasAccess && (
                            <div className="flex gap-2">
                                <button onClick={() => setShowEditProjectModal(true)} className="btn btn-secondary btn-sm">
                                    <PencilSquareIcon style={{ width: 15, height: 15 }} /> Edit
                                </button>
                                <button onClick={handleDeleteProject} className="btn btn-danger-ghost btn-sm">
                                    <TrashIcon style={{ width: 15, height: 15 }} /> Delete
                                </button>
                            </div>
                        )}
                        {isRND() && !hasAccess && !checkingAccess && (
                            <div className="badge badge-warning">
                                <EyeIcon style={{ width: 14, height: 14 }} /> Read Only
                            </div>
                        )}
                    </div>
                    <h1 style={{ marginBottom: 'var(--sp-2)', fontSize: 'var(--text-2xl)' }}>{project.name}</h1>
                    <p className="text-secondary" style={{ marginBottom: 'var(--sp-4)' }}>{project.description}</p>
                    <div className="flex gap-4 flex-wrap text-sm text-muted">
                        <span className="flex items-center gap-1">
                            <UserIcon style={{ width: 14, height: 14 }} /> {project.creator_name}
                        </span>
                        <span className="flex items-center gap-1">
                            <CalendarIcon style={{ width: 14, height: 14 }} /> {new Date(project.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                            <DocumentTextIcon style={{ width: 14, height: 14 }} /> {documentation.length} documentation
                        </span>
                    </div>
                </div>
            </div>


            {/* Documentation List */}
            <div className="card">
                <div className="card-header">
                    <div className="flex justify-between items-center">
                        <h3 style={{ margin: 0 }}>Documentation</h3>
                        {isRND() && hasAccess && (
                            <button onClick={() => navigate(`/projects/${id}/documentation/new`)} className="btn btn-primary btn-sm">
                                <PlusIcon style={{ width: 16, height: 16 }} /> New Documentation
                            </button>
                        )}
                    </div>
                </div>
                <div className="card-body" style={{ padding: documentation.length === 0 ? undefined : 0 }}>
                    {documentation.length === 0 ? (
                        <div className="empty-state">
                            <DocumentTextIcon style={{ width: 48, height: 48 }} />
                            <h3>No documentation yet</h3>
                            <p>{isRND() ? 'Create your first document to get started!' : 'No documents available.'}</p>
                        </div>
                    ) : (
                        <div className="stagger">
                            {documentation.map((doc, idx) => (
                                <div
                                    key={doc.id}
                                    className="doc-row"
                                    onClick={() => navigate(`/projects/${id}/documentation/${doc.id}`)}
                                    style={{
                                        padding: 'var(--sp-4) var(--sp-6)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        borderBottom: idx < documentation.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                                        transition: 'background var(--dur-fast)'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-tertiary)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="stat-icon stat-icon--primary" style={{ width: 36, height: 36 }}>
                                            <DocumentTextIcon style={{ width: 18, height: 18 }} />
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: 'var(--text-base)' }}>{doc.title}</h4>
                                            <div className="flex gap-3 items-center text-xs text-muted mt-1">
                                                <span className="flex items-center gap-1">
                                                    <UserIcon style={{ width: 12, height: 12 }} /> {doc.author_name}
                                                </span>
                                                <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                                                <span className="flex items-center gap-1">
                                                    <EyeIcon style={{ width: 12, height: 12 }} /> {doc.views}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {isRND() && (
                                        <button
                                            onClick={(e) => handleDeleteDoc(e, doc.id)}
                                            className="btn btn-danger-ghost btn-icon btn-sm"
                                            title="Delete documentation"
                                        >
                                            <TrashIcon style={{ width: 15, height: 15 }} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>


            {/* Edit Project Modal */}
            {showEditProjectModal && (
                <div className="modal-backdrop" onClick={() => setShowEditProjectModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <EditProjectForm project={project} onClose={() => setShowEditProjectModal(false)} onSuccess={handleEditSuccess} />
                    </div>
                </div>
            )}
        </div>
    );
}

function EditProjectForm({ project, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: project.name,
        description: project.description,
        category: project.category,
        status: project.status
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await projectsAPI.update(project.id, formData);
            onSuccess();
        } catch (error) {
            toast.error('Failed to update project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ width: '520px' }}>
            <div className="card-header">
                <div className="flex justify-between items-center">
                    <h2 style={{ margin: 0, fontSize: 'var(--text-xl)' }}>Edit Project</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm">
                        <XMarkIcon style={{ width: 20, height: 20 }} />
                    </button>
                </div>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Project Name</label>
                        <input type="text" className="form-control" value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <select className="form-control" value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                <option value="Enterprise Application">Enterprise Application</option>
                                <option value="IoT & Automation">IoT & Automation</option>
                                <option value="Mobile Development">Mobile Development</option>
                                <option value="Research">Research</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-control" value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                <option value="In Progress">In Progress</option>
                                <option value="Planning">Planning</option>
                                <option value="Completed">Completed</option>
                                <option value="On Hold">On Hold</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-control" rows="4" value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })} required></textarea>
                    </div>
                    <div className="flex justify-end gap-3" style={{ marginTop: 'var(--sp-6)' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <><div className="spinner" /> Saving…</> : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ProjectDetail;
