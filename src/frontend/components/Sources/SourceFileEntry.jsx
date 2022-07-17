import React, { useState, useEffect } from 'react';

// Components
import { LoadingCircle, Text } from '@frontify/fondue';

export function SourceFileEntry({ file, path = '', name, onClick, loading = false, title = '' }) {
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
            <custom-h-stack>
                <custom-v-stack gap="xx-small" overflow="hidden">
                    <custom-breadcrumbs>
                        {breadcrumbs.map((breadcrumb, index) => (
                            <custom-h-stack gap="x-small" key={index} overflow="hidden">
                                <Text color="weak" size="small" key={index} overflow="ellipsis" whitespace="nowrap">
                                    {breadcrumb}
                                </Text>
                                <Text color="weak">
                                    <span style={{ opacity: 0.5 }}>/</span>
                                </Text>
                            </custom-h-stack>
                        ))}
                    </custom-breadcrumbs>
                    <Text padding="small" weight="strong" overflow="ellipsis" whitespace="nowrap">
                        {name}
                    </Text>
                </custom-v-stack>
                <custom-spacer></custom-spacer>
                <div style={{ minWidth: '24px' }}>
                    {loading && <LoadingCircle style="Positive" size="Small"></LoadingCircle>}
                </div>
            </custom-h-stack>
        </custom-palette-item>
    );
}
