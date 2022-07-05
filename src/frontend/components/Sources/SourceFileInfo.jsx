import React from 'react';

// Components
import { Button, IconArrowLeft, IconCaretDown, Text } from '@frontify/fondue';
import { SourceStatusIcon } from './SourceStatusIcon';

// Router
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';

// i18n
import { useTranslation } from 'react-i18next';

function SourceStateInfo({ source, loading, transferMap }) {
    return (
        <div>
            {source.state == 'same' && !loading ? (
                <Text size="x-small" color="weak" whitespace="nowrap" overflow="ellipsis">
                    Last revision by {source.remote?.modifier_name} {source.remote?.modified_localized_ago}
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
        </div>
    );
}

/**
 * No Document
 * ----------------------------------------------------------------------------
 */
function NoSource() {
    const { t } = useTranslation();
    return (
        <custom-v-stack style={{ overflow: 'hidden' }}>
            <Text color="weak" size="small">
                {t('sources.no_open_document')}
            </Text>
            <custom-h-stack align-items="center">
                <Text weight="strong" whitespace="nowrap" overflow="ellipsis">
                    {t('sources.no_open_document_description')}
                </Text>
            </custom-h-stack>
        </custom-v-stack>
    );
}

/**
 * Remote
 * ----------------------------------------------------------------------------
 */
function RemoteSource({ source }) {
    return (
        <custom-v-stack gap="small" style={{ overflow: 'hidden' }}>
            <custom-v-stack style={{ overflow: 'hidden' }}>
                <Text color="weak" size="small">
                    {source.remote?.path}
                </Text>
                <custom-h-stack align-items="center">
                    <Text weight="strong" whitespace="nowrap" overflow="ellipsis">
                        {source.local.filename.replace('.sketch', '')}
                    </Text>
                </custom-h-stack>

                {/* Legacy: Not part of the design anymore but kept for reference */}

                {/* <SourceStateInfo
                source={source}
                loading={loading}
                transferMap={transferMap}
            ></SourceStateInfo> */}
            </custom-v-stack>
        </custom-v-stack>
    );
}

/**
 * Untracked
 * ----------------------------------------------------------------------------
 */

function UntrackedSource({ source }) {
    const { t } = useTranslation();
    return (
        <custom-v-stack>
            <Text color="weak" size="small">
                {t('sources.untracked')}
            </Text>
            <Text weight="strong" whitespace="nowrap" overflow="ellipsis">
                {source.local?.filename?.replace('.sketch', '')}
            </Text>
        </custom-v-stack>
    );
}

/**
 * Unsaved
 * ----------------------------------------------------------------------------
 */
function UnsavedSource({ source }) {
    return (
        <custom-v-stack>
            <Text color="weak" size="small">
                Unsaved Document
            </Text>
            <Text weight="strong" whitespace="nowrap" overflow="ellipsis">
                Save this file or checkout a remote file …
            </Text>
        </custom-v-stack>
    );
}

export function SourceFileInfo({ status, source, transferMap, loading }) {
    const { t } = useTranslation();

    return (
        <custom-h-stack flex style={{ height: '100%' }} align-items="center" stretch-children-height="true">
            <custom-h-stack
                padding-x="small"
                gap="medium"
                align-items="center"
                style={{ height: '100%', overflow: 'hidden', width: '100%' }}
            >
                <Link to="/sources">
                    <Button inverted="true" icon={<IconArrowLeft size="Size24"></IconArrowLeft>}></Button>
                </Link>

                <custom-h-stack gap="xx-small" align-items="center" style={{ overflow: 'hidden', width: '100%' }}>
                    {/* No open file detected */}
                    {!source.local && <NoSource></NoSource>}

                    {/* Tracked remote file */}
                    {source && source.remote?.id && <RemoteSource source={source}></RemoteSource>}

                    {/* Untracked */}
                    {source.local && source.local.filename && !source.remote?.id && (
                        <UntrackedSource source={source}></UntrackedSource>
                    )}

                    {/* Unsaved document */}
                    {source.local && !source.local.filename && <UnsavedSource source={source}></UnsavedSource>}
                </custom-h-stack>
            </custom-h-stack>
        </custom-h-stack>
    );
}
