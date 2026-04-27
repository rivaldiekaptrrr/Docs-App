import { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ExclamationCircleIcon,
    InformationCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const ToastContext = createContext();

let toastId = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef({});

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
            if (timersRef.current[id]) {
                clearTimeout(timersRef.current[id]);
                delete timersRef.current[id];
            }
        }, 280);
    }, []);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, message, type, exiting: false }]);
        if (duration > 0) {
            timersRef.current[id] = setTimeout(() => removeToast(id), duration);
        }
        return id;
    }, [removeToast]);

    const toast = useCallback((message, type = 'info', duration = 4000) => {
        return addToast(message, type, duration);
    }, [addToast]);

    toast.success = (msg, dur) => addToast(msg, 'success', dur ?? 3500);
    toast.error = (msg, dur) => addToast(msg, 'error', dur ?? 5000);
    toast.warning = (msg, dur) => addToast(msg, 'warning', dur ?? 4500);
    toast.info = (msg, dur) => addToast(msg, 'info', dur ?? 4000);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

const ICONS = {
    success: CheckCircleIcon,
    error: ExclamationCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon
};

function ToastContainer({ toasts, removeToast }) {
    if (toasts.length === 0) return null;

    return (
        <div className="toast-container" aria-live="polite">
            {toasts.map(t => {
                const Icon = ICONS[t.type] || ICONS.info;
                return (
                    <div
                        key={t.id}
                        className={`toast toast--${t.type} ${t.exiting ? 'toast--exit' : ''}`}
                        role="alert"
                    >
                        <Icon className="toast-icon" />
                        <span className="toast-msg">{t.message}</span>
                        <button
                            className="toast-close"
                            onClick={() => removeToast(t.id)}
                            aria-label="Dismiss"
                        >
                            <XMarkIcon />
                        </button>
                    </div>
                );
            })}

            <style>{`
                .toast-container {
                    position: fixed;
                    top: calc(var(--navbar-h, 60px) + var(--sp-4));
                    right: var(--sp-6);
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: var(--sp-3);
                    max-width: 420px;
                    pointer-events: none;
                }
                .toast {
                    display: flex;
                    align-items: flex-start;
                    gap: var(--sp-3);
                    padding: var(--sp-4) var(--sp-5);
                    border-radius: var(--radius-lg);
                    background: var(--color-bg-elevated);
                    border: 1px solid var(--color-border);
                    box-shadow: var(--shadow-lg);
                    font-size: var(--text-sm);
                    color: var(--color-text);
                    pointer-events: all;
                    animation: toastSlideIn 280ms var(--ease-in-out) both;
                    min-width: 320px;
                }
                .toast--exit {
                    animation: toastSlideOut 250ms var(--ease-in-out) both;
                }
                .toast-icon {
                    width: 20px; height: 20px;
                    flex-shrink: 0;
                    margin-top: 1px;
                }
                .toast-msg {
                    flex: 1;
                    line-height: var(--lh-sm);
                }
                .toast-close {
                    width: 20px; height: 20px;
                    background: none; border: none;
                    padding: 0; cursor: pointer;
                    color: var(--color-text-muted);
                    flex-shrink: 0;
                    display: flex; align-items: center; justify-content: center;
                    border-radius: var(--radius-sm);
                    transition: all var(--dur-fast);
                }
                .toast-close:hover { background: var(--color-bg-tertiary); color: var(--color-text); }
                .toast-close svg { width: 14px; height: 14px; }

                /* Type colors */
                .toast--success { border-left: 3px solid var(--color-success); }
                .toast--success .toast-icon { color: var(--color-success); }

                .toast--error { border-left: 3px solid var(--color-danger); }
                .toast--error .toast-icon { color: var(--color-danger); }

                .toast--warning { border-left: 3px solid var(--color-warning); }
                .toast--warning .toast-icon { color: var(--color-warning); }

                .toast--info { border-left: 3px solid var(--color-primary); }
                .toast--info .toast-icon { color: var(--color-primary); }

                @keyframes toastSlideIn {
                    from { opacity: 0; transform: translateX(100%) scale(.96); }
                    to   { opacity: 1; transform: translateX(0)    scale(1);   }
                }
                @keyframes toastSlideOut {
                    from { opacity: 1; transform: translateX(0)    scale(1);    max-height: 100px; }
                    to   { opacity: 0; transform: translateX(100%) scale(.92);  max-height: 0; padding: 0; margin: 0; }
                }
            `}</style>
        </div>
    );
}

export default ToastContext;
