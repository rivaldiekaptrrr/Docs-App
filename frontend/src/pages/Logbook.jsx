import { useState, useEffect } from 'react';
import { logbookAPI, getImageUrl } from '../services/api';
import ImagePasteZone from '../components/ImagePasteZone';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    PlusIcon,
    FunnelIcon,
    BookOpenIcon,
    PencilSquareIcon,
    TrashIcon,
    CalendarIcon,
    UserIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

function Logbook() {
    const { isRND } = useAuth();
    const toast = useToast();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ year: new Date().getFullYear(), month: '' });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);

    useEffect(() => { fetchEntries(); }, [filter]);

    const fetchEntries = async () => {
        try {
            setLoading(true);
            const response = await logbookAPI.getAll(filter);
            setEntries(response.data.entries || []);
        } catch (error) {
            console.error('Failed to fetch logbook entries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSuccess = () => { setShowCreateModal(false); fetchEntries(); };
    const handleEditSuccess = () => { setShowEditModal(false); setEditingEntry(null); fetchEntries(); };
    const handleEditClick = (entry) => { setEditingEntry(entry); setShowEditModal(true); };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return;
        try { await logbookAPI.delete(id); fetchEntries(); } catch (error) { toast.error('Failed to delete entry'); }
    };

    return (
        <div className="animate-slide-up">
            {/* Page Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 style={{ marginBottom: 'var(--sp-1)' }}>Daily Logbook</h1>
                    <p className="text-secondary" style={{ margin: 0 }}>Track daily activities and progress</p>
                </div>
                {isRND() && (
                    <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                        <PlusIcon style={{ width: 18, height: 18 }} /> New Entry
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="card-body" style={{ padding: 'var(--sp-4) var(--sp-6)' }}>
                    <div className="flex items-center gap-4">
                        <FunnelIcon style={{ width: 18, height: 18, color: 'var(--color-text-muted)', flexShrink: 0 }} />
                        <select className="form-control" style={{ maxWidth: 140 }} value={filter.year}
                            onChange={(e) => setFilter({ ...filter, year: e.target.value })}>
                            <option value="2026">2026</option>
                            <option value="2025">2025</option>
                            <option value="2024">2024</option>
                            <option value="2023">2023</option>
                        </select>
                        <select className="form-control" style={{ maxWidth: 160 }} value={filter.month}
                            onChange={(e) => setFilter({ ...filter, month: e.target.value })}>
                            <option value="">All Months</option>
                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                                <option key={i + 1} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Entries */}
            {loading ? (
                <div className="empty-state"><div className="spinner spinner-lg" /><p className="mt-4">Loading entries…</p></div>
            ) : entries.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <BookOpenIcon style={{ width: 48, height: 48 }} />
                        <h3>No logbook entries</h3>
                        <p>No entries found for this period.</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4 stagger">
                    {entries.map(entry => (
                        <div key={entry.id} className="card">
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="stat-icon stat-icon--primary" style={{ width: 36, height: 36 }}>
                                            <CalendarIcon style={{ width: 18, height: 18 }} />
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: 'var(--text-md)' }}>
                                                {new Date(entry.date).toLocaleDateString('id-ID', {
                                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                                })}
                                            </h3>
                                            <span className="text-xs text-muted flex items-center gap-1 mt-1">
                                                <UserIcon style={{ width: 12, height: 12 }} /> {entry.author_name}
                                            </span>
                                        </div>
                                    </div>
                                    {isRND() && (
                                        <div className="flex gap-1">
                                            <button onClick={() => handleEditClick(entry)} className="btn btn-ghost btn-icon btn-sm" title="Edit">
                                                <PencilSquareIcon style={{ width: 16, height: 16 }} />
                                            </button>
                                            <button onClick={() => handleDelete(entry.id)} className="btn btn-danger-ghost btn-icon btn-sm" title="Delete">
                                                <TrashIcon style={{ width: 16, height: 16 }} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <p className="whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)', margin: 0 }}>{entry.activity_description}</p>
                                {entry.attachments && (Array.isArray(entry.attachments) ? entry.attachments : []).length > 0 && (
                                    <div className="img-grid mt-4">
                                        {(Array.isArray(entry.attachments) ? entry.attachments : []).map((attachment, idx) => (
                                            <img key={idx} src={getImageUrl(attachment.url)} alt={attachment.caption}
                                                className="img-thumb" onClick={() => window.open(getImageUrl(attachment.url), '_blank')} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <LogbookForm onClose={() => setShowCreateModal(false)} onSuccess={handleCreateSuccess} />
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingEntry && (
                <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <LogbookForm entry={editingEntry} onClose={() => setShowEditModal(false)} onSuccess={handleEditSuccess} />
                    </div>
                </div>
            )}
        </div>
    );
}

function LogbookForm({ entry, onClose, onSuccess }) {
    const isEditing = !!entry;
    const [formData, setFormData] = useState({
        date: isEditing ? entry.date.split('T')[0] : new Date().toISOString().split('T')[0],
        activity_description: isEditing ? entry.activity_description : '',
        attachments: isEditing ? (Array.isArray(entry.attachments) ? entry.attachments : []) : []
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...formData, hours_spent: 0, attachments: formData.attachments };
            if (isEditing) { await logbookAPI.update(entry.id, payload); }
            else { await logbookAPI.create(payload); }
            onSuccess();
        } catch (error) {
            toast.error(`Failed to ${isEditing ? 'update' : 'create'} entry`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ width: '600px' }}>
            <div className="card-header">
                <div className="flex justify-between items-center">
                    <h2 style={{ margin: 0, fontSize: 'var(--text-xl)' }}>{isEditing ? 'Edit' : 'New'} Logbook Entry</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm">
                        <XMarkIcon style={{ width: 20, height: 20 }} />
                    </button>
                </div>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Date</label>
                        <input type="date" className="form-control" value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Activity Description</label>
                        <textarea className="form-control" rows="5" value={formData.activity_description}
                            onChange={e => setFormData({ ...formData, activity_description: e.target.value })}
                            placeholder="Describe your activity..." required></textarea>
                    </div>
                    <ImagePasteZone
                        images={formData.attachments}
                        onImagesChange={(newAttachments) => setFormData(prev => ({ ...prev, attachments: newAttachments }))}
                        uploadType="logbook" label="Attachments (Optional)" disabled={loading} />
                    <div className="flex justify-end gap-3" style={{ marginTop: 'var(--sp-6)' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <><div className="spinner" /> Saving…</> : isEditing ? 'Update Entry' : 'Save Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Logbook;
