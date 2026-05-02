import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    ArrowRightStartOnRectangleIcon,
    UserCircleIcon,
    SunIcon,
    MoonIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import logo from '../assets/logo2.png';

function Navbar() {
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <Link to="/" className="navbar-brand">
                    <span className="navbar-brand-icon">
                        <img src={logo} alt="DocuStack" className="navbar-logo" />
                    </span>
                    <span className="navbar-brand-text"></span>
                </Link>
            </div>

            <div className="navbar-right">
                {/* Search Shortcut */}
                <button
                    onClick={() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })); }}
                    className="navbar-search-btn"
                    title="Search (Ctrl+K)"
                >
                    <MagnifyingGlassIcon style={{ width: 16, height: 16 }} />
                    <span>Search…</span>
                    <kbd className="navbar-kbd">Ctrl K</kbd>
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="theme-toggle"
                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    aria-label="Toggle theme"
                >
                    {isDark ? <SunIcon /> : <MoonIcon />}
                </button>

                {user && (
                    <>
                        <div className="navbar-user">
                            <UserCircleIcon className="navbar-user-avatar" />
                            <div className="navbar-user-info">
                                <span className="navbar-user-name">{user.full_name}</span>
                                <span className={`badge ${user.role === 'Admin' ? 'badge-primary' :
                                    user.role === 'Tech' ? 'badge-success' : 'badge-secondary'
                                    }`}>
                                    {user.role}
                                </span>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="btn btn-ghost btn-sm navbar-logout" title="Logout">
                            <ArrowRightStartOnRectangleIcon />
                            <span>Logout</span>
                        </button>
                    </>
                )}
            </div>

            <style>{`
                .navbar {
                    border-bottom: 1px solid var(--color-border);
                    padding: 0 var(--sp-6);
                    height: var(--navbar-h);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    position: sticky;
                    top: 0;
                    z-index: 50;
                    backdrop-filter: blur(12px);
                    background: hsla(0, 0%, 100%, .88);
                    transition: background-color var(--dur-normal) var(--ease-in-out),
                                border-color var(--dur-normal) var(--ease-in-out);
                }
                [data-theme="dark"] .navbar {
                    background: hsla(224, 18%, 13%, .88);
                }
                .navbar-left { display: flex; align-items: center; }
                .navbar-brand {
                    display: flex;
                    align-items: center;
                    gap: var(--sp-2);
                    text-decoration: none;
                    color: var(--color-text);
                    transition: opacity var(--dur-fast) var(--ease-in-out);
                }
                .navbar-brand:hover { opacity: .8; }
                .navbar-brand-icon {
                    height: 32px;
                    max-width: 180px;
                    display: flex; align-items: center; justify-content: center;
                    background: transparent;
                    padding: 0;
                    overflow: hidden;
                }
                .navbar-logo {
                    width: auto;
                    height: 100%;
                    object-fit: contain;
                }
                .navbar-brand-text {
                    font-size: var(--text-lg);
                    font-weight: 700;
                    letter-spacing: -0.02em;
                }
                .navbar-right {
                    display: flex;
                    align-items: center;
                    gap: var(--sp-4);
                }
                .navbar-user {
                    display: flex;
                    align-items: center;
                    gap: var(--sp-3);
                }
                .navbar-user-avatar {
                    width: 32px; height: 32px;
                    color: var(--color-text-muted);
                }
                .navbar-user-info {
                    display: flex;
                    align-items: center;
                    gap: var(--sp-2);
                }
                .navbar-user-name {
                    font-size: var(--text-sm);
                    font-weight: 500;
                    color: var(--color-text);
                }
                .navbar-logout svg {
                    width: 18px; height: 18px;
                }
                .navbar-logout span {
                    font-size: var(--text-sm);
                }
                .navbar-search-btn {
                    display: flex; align-items: center; gap: var(--sp-2);
                    padding: var(--sp-2) var(--sp-3);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    background: var(--color-bg-tertiary);
                    color: var(--color-text-muted);
                    font-family: var(--font);
                    font-size: var(--text-sm);
                    cursor: pointer;
                    transition: all var(--dur-fast) var(--ease-in-out);
                    min-width: 200px;
                }
                .navbar-search-btn:hover {
                    border-color: var(--color-border-focus);
                    color: var(--color-text);
                    box-shadow: var(--shadow-sm);
                }
                .navbar-kbd {
                    margin-left: auto;
                    font-family: var(--font);
                    font-size: 10px;
                    padding: 1px 5px;
                    background: var(--color-bg-secondary);
                    border: 1px solid var(--color-border);
                    border-radius: 3px;
                    color: var(--color-text-muted);
                    line-height: 1.4;
                }
            `}</style>
        </nav>
    );
}

export default Navbar;
