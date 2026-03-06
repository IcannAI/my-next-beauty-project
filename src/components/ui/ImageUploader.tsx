'use client';

import { useState, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

interface Props {
    onUpload: (url: string) => void;
    onRemove?: () => void;
    uploadEndpoint: string;
    currentImageUrl?: string | null;
    aspectRatio?: 'square' | 'product';
    maxSizeMB?: number;
    label?: string;
}

export default function ImageUploader({
    onUpload,
    onRemove,
    uploadEndpoint,
    currentImageUrl,
    aspectRatio = 'product',
    maxSizeMB = 5,
    label = '上傳圖片',
}: Props) {
    const [preview, setPreview] = useState<string | null>(
        currentImageUrl || null
    );
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const compressImage = useCallback(
        (file: File, maxWidth: number): Promise<Blob> => {
            return new Promise((resolve, reject) => {
                const canvas = document.createElement('canvas');
                const img = new window.Image();
                img.onload = () => {
                    const ratio = Math.min(maxWidth / img.width, 1);
                    canvas.width = img.width * ratio;
                    canvas.height = img.height * ratio;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject(new Error('Canvas error'));
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob(
                        blob => {
                            if (blob) resolve(blob);
                            else reject(new Error('Compression failed'));
                        },
                        'image/webp',
                        0.85
                    );
                };
                img.onerror = () => reject(new Error('Image load failed'));
                img.src = URL.createObjectURL(file);
            });
        },
        []
    );

    const handleFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setError('');

            const allowed = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowed.includes(file.type)) {
                setError('只支援 JPG、PNG、WebP 格式');
                return;
            }
            if (file.size > maxSizeMB * 1024 * 1024) {
                setError(`檔案大小不能超過 ${maxSizeMB}MB`);
                return;
            }

            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
            setUploading(true);
            setProgress(20);

            try {
                const maxWidth = aspectRatio === 'square' ? 400 : 800;
                const compressed = await compressImage(file, maxWidth);
                setProgress(50);

                const formData = new FormData();
                const compressedFile = new File(
                    [compressed],
                    file.name.replace(/\.[^.]+$/, '.webp'),
                    { type: 'image/webp' }
                );
                formData.append('file', compressedFile);

                const res = await fetch(uploadEndpoint, {
                    method: 'POST',
                    body: formData,
                });
                setProgress(90);

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || '上傳失敗');
                }

                const { url } = await res.json();
                setProgress(100);
                onUpload(url);
                URL.revokeObjectURL(objectUrl);
                setPreview(url);
            } catch (err) {
                setError(err instanceof Error ? err.message : '上傳失敗');
                setPreview(currentImageUrl || null);
                URL.revokeObjectURL(objectUrl);
            } finally {
                setUploading(false);
                setProgress(0);
                if (inputRef.current) inputRef.current.value = '';
            }
        },
        [compressImage, uploadEndpoint, onUpload, currentImageUrl, maxSizeMB, aspectRatio]
    );

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        setError('');
        if (inputRef.current) inputRef.current.value = '';
        onRemove?.();
    };

    const containerClass =
        aspectRatio === 'square'
            ? 'w-32 h-32 rounded-full'
            : 'w-full h-48 rounded-xl';

    return (
        <div className="flex flex-col items-center gap-2">
            <div
                className={`${containerClass} relative overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-rose-400 transition-colors`}
                onClick={() => !uploading && inputRef.current?.click()}
            >
                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt="預覽"
                            className="w-full h-full object-cover"
                        />
                        {!uploading && (
                            <button
                                onClick={handleRemove}
                                className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors"
                                title="移除圖片"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                        {!uploading && (
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                                <span className="text-white text-sm font-bold">更換圖片</span>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                        <span className="text-3xl">📷</span>
                        <span className="text-xs mt-1 font-medium">{label}</span>
                    </div>
                )}

                {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                        <div className="w-3/4 h-1.5 bg-gray-600 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-rose-500 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-white text-xs font-bold">{progress}%</span>
                    </div>
                )}
            </div>

            {error && (
                <p className="text-xs text-red-500 font-medium">{error}</p>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
            />

            <p className="text-xs text-gray-400 dark:text-gray-500">
                支援 JPG、PNG、WebP，最大 {maxSizeMB}MB
            </p>
        </div>
    );
}
