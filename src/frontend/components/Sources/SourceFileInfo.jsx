import React from 'react';

// Components
import { IconArrowLeft, IconCaretDown, Text } from '@frontify/fondue';
import { SourceStatusIcon } from './SourceStatusIcon';

// Router
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';

// i18n
import { useTranslation } from 'react-i18next';

export function SourceFileInfo({ status, source, transferMap, loading }) {
    const { t } = useTranslation();

    return (
        <custom-h-stack flex style={{ height: '100%' }} align-items="center" stretch-children-height="true">
            <custom-h-stack
                gap="medium"
                align-items="center"
                style={{ height: '100%', overflow: 'hidden', width: '100%' }}
            >
                {/* <IconSketch size="Size24"></IconSketch> */}

                {/* <SourceStatusIcon status={status} state={source.state} loading={loading}></SourceStatusIcon> */}

                <Link to="/sources">
                    <IconArrowLeft size="Size24"></IconArrowLeft>
                </Link>

                <custom-h-stack gap="xx-small" align-items="center" style={{ overflow: 'hidden', width: '100%' }}>
                    {source && source.remote?.id ? (
                        <custom-v-stack gap="small" style={{ overflow: 'hidden' }}>
                            <custom-v-stack style={{ overflow: 'hidden' }}>
                                <custom-h-stack align-items="center">
                                    <Text size="x-small" weight="strong" whitespace="nowrap" overflow="ellipsis">
                                        {source.local.filename.replace('.sketch', '')}
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
                            <Text size="x-small" color="weak">
                                {t('sources.untracked')}
                            </Text>
                            <Text size="small" weight="strong" whitespace="nowrap" overflow="ellipsis" wrap>
                                {source.local.filename.replace('.sketch', '')}
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
