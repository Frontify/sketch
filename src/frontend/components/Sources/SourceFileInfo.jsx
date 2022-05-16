import React from 'react';
import { IconCaretDown, Text } from '@frontify/arcade';
import { SourceStatusIcon } from './SourceStatusIcon';
export function SourceFileInfo({ status, source, transferMap, loading }) {
    return (
        <custom-h-stack flex style={{ height: '100%' }} align-items="center" stretch-children-height="true">
            <custom-h-stack
                gap="small"
                align-items="center"
                style={{ height: '100%', overflow: 'hidden', width: '100%' }}
            >
                {/* <IconSketch size="Size24"></IconSketch> */}

                <SourceStatusIcon status={status} state={source.state} loading={loading}></SourceStatusIcon>
                <custom-h-stack gap="xx-small" align-items="center" style={{ overflow: 'hidden', width: '100%' }}>
                    {source && source.remote?.id ? (
                        <custom-v-stack gap="small" style={{ overflow: 'hidden' }}>
                            <custom-v-stack style={{ overflow: 'hidden' }}>
                                <custom-h-stack align-items="center">
                                    <Text size="x-small" weight="strong" whitespace="nowrap" overflow="ellipsis">
                                        {source.local.filename}
                                    </Text>
                                </custom-h-stack>
                                {source.state == 'same' && !loading ? (
                                    <Text size="x-small" color="weak" whitespace="nowrap" overflow="ellipsis">
                                        Last revision by {source.remote?.modifier_name}{' '}
                                        {source.remote?.modified_localized_ago}
                                    </Text>
                                ) : (
                                    ''
                                )}
                                {source.state == 'push' && !loading ? (
                                    <custom-h-stack align-items="center" gap="xx-small">
                                        <Text size="x-small" color="weak">
                                            Push changes
                                        </Text>
                                    </custom-h-stack>
                                ) : (
                                    ''
                                )}
                                {loading ? (
                                    status == 'PUSHING' ? (
                                        <Text size="x-small" color="weak">
                                            Pushing …{' '}
                                            {transferMap[source.remote?.id]?.progress ? (
                                                <span style={{ fontFeatureSettings: 'tnum' }}>
                                                    {Math.floor(transferMap[source.remote?.id]?.progress)}%
                                                </span>
                                            ) : (
                                                ''
                                            )}
                                        </Text>
                                    ) : '' || status == 'FETCHING' ? (
                                        <Text size="x-small" color="weak">
                                            Fetching …
                                        </Text>
                                    ) : (
                                        ''
                                    )
                                ) : (
                                    ''
                                    // <Text size="x-small" color="weak">
                                    //     Last fetched {relativeLastFetched}
                                    // </Text>
                                )}
                            </custom-v-stack>
                        </custom-v-stack>
                    ) : source.local.filename ? (
                        <custom-v-stack>
                            <Text size="x-small" weight="strong" whitespace="nowrap" overflow="ellipsis" wrap>
                                {source.local.filename}
                            </Text>
                            <Text size="x-small" color="weak">
                                Untracked Document
                            </Text>
                        </custom-v-stack>
                    ) : (
                        <custom-v-stack>
                            <Text size="x-small" weight="strong" whitespace="nowrap" overflow="ellipsis" wrap>
                                Unsaved Document
                            </Text>
                            <Text size="x-small" color="weak">
                                Save this file or checkout a remote file …
                            </Text>
                        </custom-v-stack>
                    )}
                    <custom-spacer></custom-spacer>
                    <div style={{ flex: 0 }}>
                        <IconCaretDown></IconCaretDown>
                    </div>
                </custom-h-stack>
            </custom-h-stack>
        </custom-h-stack>
    );
}
