import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    UserIcon,
    LockClosedIcon,
    ExclamationCircleIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';
import logo from '../assets/logo.png';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Decorative background */}
            <div className="login-bg">
                <div className="login-bg-shape login-bg-shape--1" />
                <div className="login-bg-shape login-bg-shape--2" />
                <div className="login-bg-shape login-bg-shape--3" />
            </div>

            <div className="login-card animate-scale-in">
                {/* Brand */}
                <div className="login-brand">
                    <div className="login-brand-icon">
                        <img src={logo} alt="R&D Hub Logo" className="login-logo" />
                    </div>
                    <h1 className="login-title">R&D Elitech</h1>
                    <p className="login-subtitle">Knowledge Management System</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="login-alert animate-slide-up">
                        <ExclamationCircleIcon className="login-alert-icon" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="login-field">
                        <label className="form-label" htmlFor="username">Username</label>
                        <div className="login-input-wrap">
                            <UserIcon className="login-input-icon" />
                            <input
                                id="username"
                                type="text"
                                className="form-control login-input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                required
                                autoFocus
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div className="login-field">
                        <label className="form-label" htmlFor="password">Password</label>
                        <div className="login-input-wrap">
                            <LockClosedIcon className="login-input-icon" />
                            <input
                                id="password"
                                type="password"
                                className="form-control login-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg login-submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="spinner" />
                                <span>Signing in…</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span>Sign In</span>
                                <ArrowRightIcon style={{ width: 16, height: 16 }} />
                            </div>
                        )}
                    </button>
                </form>

                {/* Credentials hint */}
                <div className="login-hint">
                    <p className="login-hint-title">Demo Credentials</p>
                    <div className="login-hint-grid">
                        <div className="login-hint-item">
                            <span className="badge badge-danger">Admin</span>
                            <code>admin</code>
                        </div>
                        <div className="login-hint-item">
                            <span className="badge badge-success">R&D</span>
                            <code>ahmad.rnd</code>
                        </div>
                        <div className="login-hint-item">
                            <span className="badge badge-secondary">Viewer</span>
                            <code>budi.viewer</code>
                        </div>
                    </div>
                    <p className="login-hint-pw">
                        Admin: <code>admin123</code> | Others: <code>password123</code>
                    </p>
                </div>
            </div>

            <style>{`
                .login-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: hsl(226, 30%, 16%);
                    position: relative;
                    overflow: hidden;
                    padding: var(--sp-6);
                }
                .login-bg {
                    position: absolute;
                    inset: 0;
                    overflow: hidden;
                }
                .login-bg-shape {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: .4;
                }
                .login-bg-shape--1 {
                    width: 500px; height: 500px;
                    background: hsl(226, 70%, 55%);
                    top: -10%;  left: -5%;
                    animation: float1 12s ease-in-out infinite;
                }
                .login-bg-shape--2 {
                    width: 400px; height: 400px;
                    background: hsl(280, 60%, 50%);
                    bottom: -10%; right: -5%;
                    animation: float2 15s ease-in-out infinite;
                }
                .login-bg-shape--3 {
                    width: 300px; height: 300px;
                    background: hsl(190, 80%, 45%);
                    top: 40%; left: 50%;
                    animation: float3 10s ease-in-out infinite;
                }
                @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-20px)} }
                @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-25px,15px)} }
                @keyframes float3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-15px,-25px)} }

                .login-card {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    max-width: 420px;
                    background: hsla(0, 0%, 100%, .95);
                    backdrop-filter: blur(20px);
                    border-radius: var(--radius-xl);
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,.25);
                    padding: var(--sp-10);
                }
                [data-theme="dark"] .login-card {
                    background: hsla(224, 18%, 15%, .92);
                    border: 1px solid var(--color-border);
                }
                .login-brand {
                    text-align: center;
                    margin-bottom: var(--sp-8);
                }
                .login-brand-icon {
                    width: 80px; height: auto;
                    margin: 0 auto var(--sp-4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                }
                .login-logo {
                    width: 100%;
                    height: auto;
                    max-height: 120px;
                    object-fit: contain;
                }
                .login-title {
                    font-size: var(--text-2xl);
                    font-weight: 700;
                    letter-spacing: -.02em;
                    margin: 0 0 var(--sp-1);
                    color: var(--color-text);
                }
                .login-subtitle {
                    font-size: var(--text-sm);
                    color: var(--color-text-muted);
                    margin: 0;
                }

                .login-alert {
                    display: flex;
                    align-items: flex-start;
                    gap: var(--sp-2);
                    padding: var(--sp-3) var(--sp-4);
                    margin-bottom: var(--sp-6);
                    background: var(--color-danger-subtle);
                    color: var(--color-danger);
                    border-radius: var(--radius-md);
                    font-size: var(--text-sm);
                    border: 1px solid hsla(0, 72%, 56%, .15);
                }
                .login-alert-icon { width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }

                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: var(--sp-5);
                }
                .login-field { display: flex; flex-direction: column; gap: var(--sp-1); }
                .login-input-wrap {
                    position: relative;
                }
                .login-input-icon {
                    position: absolute;
                    left: var(--sp-3);
                    top: 50%; transform: translateY(-50%);
                    width: 18px; height: 18px;
                    color: var(--color-text-muted);
                    pointer-events: none;
                    transition: color var(--dur-fast);
                }
                .login-input {
                    padding-left: var(--sp-10) !important;
                }
                .login-input:focus + .login-input-icon,
                .login-input-wrap:focus-within .login-input-icon {
                    color: var(--color-primary);
                }
                .login-submit {
                    width: 100%;
                    margin-top: var(--sp-2);
                    font-size: var(--text-base) !important;
                    padding: var(--sp-3) var(--sp-6) !important;
                }

                .login-hint {
                    margin-top: var(--sp-6);
                    padding-top: var(--sp-5);
                    border-top: 1px solid var(--color-border-light);
                    text-align: center;
                }
                .login-hint-title {
                    font-size: var(--text-xs);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: .06em;
                    color: var(--color-text-muted);
                    margin-bottom: var(--sp-3);
                }
                .login-hint-grid {
                    display: flex;
                    justify-content: center;
                    gap: var(--sp-4);
                    margin-bottom: var(--sp-2);
                }
                .login-hint-item {
                    display: flex;
                    align-items: center;
                    gap: var(--sp-2);
                    font-size: var(--text-sm);
                }
                .login-hint-pw {
                    font-size: var(--text-xs);
                    color: var(--color-text-muted);
                    margin: 0;
                }
                .login-hint-pw code {
                    background: var(--color-bg-tertiary);
                    padding: .1em .4em;
                    border-radius: var(--radius-sm);
                    font-size: var(--text-xs);
                }
            `}</style>
        </div>
    );
}

export default Login;
