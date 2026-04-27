import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import {
    BlockNoteSchema,
    defaultBlockSpecs,
    createCodeBlockSpec,
} from "@blocknote/core";
import { codeBlockOptions } from "@blocknote/code-block";
import "@blocknote/mantine/style.css";
import { documentationAPI, uploadAPI, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import {
    ArrowLeftIcon,
    PencilSquareIcon,
    TrashIcon,
    CheckIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

// Create schema with code block that has syntax highlighting + language selector
const schema = BlockNoteSchema.create({
    blockSpecs: {
        ...defaultBlockSpecs,
        codeBlock: createCodeBlockSpec(codeBlockOptions),
    },
});

function DocumentationDetail({ isNew = false }) {
    const { projectId, docId } = useParams();
    const navigate = useNavigate();
    const { isRND } = useAuth();
    const toast = useToast();
    const { isDark } = useTheme();
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(isNew);

    const editor = useCreateBlockNote({
        schema,
        uploadFile: async (file) => {
            try {
                const response = await uploadAPI.uploadImage(file, 'documentation');
                return getImageUrl(response.data.file.url);
            } catch (error) {
                console.error('Failed to upload image:', error);
                return "https://via.placeholder.com/300?text=Upload+Failed";
            }
        }
    });

    useEffect(() => {
        if (!isNew && docId) { fetchDocument(); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [docId, isNew]);

    const fetchDocument = async () => {
        try {
            setLoading(true);
            const response = await documentationAPI.getById(docId);
            const doc = response.data.documentation;
            setTitle(doc.title);
            if (doc.content) {
                try {
                    const parsed = JSON.parse(doc.content);
                    if (Array.isArray(parsed)) {
                        editor.replaceBlocks(editor.document, parsed);
                    } else {
                        const blocks = await editor.tryParseHTMLToBlocks(doc.content);
                        editor.replaceBlocks(editor.document, blocks);
                    }
                } catch (e) {
                    const blocks = await editor.tryParseHTMLToBlocks(doc.content);
                    editor.replaceBlocks(editor.document, blocks);
                }
            }
        } catch (error) {
            console.error('Failed to fetch document:', error);
            navigate(`/projects/${projectId}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePaste = useCallback(async (e) => {
        if (!isEditing) return;
        const clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData) return;
        const items = clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.indexOf("image") !== -1) {
                e.preventDefault();
                e.stopPropagation();
                const file = item.getAsFile();
                if (file) {
                    try {
                        const response = await uploadAPI.uploadImage(file, 'documentation');
                        const url = getImageUrl(response.data.file.url);
                        const currentBlock = editor.getTextCursorPosition().block;
                        editor.insertBlocks([{
                            type: "image",
                            props: { url, name: file.name || "pasted-image", caption: "Image" }
                        }], currentBlock, "after");
                    } catch (error) {
                        toast.error('Failed to upload image');
                    }
                }
            }
        }
    }, [editor, isEditing]);

    const handleSave = async () => {
        if (!title.trim()) { toast.warning('Please enter a title'); return; }
        setSaving(true);
        try {
            const content = JSON.stringify(editor.document);
            if (isNew) {
                await documentationAPI.create({ project_id: projectId, title, content });
                navigate(`/projects/${projectId}`);
            } else {
                await documentationAPI.update(docId, { title, content });
                setIsEditing(false);
            }
        } catch (error) {
            toast.error('Failed to save documentation');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;
        try { await documentationAPI.delete(docId); navigate(`/projects/${projectId}`); }
        catch (error) { toast.error('Failed to delete document'); }
    };

    if (loading) {
        return (
            <div className="empty-state" style={{ minHeight: '60vh' }}>
                <div className="spinner spinner-lg" />
                <p className="mt-4">Loading document…</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => navigate(`/projects/${projectId}`)} className="btn btn-ghost btn-sm">
                    <ArrowLeftIcon style={{ width: 16, height: 16 }} /> Back to Project
                </button>
                {isRND() && (
                    <div className="flex gap-2">
                        {!isNew && !isEditing && (
                            <>
                                <button onClick={handleDelete} className="btn btn-danger-ghost btn-sm">
                                    <TrashIcon style={{ width: 15, height: 15 }} /> Delete
                                </button>
                                <button onClick={() => setIsEditing(true)} className="btn btn-primary btn-sm">
                                    <PencilSquareIcon style={{ width: 15, height: 15 }} /> Edit
                                </button>
                            </>
                        )}
                        {(isNew || isEditing) && (
                            <>
                                {!isNew && (
                                    <button onClick={() => { setIsEditing(false); fetchDocument(); }} className="btn btn-secondary btn-sm">
                                        <XMarkIcon style={{ width: 15, height: 15 }} /> Cancel
                                    </button>
                                )}
                                <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                                    {saving ? (
                                        <><div className="spinner" /> Saving…</>
                                    ) : (
                                        <><CheckIcon style={{ width: 16, height: 16 }} /> Save</>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Document Card */}
            <div className="card" style={{ minHeight: '80vh' }}>
                <div className="card-body" style={{ padding: 'var(--sp-10)' }}>
                    {/* Title */}
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Untitled"
                        readOnly={!isEditing}
                        style={{
                            width: '100%',
                            border: 'none',
                            fontSize: 'var(--text-3xl)',
                            fontWeight: 700,
                            letterSpacing: '-0.02em',
                            marginBottom: 'var(--sp-6)',
                            outline: 'none',
                            background: 'transparent',
                            color: 'var(--color-text)',
                            fontFamily: 'var(--font)',
                            borderBottom: isEditing ? '2px dashed var(--color-border)' : 'none',
                            paddingBottom: isEditing ? 'var(--sp-2)' : '0',
                            transition: 'border-color var(--dur-fast) var(--ease-in-out)'
                        }}
                    />

                    {/* Editor */}
                    <div className="editor-container" style={{ fontSize: '1.05rem', lineHeight: '1.7' }} onPasteCapture={handlePaste}>
                        <BlockNoteView editor={editor} editable={isEditing} theme={isDark ? 'dark' : 'light'} />
                    </div>
                </div>
            </div>

            <style>{`
                /* Code Block — always dark, terminal-style */
                .bn-container [data-content-type="codeBlock"] {
                    position: relative;
                    margin: var(--sp-4) 0;
                    display: table;
                    min-width: 280px;
                    max-width: 100%;
                }
                .bn-container [data-content-type="codeBlock"] pre {
                    background: hsl(220, 18%, 11%);
                    border: 1px solid hsl(220, 14%, 20%);
                    border-radius: var(--radius-lg);
                    padding: var(--sp-5) var(--sp-6);
                    padding-top: var(--sp-10);
                    overflow-x: auto;
                    font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'SF Mono', Consolas, 'Liberation Mono', monospace;
                    font-size: 0.82rem;
                    line-height: 1.7;
                    tab-size: 2;
                    color: hsl(220, 14%, 82%);
                    white-space: pre;
                    word-wrap: normal;
                    word-break: normal;
                }
                .bn-container [data-content-type="codeBlock"] code {
                    font-family: inherit;
                    background: none !important;
                    padding: 0;
                    border: none;
                    font-size: inherit;
                    color: inherit;
                    white-space: pre;
                }
                /* Force Shiki to not override background */
                .bn-container [data-content-type="codeBlock"] .shiki,
                .bn-container [data-content-type="codeBlock"] .shiki code {
                    background: transparent !important;
                }

                /* Language selector — pill style on dark bg */
                .bn-container [data-content-type="codeBlock"] > div[contenteditable="false"] {
                    position: absolute;
                    top: var(--sp-2);
                    right: var(--sp-3);
                    z-index: 2;
                }
                .bn-container [data-content-type="codeBlock"] select {
                    font-family: var(--font);
                    font-size: 11px;
                    padding: 2px 8px;
                    border: 1px solid hsl(220, 14%, 24%);
                    border-radius: var(--radius-sm);
                    background: hsl(220, 16%, 16%);
                    color: hsl(220, 14%, 60%);
                    cursor: pointer;
                    outline: none;
                    transition: all var(--dur-fast);
                    appearance: auto;
                }
                .bn-container [data-content-type="codeBlock"] select:hover {
                    border-color: hsl(226, 70%, 55%);
                    color: hsl(220, 14%, 85%);
                }
                .bn-container [data-content-type="codeBlock"] select:focus {
                    border-color: hsl(226, 70%, 55%);
                    box-shadow: 0 0 0 2px hsla(226, 70%, 55%, .2);
                }

                /* Scrollbar inside code blocks — subtle on dark */
                .bn-container [data-content-type="codeBlock"] pre::-webkit-scrollbar {
                    height: 6px;
                }
                .bn-container [data-content-type="codeBlock"] pre::-webkit-scrollbar-track {
                    background: transparent;
                }
                .bn-container [data-content-type="codeBlock"] pre::-webkit-scrollbar-thumb {
                    background: hsl(220, 14%, 26%);
                    border-radius: 3px;
                }
                .bn-container [data-content-type="codeBlock"] pre::-webkit-scrollbar-thumb:hover {
                    background: hsl(220, 14%, 34%);
                }
            `}</style>
        </div>
    );
}

export default DocumentationDetail;
