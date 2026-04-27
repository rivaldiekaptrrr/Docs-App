import { useState, useRef, useCallback } from 'react';
import { uploadAPI, getImageUrl } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
    PhotoIcon,
    XMarkIcon,
    ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

/**
 * Reusable Image Paste Zone component
 * Supports: Ctrl+V paste from clipboard, drag & drop, and file picker
 */
function ImagePasteZone({
    images = [],
    onImagesChange,
    uploadType = 'general',
    label = 'Images',
    maxPreviewHeight = 120,
    disabled = false
}) {
    const [uploading, setUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const fileInputRef = useRef(null);
    const zoneRef = useRef(null);

    const toast = useToast();

    const uploadFile = useCallback(async (file) => {
        try {
            const response = await uploadAPI.uploadImage(file, uploadType);
            return { url: response.data.file.url, caption: file.name || 'Pasted Image' };
        } catch (error) {
            console.error('Failed to upload image:', error);
            throw error;
        }
    }, [uploadType]);

    const uploadFiles = useCallback(async (files) => {
        if (files.length === 0) return;
        setUploading(true);
        try {
            if (files.length === 1) {
                const newImage = await uploadFile(files[0]);
                onImagesChange([...images, newImage]);
            } else {
                const response = await uploadAPI.uploadImages(files, uploadType);
                const newImages = response.data.files.map(file => ({ url: file.url, caption: file.filename }));
                onImagesChange([...images, ...newImages]);
            }
        } catch (error) {
            toast.error('Failed to upload image(s)');
        } finally {
            setUploading(false);
        }
    }, [images, onImagesChange, uploadFile, uploadType, toast]);

    const handlePaste = useCallback(async (e) => {
        if (disabled) return;
        const clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData) return;
        const items = clipboardData.items;
        const imageFiles = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) imageFiles.push(file);
            }
        }
        if (imageFiles.length > 0) {
            e.preventDefault(); e.stopPropagation();
            await uploadFiles(imageFiles);
        }
    }, [disabled, uploadFiles]);

    const handleDragOver = useCallback((e) => { e.preventDefault(); if (!disabled) setIsDragOver(true); }, [disabled]);
    const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragOver(false); }, []);
    const handleDrop = useCallback(async (e) => {
        e.preventDefault(); setIsDragOver(false);
        if (disabled) return;
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) await uploadFiles(files);
    }, [disabled, uploadFiles]);

    const handleFileChange = useCallback(async (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) await uploadFiles(files);
        e.target.value = '';
    }, [uploadFiles]);

    const removeImage = useCallback((index) => {
        onImagesChange(images.filter((_, i) => i !== index));
    }, [images, onImagesChange]);

    const zoneActive = isDragOver || isFocused;

    return (
        <div style={{ marginBottom: 'var(--sp-4)' }}>
            {label && <label className="form-label">{label}</label>}

            {/* Paste / Drop Zone */}
            <div
                ref={zoneRef}
                tabIndex={0}
                onPaste={handlePaste}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onClick={() => zoneRef.current?.focus()}
                style={{
                    border: `2px dashed ${zoneActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--sp-5)',
                    textAlign: 'center',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    background: zoneActive ? 'var(--color-primary-subtle)' : 'var(--color-bg-tertiary)',
                    transition: 'all var(--dur-fast) var(--ease-in-out)',
                    outline: 'none',
                    opacity: disabled ? 0.5 : 1,
                    minHeight: '60px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--sp-2)'
                }}
            >
                {uploading ? (
                    <div className="flex items-center gap-2">
                        <div className="spinner" />
                        <span className="text-sm text-muted">Uploading…</span>
                    </div>
                ) : (
                    <>
                        <PhotoIcon style={{ width: 28, height: 28, color: 'var(--color-text-muted)', opacity: .5 }} />
                        <div className="text-sm text-muted">
                            <strong>Ctrl+V</strong> to paste, <strong>drag & drop</strong>, or{' '}
                            <span
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                style={{ color: 'var(--color-primary)', textDecoration: 'underline', cursor: 'pointer' }}
                            >
                                browse files
                            </span>
                        </div>
                    </>
                )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />

            {/* Image Previews */}
            {images.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: 'var(--sp-3)',
                    marginTop: 'var(--sp-3)'
                }}>
                    {images.map((img, idx) => (
                        <div key={idx} style={{ position: 'relative' }}>
                            <img
                                src={getImageUrl(img.url)}
                                alt={img.caption || 'Preview'}
                                className="img-thumb"
                                style={{
                                    width: '100%',
                                    maxHeight: `${maxPreviewHeight}px`,
                                    objectFit: 'contain',
                                    background: 'var(--color-bg-tertiary)'
                                }}
                                onClick={() => window.open(getImageUrl(img.url), '_blank')}
                            />
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    style={{
                                        position: 'absolute', top: -6, right: -6,
                                        background: 'var(--color-danger)', color: '#fff', borderRadius: 'var(--radius-full)',
                                        width: '20px', height: '20px', border: 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', padding: 0, transition: 'transform var(--dur-fast)'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <XMarkIcon style={{ width: 12, height: 12 }} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ImagePasteZone;
