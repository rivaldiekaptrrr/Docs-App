import { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
    Cog6ToothIcon,
    ShieldCheckIcon,
    ArrowUpTrayIcon,
    BuildingOffice2Icon,
    CheckCircleIcon,
    ClockIcon,
    LockClosedIcon,
    KeyIcon,
    DocumentIcon,
    PaperClipIcon,
    WrenchIcon
} from '@heroicons/react/24/outline';

function SystemSettings() {
    const toast = useToast();
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editedSettings, setEditedSettings] = useState({});
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await settingsAPI.getAll();
            setSettings(response.data.settings || []);
            const initial = {};
            response.data.settings.forEach(s => { initial[s.setting_key] = s.setting_value; });
            setEditedSettings(initial);
            setHasChanges(false);
        } catch (error) { console.error('Failed to fetch settings:', error); } finally { setLoading(false); }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const updates = Object.entries(editedSettings).map(([key, value]) => ({ key, value }));
            await settingsAPI.bulkUpdate(updates);
            toast.success('Settings saved successfully!');
            fetchSettings();
        } catch (error) { toast.error(error.response?.data?.error || 'Failed to save settings'); } finally { setSaving(false); }
    };

    const handleChange = (key, value) => { setEditedSettings({ ...editedSettings, [key]: value }); setHasChanges(true); };

    const getSettingIcon = (key) => {
        const map = {
            'session_timeout_hours': ClockIcon,
            'max_login_attempts': LockClosedIcon,
            'password_min_length': KeyIcon,
            'max_file_size_mb': PaperClipIcon,
            'allowed_file_extensions': DocumentIcon,
            'company_name': BuildingOffice2Icon
        };
        return map[key] || WrenchIcon;
    };

    const getSettingLabel = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    if (loading) {
        return (
            <div className="animate-slide-up">
                <div className="mb-8"><h1 style={{ marginBottom: 'var(--sp-1)' }}>System Settings</h1><p className="text-secondary" style={{ margin: 0 }}>Configure system behavior and defaults</p></div>
                <div className="empty-state"><div className="spinner spinner-lg" /><p className="mt-4">Loading settings…</p></div>
            </div>
        );
    }

    const securitySettings = settings.filter(s => ['session_timeout_hours', 'max_login_attempts', 'password_min_length'].includes(s.setting_key));
    const fileSettings = settings.filter(s => ['max_file_size_mb', 'allowed_file_extensions'].includes(s.setting_key));
    const brandingSettings = settings.filter(s => ['company_name'].includes(s.setting_key));
    const otherSettings = settings.filter(s =>
        !['session_timeout_hours', 'max_login_attempts', 'password_min_length', 'max_file_size_mb', 'allowed_file_extensions', 'company_name'].includes(s.setting_key)
    );

    return (
        <div className="animate-slide-up">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 style={{ marginBottom: 'var(--sp-1)' }}>System Settings</h1>
                    <p className="text-secondary" style={{ margin: 0 }}>Configure system behavior and defaults</p>
                </div>
                <button onClick={handleSave} className={`btn ${hasChanges ? 'btn-primary' : 'btn-secondary'}`} disabled={saving || !hasChanges}>
                    {saving ? (
                        <><div className="spinner" /> Saving…</>
                    ) : hasChanges ? (
                        'Save Changes'
                    ) : (
                        <><CheckCircleIcon style={{ width: 16, height: 16 }} /> Saved</>
                    )}
                </button>
            </div>

            {/* Sections */}
            {brandingSettings.length > 0 && (
                <SettingsSection title="Branding" description="Customize how your application appears" icon={BuildingOffice2Icon}
                    settings={brandingSettings} editedSettings={editedSettings} onChange={handleChange} getSettingIcon={getSettingIcon} getSettingLabel={getSettingLabel} />
            )}
            {securitySettings.length > 0 && (
                <SettingsSection title="Security" description="Authentication and access control" icon={ShieldCheckIcon}
                    settings={securitySettings} editedSettings={editedSettings} onChange={handleChange} getSettingIcon={getSettingIcon} getSettingLabel={getSettingLabel} />
            )}
            {fileSettings.length > 0 && (
                <SettingsSection title="File Uploads" description="Configure upload limits and allowed types" icon={ArrowUpTrayIcon}
                    settings={fileSettings} editedSettings={editedSettings} onChange={handleChange} getSettingIcon={getSettingIcon} getSettingLabel={getSettingLabel} />
            )}
            {otherSettings.length > 0 && (
                <SettingsSection title="Other" description="Additional system configuration" icon={Cog6ToothIcon}
                    settings={otherSettings} editedSettings={editedSettings} onChange={handleChange} getSettingIcon={getSettingIcon} getSettingLabel={getSettingLabel} />
            )}

            {/* Fixed save bar */}
            {hasChanges && (
                <div style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    background: 'var(--color-bg-secondary)', backdropFilter: 'blur(12px)',
                    borderTop: '1px solid var(--color-border)',
                    padding: 'var(--sp-4) var(--sp-8)',
                    display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 'var(--sp-4)',
                    boxShadow: 'var(--shadow-lg)', zIndex: 100,
                    animation: 'slideUp 200ms var(--ease-in-out)'
                }}>
                    <span className="text-sm text-secondary">You have unsaved changes</span>
                    <button onClick={() => fetchSettings()} className="btn btn-secondary">Discard</button>
                    <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                        {saving ? <><div className="spinner" /> Saving…</> : 'Save All Changes'}
                    </button>
                </div>
            )}
        </div>
    );
}

function SettingsSection({ title, description, icon: SectionIcon, settings, editedSettings, onChange, getSettingIcon, getSettingLabel }) {
    return (
        <div className="card mb-6" style={{ overflow: 'visible' }}>
            <div className="card-header">
                <div className="flex items-center gap-3">
                    <div className="stat-icon stat-icon--primary" style={{ width: 32, height: 32 }}>
                        <SectionIcon style={{ width: 16, height: 16 }} />
                    </div>
                    <div>
                        <h4 style={{ margin: 0 }}>{title}</h4>
                        <p className="text-muted text-xs" style={{ margin: 0, marginTop: 2 }}>{description}</p>
                    </div>
                </div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
                {settings.map((setting, index) => {
                    const Icon = getSettingIcon(setting.setting_key);
                    return (
                        <div key={setting.id} style={{
                            display: 'flex', alignItems: 'center', gap: 'var(--sp-5)',
                            padding: 'var(--sp-5) var(--sp-6)',
                            borderBottom: index < settings.length - 1 ? '1px solid var(--color-border-light)' : 'none'
                        }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 'var(--radius-md)',
                                background: 'var(--color-bg-tertiary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                <Icon style={{ width: 18, height: 18, color: 'var(--color-text-secondary)' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className="form-label" style={{ margin: 0 }}>{getSettingLabel(setting.setting_key)}</label>
                                {setting.description && <p className="text-muted text-xs" style={{ margin: 0, marginTop: 2 }}>{setting.description}</p>}
                            </div>
                            <div style={{ width: 280, flexShrink: 0 }}>
                                {setting.setting_type === 'number' ? (
                                    <input type="number" value={editedSettings[setting.setting_key] || ''} onChange={(e) => onChange(setting.setting_key, e.target.value)} className="form-control" />
                                ) : setting.setting_type === 'boolean' ? (
                                    <select value={editedSettings[setting.setting_key] || 'false'} onChange={(e) => onChange(setting.setting_key, e.target.value)} className="form-control">
                                        <option value="true">Yes</option><option value="false">No</option>
                                    </select>
                                ) : (
                                    <input type="text" value={editedSettings[setting.setting_key] || ''} onChange={(e) => onChange(setting.setting_key, e.target.value)}
                                        className="form-control" style={setting.setting_type === 'json' ? { fontFamily: 'monospace', fontSize: 'var(--text-xs)' } : {}} />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default SystemSettings;
