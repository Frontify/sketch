import React, { useState, useEffect } from 'react';

// Components
import { IconSketch, LoadingCircle, Text } from '@frontify/fondue';

import { timeAgo } from '../utils';
import { SourceAction } from './SourceAction';

export function SourceFileEntry({ document, file, path = '', name, onClick, loading = false, title = '', children }) {
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
                <custom-h-stack style={{ width: '100%' }} gap="x-small" align-items="center">
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
                        <custom-h-stack gap="xx-small" justify-content="space-between">
                            <custom-v-stack gap="xx-small">
                                <Text padding="small" weight="strong" overflow="ellipsis" whitespace="nowrap">
                                    {name}
                                </Text>
                                <Text size="small" color="weak">
                                    {timeAgo(new Date(document.remote?.modifiedAt || document.timestamp))}
                                </Text>
                            </custom-v-stack>
                        </custom-h-stack>

                        {/* <pre>{document.remote?.modifiedAt}</pre>
                        <pre>{document.local?.localModifiedFromRemote}</pre> */}
                        {children}
                    </custom-v-stack>
                    <custom-spacer></custom-spacer>
                    <div custom-pointer-events="none">
                        <SourceAction status={document.state} actions={{}}></SourceAction>
                    </div>
                </custom-h-stack>

                {/* <custom-spacer></custom-spacer>
                <div style={{ minWidth: '24px' }}>
                    {loading && <LoadingCircle style="Positive" size="Small"></LoadingCircle>}
                </div> */}
            </custom-h-stack>
        </custom-palette-item>
    );
}
