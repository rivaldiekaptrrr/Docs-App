import { useState, useEffect } from 'react';
import { errorsAPI, getImageUrl } from '../services/api';
import ImagePasteZone from '../components/ImagePasteZone';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    PlusIcon,
    FunnelIcon,
    ExclamationTriangleIcon,
    TrashIcon,
    UserIcon,
    CheckCircleIcon,
    XMarkIcon,
    PhotoIcon
} from '@heroicons/react/24/outline';

function Errors() {
    const { isRND } = useAuth();
    const toast = useToast();
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ status: '', severity: '' });
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => { fetchErrors(); }, [filter]);

    const fetchErrors = async () => {
        try {
            setLoading(true);
            const cleanFilter = Object.fromEntries(Object.entries(filter).filter(([_, v]) => v !== ''));
            const response = await errorsAPI.getAll(cleanFilter);
            setErrors(response.data.errors || []);
        } catch (error) {
            console.error('Failed to fetch error reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSuccess = () => { setShowCreateModal(false); fetchErrors(); };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this error report?')) return;
        try { await errorsAPI.delete(id); fetchErrors(); } catch (error) { toast.error('Failed to delete error report'); }
    };

    const getStatusBadge = (status) => {
        const map = { 'Pending': 'badge-warning badge-dot', 'In Progress': 'badge-primary badge-dot', 'Solved': 'badge-success' };
        return <span className={`badge ${map[status] || 'badge-secondary'}`}>{status}</span>;
    };

    const getSeverityBadge = (severity) => {
        const map = { 'Low': 'badge-info', 'Medium': 'badge-warning', 'High': 'badge-danger', 'Critical': 'badge-danger' };
        return <span className={`badge ${map[severity] || 'badge-secondary'}`}>{severity}</span>;
    };

    const getImages = (imgData) => {
        if (!imgData) return [];
        if (Array.isArray(imgData)) return imgData;
        try { return JSON.parse(imgData); } catch { return []; }
    };

    return (
        <div className="animate-slide-up">
            {/* Page Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 style={{ marginBottom: 'var(--sp-1)' }}>Error Reports</h1>
                    <p className="text-secondary" style={{ margin: 0 }}>Track and resolve technical issues</p>
                </div>
                {isRND() && (
                    <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                        <PlusIcon style={{ width: 18, height: 18 }} /> Report Error
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="card-body" style={{ padding: 'var(--sp-4) var(--sp-6)' }}>
                    <div className="flex items-center gap-4">
                        <FunnelIcon style={{ width: 18, height: 18, color: 'var(--color-text-muted)', flexShrink: 0 }} />
                        <select className="form-control" style={{ maxWidth: 160 }} value={filter.status}
                            onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
                            <option value="">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Solved">Solved</option>
                        </select>
                        <select className="form-control" style={{ maxWidth: 160 }} value={filter.severity}
                            onChange={(e) => setFilter({ ...filter, severity: e.target.value })}>
                            <option value="">All Severity</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Error Reports List */}
            {loading ? (
                <div className="empty-state"><div className="spinner spinner-lg" /><p className="mt-4">Loading reports…</p></div>
            ) : errors.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <ExclamationTriangleIcon style={{ width: 48, height: 48 }} />
                        <h3>No error reports</h3>
                        <p>No reports match your filters.</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4 stagger">
                    {errors.map(error => {
                        const beforeImages = getImages(error.before_images);
                        const afterImages = getImages(error.after_images);
                        return (
                            <div key={error.id} className="card">
                                <div className="card-body">
                                    {/* Header Row */}
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex gap-2 items-center">
                                            {getStatusBadge(error.status)}
                                            {getSeverityBadge(error.severity)}
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <span className="text-xs text-muted">{new Date(error.created_at).toLocaleDateString()}</span>
                                            {isRND() && (
                                                <button onClick={() => handleDelete(error.id)} className="btn btn-danger-ghost btn-icon btn-sm" title="Delete">
                                                    <TrashIcon style={{ width: 15, height: 15 }} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <h3 style={{ marginBottom: 'var(--sp-4)', fontSize: 'var(--text-lg)' }}>{error.title}</h3>

                                    {/* Before Section */}
                                    <div style={{
                                        padding: 'var(--sp-4)',
                                        background: 'var(--color-danger-subtle)',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: 'var(--sp-4)',
                                        borderLeft: '3px solid var(--color-danger)'
                                    }}>
                                        <h5 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-danger)' }}>
                                            <ExclamationTriangleIcon style={{ width: 14, height: 14, display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                                            Issue
                                        </h5>
                                        <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--color-text-secondary)', margin: 0 }}>{error.description}</p>
                                        {beforeImages.length > 0 && (
                                            <div className="img-grid mt-3">
                                                {beforeImages.map((img, idx) => (
                                                    <img key={idx} src={getImageUrl(img.url)} alt={img.caption} className="img-thumb"
                                                        style={{ maxHeight: 240, objectFit: 'contain', background: '#fff' }}
                                                        onClick={() => window.open(getImageUrl(img.url), '_blank')} />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* After Section */}
                                    {(error.solution || afterImages.length > 0) && (
                                        <div style={{
                                            padding: 'var(--sp-4)',
                                            background: 'var(--color-success-subtle)',
                                            borderRadius: 'var(--radius-md)',
                                            marginBottom: 'var(--sp-4)',
                                            borderLeft: '3px solid var(--color-success)'
                                        }}>
                                            <h5 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-success)' }}>
                                                <CheckCircleIcon style={{ width: 14, height: 14, display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                                                Solution
                                            </h5>
                                            {error.solution && (
                                                <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--color-text-secondary)', margin: 0 }}>{error.solution}</p>
                                            )}
                                            {afterImages.length > 0 && (
                                                <div className="img-grid mt-3">
                                                    {afterImages.map((img, idx) => (
                                                        <img key={idx} src={getImageUrl(img.url)} alt={img.caption} className="img-thumb"
                                                            style={{ maxHeight: 240, objectFit: 'contain', background: '#fff' }}
                                                            onClick={() => window.open(getImageUrl(img.url), '_blank')} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className="flex justify-between items-center text-xs text-muted" style={{
                                        paddingTop: 'var(--sp-3)', borderTop: '1px solid var(--color-border-light)'
                                    }}>
                                        <span className="flex items-center gap-1">
                                            <UserIcon style={{ width: 12, height: 12 }} /> Reported by {error.reporter_name}
                                        </span>
                                        {error.solver_name && (
                                            <span className="flex items-center gap-1">
                                                <CheckCircleIcon style={{ width: 12, height: 12, color: 'var(--color-success)' }} /> Solved by {error.solver_name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <CreateErrorForm onClose={() => setShowCreateModal(false)} onSuccess={handleCreateSuccess} />
                    </div>
                </div>
            )}
        </div>
    );
}

function CreateErrorForm({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        title: '', description: '', solution: '',
        severity: 'Medium', status: 'Pending',
        before_images: [], after_images: [],
        created_at: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await errorsAPI.create({ ...formData, before_images: formData.before_images, after_images: formData.after_images });
            onSuccess();
        } catch (error) {
            toast.error('Failed to create error report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ width: '700px' }}>
            <div className="card-header">
                <div className="flex justify-between items-center">
                    <h2 style={{ margin: 0, fontSize: 'var(--text-xl)' }}>Report New Error</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm">
                        <XMarkIcon style={{ width: 20, height: 20 }} />
                    </button>
                </div>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Title</label>
                            <input type="text" className="form-control" value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })} required placeholder="Error title" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date</label>
                            <input type="date" className="form-control" value={formData.created_at}
                                onChange={e => setFormData({ ...formData, created_at: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Severity</label>
                        <select className="form-control" value={formData.severity}
                            onChange={e => setFormData({ ...formData, severity: e.target.value })}>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>

                    {/* BEFORE SECTION */}
                    <div style={{
                        background: 'var(--color-danger-subtle)',
                        padding: 'var(--sp-5)',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: 'var(--sp-5)',
                        borderLeft: '3px solid var(--color-danger)'
                    }}>
                        <h4 style={{ margin: '0 0 var(--sp-4)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-danger)' }}>
                            <ExclamationTriangleIcon style={{ width: 16, height: 16, display: 'inline', verticalAlign: '-3px', marginRight: 6 }} />
                            Before (The Issue)
                        </h4>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea className="form-control" rows="3" value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe the error..." required style={{ background: '#fff' }}></textarea>
                        </div>
                        <ImagePasteZone images={formData.before_images}
                            onImagesChange={(newImages) => setFormData(prev => ({ ...prev, before_images: newImages }))}
                            uploadType="errors" label="Before Images" disabled={loading} />
                    </div>

                    {/* AFTER SECTION */}
                    <div style={{
                        background: 'var(--color-success-subtle)',
                        padding: 'var(--sp-5)',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: 'var(--sp-5)',
                        borderLeft: '3px solid var(--color-success)'
                    }}>
                        <h4 style={{ margin: '0 0 var(--sp-4)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-success)' }}>
                            <CheckCircleIcon style={{ width: 16, height: 16, display: 'inline', verticalAlign: '-3px', marginRight: 6 }} />
                            After (The Solution) — Optional
                        </h4>
                        <div className="form-group">
                            <label className="form-label">Solution / Fix</label>
                            <textarea className="form-control" rows="3" value={formData.solution}
                                onChange={e => setFormData({ ...formData, solution: e.target.value })}
                                placeholder="Describe the fix..." style={{ background: '#fff' }}></textarea>
                        </div>
                        <ImagePasteZone images={formData.after_images}
                            onImagesChange={(newImages) => setFormData(prev => ({ ...prev, after_images: newImages }))}
                            uploadType="errors" label="After Images" disabled={loading} />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <><div className="spinner" /> Submitting…</> : <><PlusIcon style={{ width: 16, height: 16 }} /> Submit Report</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Errors;
