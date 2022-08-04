import { LoadingCircle } from '@frontify/fondue';
import React, { useEffect, useState, useRef } from 'react';

import { Observer } from '../Core/Observer';

export function GridView({ onApply, onDragStart, onDrop, images, limit = 25, onIntersect, onSelect, thumbWidth }) {
    let ref = useRef(null);

    let [recentlyApplied, setRecentlyApplied] = useState(null);
    let [loading, setLoading] = useState(false);
    let [dragging, setDragging] = useState(false);

    useEffect(() => {
        deselect();
    }, [images]);

    const runCallbackAfterLoad = async (asset, callback = onApply, immediate = false) => {
        setLoading(true);
        setRecentlyApplied([]);
        setTimeout(() => {
            setRecentlyApplied(asset);
        });

        // We’re using a timeout here so that the animation can finish without
        // being interrupted by the blocking fetch request.

        setTimeout(
            async () => {
                try {
                    await callback();
                } catch (error) {
                    console.log('error', error);
                }

                setLoading(false);
            },
            immediate ? 0 : 250
        );
    };

    const deselect = () => {
        setRecentlyApplied([]);
        onSelect([]);
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
                            onFocus={() => {
                                onSelect([image]);
                            }}
                            onDoubleClick={() => {
                                runCallbackAfterLoad(image, onApply, false);
                            }}
                            onDragEnd={async (event) => {
                                runCallbackAfterLoad(image, onDrop, true);
                                setDragging(false);
                            }}
                            onDragStart={async () => {
                                onDragStart();
                                setDragging(true);
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
