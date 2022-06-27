import { LoadingCircle } from '@frontify/fondue';
import React, { useEffect, useState, useRef } from 'react';
import { useSketch } from '../../hooks/useSketch';

import { Observer } from './Observer';

export function GridView({ images, limit = 25, onIntersect, onSelect, thumbWidth }) {
    let ref = useRef(null);
    let [recentlyApplied, setRecentlyApplied] = useState(null);
    let [loading, setLoading] = useState(false);

    useEffect(() => {
        deselect();
    }, [images]);

    const applyAsset = async (asset) => {
        setLoading(true);
        setRecentlyApplied([]);
        setTimeout(() => {
            setRecentlyApplied(asset);
        });

        // We’re using a timeout here so that the animation can finish without
        // being interrupted by the blocking fetch request.

        setTimeout(async () => {
            try {
                await useSketch('applyLibraryAsset', { asset });
            } catch (error) {}

            setLoading(false);
        }, 250);
    };

    const deselect = () => {
        setRecentlyApplied([]);
        onSelect([]);
    };

    const getBase64Image = async (url) => {
        const response = await fetch(url);
        const blob = await response.blob();
        const reader = new FileReader();
        await new Promise((resolve, reject) => {
            reader.onload = resolve;
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
        return reader.result.replace(/^data:.+;base64,/, '');
    };

    return (
        <custom-grid
            ref={ref}
            gap="small"
            onClick={(event) => {
                if (event.target == ref.current) {
                    deselect();
                }
            }}
        >
            {images && images.length ? (
                images.map((image, index) => {
                    return (
                        <custom-grid-item
                            title={image.title}
                            key={index}
                            tabindex="0"
                            style={{
                                animationDelay: `${(index % limit) * 10}ms`,
                                zIndex: recentlyApplied && recentlyApplied.id == image.id ? 2 : 1,
                            }}
                            onFocus={(event) => {
                                onSelect([image]);
                            }}
                            onClick={(event) => {
                                if (event.detail == 2) {
                                    applyAsset(image);
                                }
                            }}
                            onDragEnd={(event) => {}}
                            onDragStart={async (event) => {
                                // By default, images can be drag & dropped into Sketch.
                                // The problem: they will have the same size as the preview.
                                // But because we don’t want to display high resolution previews
                                // the dropped images will be too small to be useful.
                                // A workaround could be to overlay the selected image with an
                                // invisible high res <img>. But this wouldn’t support multi-select …
                                // event.preventDefault();
                            }}
                        >
                            {image.downloadUrl && (
                                <img
                                    src={
                                        image.extension == 'svg'
                                            ? image.downloadUrl
                                            : `${image.previewUrl}?width=${thumbWidth}`
                                    }
                                    alt={image.title}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        opacity: recentlyApplied && recentlyApplied.id == image.id && loading ? 0.2 : 1,
                                    }}
                                />
                            )}
                            {image.downloadUrl && loading && recentlyApplied && recentlyApplied.id == image.id ? (
                                <custom-grid-item-ghost>
                                    {loading ? <LoadingCircle></LoadingCircle> : ''}
                                    <img
                                        className="ghost"
                                        src={
                                            image.extension == 'svg'
                                                ? image.downloadUrl
                                                : `${image.previewUrl}?width=${thumbWidth}`
                                        }
                                        alt={image.title}
                                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                                    />
                                </custom-grid-item-ghost>
                            ) : (
                                ''
                            )}
                        </custom-grid-item>
                    );
                })
            ) : (
                <div></div>
            )}
            <Observer onIntersect={onIntersect}></Observer>
        </custom-grid>
    );
}
