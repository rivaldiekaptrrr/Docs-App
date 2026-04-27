import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ChartBarIcon,
    FolderIcon,
    BookOpenIcon,
    ExclamationTriangleIcon,
    UsersIcon,
    ClockIcon,
    Cog6ToothIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import {
    ChartBarIcon as ChartBarSolid,
    FolderIcon as FolderSolid,
    BookOpenIcon as BookOpenSolid,
    ExclamationTriangleIcon as ExclamationSolid,
    UsersIcon as UsersSolid,
    ClockIcon as ClockSolid,
    Cog6ToothIcon as CogSolid,
    UserGroupIcon as UserGroupSolid
} from '@heroicons/react/24/solid';

function Sidebar() {
    const location = useLocation();
    const { user } = useAuth();

    const menuItems = [
        { path: '/', label: 'Dashboard', Icon: ChartBarIcon, IconActive: ChartBarSolid },
        { path: '/projects', label: 'Projects', Icon: FolderIcon, IconActive: FolderSolid },
        { path: '/logbook', label: 'Logbook', Icon: BookOpenIcon, IconActive: BookOpenSolid },
        { path: '/errors', label: 'Error Reports', Icon: ExclamationTriangleIcon, IconActive: ExclamationSolid }
    ];

    const adminMenuItems = [
        { path: '/settings/users', label: 'Users', Icon: UsersIcon, IconActive: UsersSolid },
        { path: '/settings/project-access', label: 'Project Access', Icon: UserGroupIcon, IconActive: UserGroupSolid },
        { path: '/settings/activity', label: 'Activity', Icon: ClockIcon, IconActive: ClockSolid },
        { path: '/settings/system', label: 'Settings', Icon: Cog6ToothIcon, IconActive: CogSolid }
    ];

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <aside className="sidebar">
            <nav className="sidebar-nav">
                <div className="sidebar-section">
                    <span className="sidebar-section-label">Menu</span>
                    <ul className="sidebar-menu">
                        {menuItems.map((item) => {
                            const active = isActive(item.path);
                            const Icon = active ? item.IconActive : item.Icon;
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className={`sidebar-link ${active ? 'sidebar-link--active' : ''}`}
                                    >
                                        <Icon className="sidebar-link-icon" />
                                        <span>{item.label}</span>
                                        {active && <span className="sidebar-indicator" />}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {user?.role === 'Admin' && (
                    <div className="sidebar-section">
                        <span className="sidebar-section-label">Admin</span>
                        <ul className="sidebar-menu">
                            {adminMenuItems.map((item) => {
                                const active = isActive(item.path);
                                const Icon = active ? item.IconActive : item.Icon;
                                return (
                                    <li key={item.path}>
                                        <Link
                                            to={item.path}
                                            className={`sidebar-link ${active ? 'sidebar-link--active' : ''}`}
                                        >
                                            <Icon className="sidebar-link-icon" />
                                            <span>{item.label}</span>
                                            {active && <span className="sidebar-indicator" />}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </nav>

            <style>{`
                .sidebar {
                    width: var(--sidebar-w);
                    background: var(--color-bg-secondary);
                    border-right: 1px solid var(--color-border);
                    height: calc(100vh - var(--navbar-h));
                    position: sticky;
                    top: var(--navbar-h);
                    overflow-y: auto;
                    flex-shrink: 0;
                }
                .sidebar-nav {
                    padding: var(--sp-4) var(--sp-3);
                    display: flex;
                    flex-direction: column;
                    gap: var(--sp-6);
                }
                .sidebar-section-label {
                    display: block;
                    font-size: var(--text-xs);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: .06em;
                    color: var(--color-text-muted);
                    padding: 0 var(--sp-3) var(--sp-2);
                }
                .sidebar-menu {
                    list-style: none;
                    padding: 0; margin: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .sidebar-link {
                    display: flex;
                    align-items: center;
                    gap: var(--sp-3);
                    padding: var(--sp-2) var(--sp-3);
                    border-radius: var(--radius-md);
                    text-decoration: none;
                    color: var(--color-text-secondary);
                    font-size: var(--text-sm);
                    font-weight: 450;
                    position: relative;
                    transition: all var(--dur-fast) var(--ease-in-out);
                }
                .sidebar-link:hover {
                    background: var(--color-bg-tertiary);
                    color: var(--color-text);
                }
                .sidebar-link--active {
                    background: var(--color-primary-subtle);
                    color: var(--color-primary);
                    font-weight: 550;
                }
                .sidebar-link--active:hover {
                    background: var(--color-primary-subtle);
                    color: var(--color-primary);
                }
                .sidebar-link-icon {
                    width: 20px; height: 20px;
                    flex-shrink: 0;
                }
                .sidebar-indicator {
                    position: absolute;
                    right: 0;
                    top: 50%; transform: translateY(-50%);
                    width: 3px; height: 16px;
                    background: var(--color-primary);
                    border-radius: 2px 0 0 2px;
                }
            `}</style>
        </aside>
    );
}

export default Sidebar;
