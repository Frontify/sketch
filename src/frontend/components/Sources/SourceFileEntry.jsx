import React, { useState, useEffect } from 'react';

// Components
import { IconArrowRight, IconFrequentlyUsed, IconSketch, LoadingCircle, Text } from '@frontify/fondue';

import { timeAgo } from '../utils';
import { SourceAction } from './SourceAction';
import { SourceFileInfoText } from './SourceFileInfo';

export function SourceFileEntry({
    document,
    path = '',
    onClick,
    loading = false,
    selected = false,
    title = '',
    recent = true,
    children,
}) {
    const [breadcrumbs, setBreadcrumbs] = useState([]);

    useEffect(() => {
        setBreadcrumbs(() => {
            // remove leading and trailing slash from the path
            return path.split('/').slice(1, -1);
        });
    }, [path]);
    return (
        <custom-palette-item
            selectable="true"
            selected={selected}
            title={title}
            padding-y="medium"
            padding-x="large"
            onClick={() => {
                onClick();
            }}
        >
            <custom-h-stack align-items="center" gap="large">
                {selected ? (
                    <IconArrowRight size="Size24" style={{ flexShrink: 0 }}></IconArrowRight>
                ) : recent ? (
                    <IconFrequentlyUsed size="Size24" style={{ flexShrink: 0 }}></IconFrequentlyUsed>
                ) : (
                    <IconSketch size="Size24" style={{ flexShrink: 0 }}></IconSketch>
                )}

                <custom-h-stack style={{ width: '100%' }} gap="x-small" align-items="center">
                    <custom-v-stack gap="xx-small" overflow="hidden">
                        <SourceFileInfoText source={document}>
                            <Text size="small" color="weak">
                                {timeAgo(new Date(document.remote?.modifiedAt || document.timestamp))}
                            </Text>
                        </SourceFileInfoText>

                        {/* <pre>{document.remote?.modifiedAt}</pre>
                        <pre>{document.local?.localModifiedFromRemote}</pre> */}
                        {children}
                    </custom-v-stack>
                    <custom-spacer></custom-spacer>

                    <div custom-pointer-events="none">
                        <SourceAction status={document.state} actions={{}} interactive={false}></SourceAction>
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
