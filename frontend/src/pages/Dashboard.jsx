import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI, logbookAPI, errorsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    FolderIcon,
    BookOpenIcon,
    ExclamationTriangleIcon,
    ArrowRightIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';

function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalProjects: 0,
        recentActivities: 0,
        pendingErrors: 0,
        loading: true
    });
    const [recentProjects, setRecentProjects] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [projectsRes, logbookRes, errorsRes] = await Promise.all([
                projectsAPI.getAll({ limit: 6 }),
                logbookAPI.getAll({ limit: 5 }),
                errorsAPI.getAll({ status: 'Pending', limit: 10 })
            ]);

            setStats({
                totalProjects: projectsRes.data.pagination?.total || 0,
                recentActivities: logbookRes.data.pagination?.total || 0,
                pendingErrors: errorsRes.data.pagination?.total || 0,
                loading: false
            });

            setRecentProjects(projectsRes.data.projects || []);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            setStats(prev => ({ ...prev, loading: false }));
        }
    };

    const statCards = [
        {
            label: 'Total Projects',
            value: stats.totalProjects,
            accent: 'primary',
            Icon: FolderIcon
        },
        {
            label: 'Logbook Entries',
            value: stats.recentActivities,
            accent: 'success',
            Icon: BookOpenIcon
        },
        {
            label: 'Pending Errors',
            value: stats.pendingErrors,
            accent: 'danger',
            Icon: ExclamationTriangleIcon
        }
    ];

    return (
        <div className="animate-slide-up">
            {/* Page Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 style={{ marginBottom: 'var(--sp-1)' }}>Dashboard</h1>
                    <p className="text-secondary" style={{ margin: 0 }}>
                        Welcome back, <strong>{user?.full_name}</strong>
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 mb-8 stagger">
                {statCards.map((card) => (
                    <div key={card.label} className={`card stat-card stat-card--${card.accent}`}>
                        <div className="card-body">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-muted font-medium" style={{ margin: 0, marginBottom: 'var(--sp-2)' }}>
                                        {card.label}
                                    </p>
                                    <span className="stat-value">
                                        {stats.loading ? '–' : card.value}
                                    </span>
                                </div>
                                <div className={`stat-icon stat-icon--${card.accent}`}>
                                    <card.Icon style={{ width: 22, height: 22 }} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Projects */}
            <div className="card">
                <div className="card-header">
                    <div className="flex justify-between items-center">
                        <h3 style={{ margin: 0 }}>Recent Projects</h3>
                        <Link to="/projects" className="btn btn-ghost btn-sm">
                            View All <ArrowRightIcon style={{ width: 14, height: 14 }} />
                        </Link>
                    </div>
                </div>
                <div className="card-body">
                    {stats.loading ? (
                        <div className="empty-state" style={{ padding: 'var(--sp-10)' }}>
                            <div className="spinner spinner-lg" />
                        </div>
                    ) : recentProjects.length === 0 ? (
                        <div className="empty-state">
                            <FolderIcon style={{ width: 48, height: 48 }} />
                            <h3>No projects yet</h3>
                            <p>Create your first project to get started!</p>
                            <Link to="/projects" className="btn btn-primary">
                                Go to Projects
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 stagger">
                            {recentProjects.map(project => (
                                <Link
                                    key={project.id}
                                    to={`/projects/${project.id}`}
                                    className="card card-interactive"
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    <div className="card-body" style={{ padding: 'var(--sp-5)' }}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="stat-icon stat-icon--primary" style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)' }}>
                                                <DocumentTextIcon style={{ width: 16, height: 16 }} />
                                            </div>
                                            <span className="badge badge-primary">{project.category}</span>
                                        </div>
                                        <h4 style={{ marginBottom: 'var(--sp-1)', fontSize: 'var(--text-md)' }}>{project.name}</h4>
                                        <p className="text-secondary line-clamp-2" style={{
                                            fontSize: 'var(--text-sm)',
                                            marginBottom: 'var(--sp-4)'
                                        }}>
                                            {project.description}
                                        </p>
                                        <div className="flex justify-between items-center" style={{
                                            paddingTop: 'var(--sp-3)',
                                            borderTop: '1px solid var(--color-border-light)'
                                        }}>
                                            <span className="text-xs text-muted">{project.doc_count || 0} docs</span>
                                            <span className="text-xs text-muted">by {project.creator_name}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
