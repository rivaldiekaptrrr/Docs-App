import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI, errorsAPI, logbookAPI } from '../services/api';
import {
    MagnifyingGlassIcon,
    FolderIcon,
    BugAntIcon,
    BookOpenIcon,
    ArrowRightIcon,
    CommandLineIcon
} from '@heroicons/react/24/outline';

function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ projects: [], errors: [], logbook: [] });
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const debounceRef = useRef(null);

    // Ctrl+K to open
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(prev => !prev);
            }
            if (e.key === 'Escape' && open) {
                e.preventDefault();
                close();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open]);

    // Focus input on open
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
            setResults({ projects: [], errors: [], logbook: [] });
            setSelectedIndex(0);
        }
    }, [open]);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!query.trim()) {
            setResults({ projects: [], errors: [], logbook: [] });
            return;
        }
        setLoading(true);
        debounceRef.current = setTimeout(() => {
            doSearch(query.trim());
        }, 250);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query]);

    const doSearch = async (q) => {
        try {
            const [projRes, errRes, logRes] = await Promise.allSettled([
                projectsAPI.getAll({ search: q }),
                errorsAPI.getAll({ search: q }),
                logbookAPI.getAll({ search: q })
            ]);

            const projects = (projRes.status === 'fulfilled' ? projRes.value.data.projects || projRes.value.data : []).slice(0, 5);
            const errors = (errRes.status === 'fulfilled' ? errRes.value.data.errors || errRes.value.data : []).slice(0, 5);
            const logbook = (logRes.status === 'fulfilled' ? logRes.value.data.entries || logRes.value.data : []).slice(0, 5);

            setResults({ projects, errors, logbook });
            setSelectedIndex(0);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const close = () => {
        setOpen(false);
        setQuery('');
    };

    // Flatten results for keyboard navigation
    const flatItems = [
        ...results.projects.map(p => ({ type: 'project', data: p, path: `/projects/${p.id}`, label: p.name, sub: p.category })),
        ...results.errors.map(e => ({ type: 'error', data: e, path: `/errors`, label: e.title, sub: e.status })),
        ...results.logbook.map(l => ({ type: 'logbook', data: l, path: `/logbook`, label: l.activity || l.project_name, sub: l.date })),
    ];

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, flatItems.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && flatItems[selectedIndex]) {
            e.preventDefault();
            navigateTo(flatItems[selectedIndex].path);
        }
    };

    const navigateTo = (path) => {
        close();
        navigate(path);
    };

    const getIcon = (type) => {
        if (type === 'project') return <FolderIcon className="cp-item-icon" />;
        if (type === 'error') return <BugAntIcon className="cp-item-icon" />;
        return <BookOpenIcon className="cp-item-icon" />;
    };

    const getTypeLabel = (type) => {
        if (type === 'project') return 'Projects';
        if (type === 'error') return 'Error Reports';
        return 'Logbook';
    };

    if (!open) return null;

    const totalResults = flatItems.length;
    const hasQuery = query.trim().length > 0;

    return (
        <div className="cp-backdrop" onClick={close}>
            <div className="cp-dialog" onClick={(e) => e.stopPropagation()}>
                {/* Search Input */}
                <div className="cp-search">
                    <MagnifyingGlassIcon className="cp-search-icon" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="cp-search-input"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search projects, errors, logbook…"
                        autoComplete="off"
                        spellCheck={false}
                    />
                    <kbd className="cp-kbd">ESC</kbd>
                </div>

                {/* Results */}
                <div className="cp-results">
                    {!hasQuery && (
                        <div className="cp-empty">
                            <CommandLineIcon style={{ width: 36, height: 36, color: 'var(--color-text-muted)', marginBottom: 'var(--sp-3)' }} />
                            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                                Type to search across all your data
                            </p>
                            <div className="cp-shortcuts">
                                <span><kbd>↑↓</kbd> navigate</span>
                                <span><kbd>↵</kbd> open</span>
                                <span><kbd>esc</kbd> close</span>
                            </div>
                        </div>
                    )}

                    {hasQuery && loading && (
                        <div className="cp-empty">
                            <div className="spinner" />
                            <p style={{ margin: 'var(--sp-3) 0 0', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Searching…</p>
                        </div>
                    )}

                    {hasQuery && !loading && totalResults === 0 && (
                        <div className="cp-empty">
                            <MagnifyingGlassIcon style={{ width: 36, height: 36, color: 'var(--color-text-muted)', marginBottom: 'var(--sp-3)' }} />
                            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                                No results for "<strong>{query}</strong>"
                            </p>
                        </div>
                    )}

                    {hasQuery && !loading && totalResults > 0 && (
                        <div className="cp-groups">
                            {['project', 'error', 'logbook'].map(type => {
                                const items = flatItems.filter(i => i.type === type);
                                if (items.length === 0) return null;
                                return (
                                    <div key={type} className="cp-group">
                                        <div className="cp-group-label">{getTypeLabel(type)}</div>
                                        {items.map((item) => {
                                            const globalIdx = flatItems.indexOf(item);
                                            return (
                                                <button
                                                    key={`${type}-${item.data.id}`}
                                                    className={`cp-item ${globalIdx === selectedIndex ? 'cp-item--active' : ''}`}
                                                    onClick={() => navigateTo(item.path)}
                                                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                                                >
                                                    {getIcon(type)}
                                                    <div className="cp-item-text">
                                                        <span className="cp-item-label">{item.label}</span>
                                                        {item.sub && <span className="cp-item-sub">{item.sub}</span>}
                                                    </div>
                                                    <ArrowRightIcon className="cp-item-arrow" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {hasQuery && totalResults > 0 && (
                    <div className="cp-footer">
                        <span className="text-xs text-muted">{totalResults} result{totalResults !== 1 ? 's' : ''}</span>
                    </div>
                )}
            </div>

            <style>{`
                .cp-backdrop {
                    position: fixed; inset: 0;
                    background: hsla(220, 20%, 14%, .45);
                    backdrop-filter: blur(4px);
                    z-index: 9998;
                    display: flex; align-items: flex-start; justify-content: center;
                    padding-top: 12vh;
                    animation: fadeIn 120ms var(--ease-in-out);
                }
                [data-theme="dark"] .cp-backdrop {
                    background: hsla(224, 20%, 6%, .60);
                }
                .cp-dialog {
                    width: 100%; max-width: 560px;
                    background: var(--color-bg-elevated);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-xl);
                    box-shadow: var(--shadow-xl);
                    overflow: hidden;
                    animation: scaleIn 150ms var(--ease-in-out);
                }

                /* Search bar */
                .cp-search {
                    display: flex; align-items: center;
                    padding: var(--sp-4) var(--sp-5);
                    border-bottom: 1px solid var(--color-border-light);
                    gap: var(--sp-3);
                }
                .cp-search-icon { width: 20px; height: 20px; color: var(--color-text-muted); flex-shrink: 0; }
                .cp-search-input {
                    flex: 1; border: none; outline: none;
                    background: transparent;
                    font-family: var(--font);
                    font-size: var(--text-base);
                    color: var(--color-text);
                    line-height: var(--lh-base);
                }
                .cp-search-input::placeholder { color: var(--color-text-muted); }
                .cp-kbd {
                    font-family: var(--font);
                    font-size: var(--text-xs);
                    padding: 2px 6px;
                    background: var(--color-bg-tertiary);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-sm);
                    color: var(--color-text-muted);
                    line-height: 1;
                }

                /* Results */
                .cp-results {
                    max-height: 380px;
                    overflow-y: auto;
                }
                .cp-empty {
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    padding: var(--sp-10) var(--sp-6);
                    text-align: center;
                }
                .cp-shortcuts {
                    display: flex; gap: var(--sp-5);
                    margin-top: var(--sp-4);
                    font-size: var(--text-xs);
                    color: var(--color-text-muted);
                }
                .cp-shortcuts kbd {
                    font-family: var(--font);
                    padding: 1px 5px;
                    background: var(--color-bg-tertiary);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-sm);
                    font-size: var(--text-xs);
                    margin-right: 4px;
                }

                /* Groups */
                .cp-groups { padding: var(--sp-2) 0; }
                .cp-group { margin-bottom: var(--sp-1); }
                .cp-group-label {
                    font-size: var(--text-xs);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: .05em;
                    color: var(--color-text-muted);
                    padding: var(--sp-2) var(--sp-5) var(--sp-1);
                }

                /* Items */
                .cp-item {
                    width: 100%;
                    display: flex; align-items: center; gap: var(--sp-3);
                    padding: var(--sp-3) var(--sp-5);
                    border: none; background: none;
                    font-family: var(--font);
                    font-size: var(--text-sm);
                    color: var(--color-text);
                    cursor: pointer;
                    text-align: left;
                    transition: background var(--dur-fast);
                }
                .cp-item:hover, .cp-item--active {
                    background: var(--color-primary-subtle);
                }
                .cp-item--active .cp-item-label { color: var(--color-primary); }
                .cp-item-icon {
                    width: 18px; height: 18px;
                    color: var(--color-text-muted);
                    flex-shrink: 0;
                }
                .cp-item--active .cp-item-icon { color: var(--color-primary); }
                .cp-item-text {
                    flex: 1;
                    display: flex; flex-direction: column;
                    min-width: 0;
                }
                .cp-item-label {
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .cp-item-sub {
                    font-size: var(--text-xs);
                    color: var(--color-text-muted);
                }
                .cp-item-arrow {
                    width: 14px; height: 14px;
                    color: var(--color-text-muted);
                    opacity: 0;
                    transition: opacity var(--dur-fast);
                    flex-shrink: 0;
                }
                .cp-item:hover .cp-item-arrow,
                .cp-item--active .cp-item-arrow { opacity: 1; }

                /* Footer */
                .cp-footer {
                    padding: var(--sp-3) var(--sp-5);
                    border-top: 1px solid var(--color-border-light);
                    display: flex; align-items: center; justify-content: space-between;
                }
            `}</style>
        </div>
    );
}

export default CommandPalette;
