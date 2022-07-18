import React, { useState, useEffect } from 'react';

// Components
import { IconSketch, LoadingCircle, Text } from '@frontify/fondue';

import { timeAgo } from '../utils';

export function SourceFileEntry({ document, file, path = '', name, onClick, loading = false, title = '' }) {
    const [breadcrumbs, setBreadcrumbs] = useState([]);

    useEffect(() => {
        setBreadcrumbs(() => {
            // remove leading and trailing slash from the path
            return path.split('/').slice(1, -1);
        });
    }, [path]);
    return (
        <custom-palette-item
            title={title}
            padding-y="medium"
            padding-x="large"
            onClick={() => {
                onClick();
            }}
        >
            <custom-h-stack align-items="center" gap="large">
                <IconSketch size="Size24" style={{ flexShrink: 0 }}></IconSketch>
                <custom-v-stack gap="xx-small" overflow="hidden">
                    <custom-breadcrumbs>
                        {breadcrumbs.map((breadcrumb, index) => (
                            <custom-h-stack gap="x-small" key={index} overflow="hidden">
                                <Text color="weak" size="small" key={index} overflow="ellipsis" whitespace="nowrap">
                                    {breadcrumb}
                                </Text>
                                {index < breadcrumbs.length - 1 && (
                                    <Text color="weak">
                                        <span style={{ opacity: 0.5 }}>/</span>
                                    </Text>
                                )}
                            </custom-h-stack>
                        ))}
                    </custom-breadcrumbs>
                    <Text padding="small" weight="strong" overflow="ellipsis" whitespace="nowrap">
                        {name}
                    </Text>
                    <Text size="small" color="weak">
                        {timeAgo(new Date(document.remote?.modifiedAt))}
                    </Text>
                    <pre>{document.remote?.modifiedAt}</pre>
                    <pre>{document.local?.localModifiedFromRemote}</pre>
                </custom-v-stack>
                {/* <custom-spacer></custom-spacer>
                <div style={{ minWidth: '24px' }}>
                    {loading && <LoadingCircle style="Positive" size="Small"></LoadingCircle>}
                </div> */}
            </custom-h-stack>
        </custom-palette-item>
    );
}
